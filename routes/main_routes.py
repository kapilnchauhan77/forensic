import json
import logging
import os
import sys
import tempfile
import time
import uuid

import requests
from flask import (
    Blueprint,
    Response,
    jsonify,
    render_template,
    request,
    send_from_directory,
    stream_with_context,
)
from pdf2image import convert_from_path
from PIL import Image
from werkzeug.utils import secure_filename

from config import Config
from services.cache_service import cache_system_prompt, clear_old_cache
from services.extraction_service import process_extraction
from services.gcs_service import download_file_from_gcs, get_uri
from services.gemini_call import get_gemini_resp
from services.gemini_ocr_service import extract_text_with_gemini_flash
from services.ocr_service import detect_text_in_image, detect_text_in_xml, ocr_router
from services.processing_service import extract_text_from_pdf
from services.validation_service import validate_doc
from utils.base_sys_prompts import (
    FIRST_PAGE_DETERMINER,
    data_extraction_prompt,
    description_prompt,
    get_fields_base_prompt,
    get_fields_without_doc_type,
)
from utils.cumulate_all_fields import cumulate_all_fields
from utils.data_util import transform_data
from utils.doc_ref_creator import create_doc_ref
from utils.doc_type_classification import classify_doc
from utils.fetch_feature_names import fetch_feature_names
from utils.smart_split import llmpdfsplit
from utils.xml_utils import generate_xml_from_images

# 1. Configure logging to output to the console (stdout)
# This setup ensures logs are sent where Cloud Run can see them.
logging.basicConfig(
    stream=sys.stdout,
    level=logging.INFO,
    format="%(asctime)s - %(levelname)s - %(message)s",
)
routes = Blueprint("routes", __name__)


# ✅ Route 1: Serve index page
@routes.route("/")
def index():
    return render_template("index.html")


# ✅ Route 2: Upload a ZIP file, process documents
@routes.route("/upload", methods=["POST"])
def upload():
    try:
        if "file" not in request.files:
            return jsonify({"error": "No file part in the request"}), 400

        file = request.files["file"]

        if file.filename == "":
            return jsonify({"error": "No file selected"}), 400

        env = request.form.get("env", "dev").upper()

        if env not in ["PROD", "DEV"]:
            return (
                jsonify({"error": "Invalid environment. Must be 'prod' or 'dev'"}),
                400,
            )

        filename = secure_filename(file.filename)

        os.makedirs(Config.UPLOAD_FOLDER, exist_ok=True)

        temp_path = os.path.join(Config.UPLOAD_FOLDER, filename)
        file.save(temp_path)

        try:
            from services.gcs_service import upload_file_to_gcs
        except ImportError:
            raise Exception("Could not import upload_file_to_gcs from gcs_service")

        # Determine bucket name based on environment
        # You may need to adjust these bucket names based on your actual GCS setup
        bucket_name = "procys-service-prod" if env == "PROD" else "procys-service-dev"

        # Create blob name with folder structure
        folder = "prod" if env == "PROD" else "dev"
        blob_name = f"{folder}/{filename}"

        try:
            # Upload to GCS
            gcs_path = upload_file_to_gcs(temp_path, bucket_name, blob_name, env)

            # Clean up temporary file
            if os.path.exists(temp_path):
                os.remove(temp_path)

            return (
                jsonify(
                    {
                        "message": "File uploaded successfully",
                        "path": gcs_path,
                        "environment": env.lower(),
                    }
                ),
                200,
            )

        except Exception as e:
            # Clean up temporary file in case of error
            if os.path.exists(temp_path):
                os.remove(temp_path)
            raise e

    except Exception as e:
        return jsonify({"error": f"Upload failed: {str(e)}"}), 500


# ✅ Route 3: Process a document (OCR + AI Processing)
@routes.route("/process", methods=["POST"])
def process():
    data = request.json
    print("process endpoint", data)
    start_time = time.time()
    if data is None:
        return jsonify({"error": "Missing Data"}), 400

    required_fields = ["documentPath", "environment", "redirectURL"]

    for field in required_fields:
        if field not in data:
            return jsonify({"error": f"Missing required field: {field}"}), 400

    base_data = None
    if "documentReference" not in data:
        if "feature_names" not in data or len(data["feature_names"]) == 0:
            if "workflowID" not in data:
                return (
                    jsonify(
                        {
                            "error": f"Missing required field: feature_names or workflowID"
                        }
                    ),
                    400,
                )
            base_data, data["documentReference"] = fetch_feature_names(
                data["workflowID"], data["environment"]
            )
            if base_data is None:
                return jsonify({"error": data["documentReference"]}), 400

        else:
            data["documentReference"] = create_doc_ref(data)

    document_path = data["documentPath"]
    redirect_url = data["redirectURL"]
    env = data["environment"]
    project = data.get("project", Config.PROJECT)
    # ocr_type = data.get("ocrPreference", 'gcp_vision')
    ocr_type = data.get("ocrPreference", "gemini_flash")
    get_xml = data.get("getXML", False)
    if len(ocr_type) < 3:
        ocr_type = "gemini_flash"
    llm_to_use = data.get("llmPreference", "gemini_flash")
    if len(llm_to_use) < 3:
        llm_to_use = "gemini_flash"
    document_reference = data["documentReference"]
    document_type = (
        document_reference["documentType"].lower().replace(" ", "").strip()
        if "documentType" in document_reference
        else ""
    )
    if len(document_type) > 10:
        document_type = document_type[:10]
    # print("Processing:", document_path.split("/")[-1])

    features = {
        field["name"]: (
            field["description"]
            + (
                "\nDesired Format: " + field["desiredFormat"]
                if "desiredFormat" in field
                else ""
            )
        )
        for field in document_reference["fields"]
        if field["section"] == "header"
    }
    # print("\n\n\n\nfeatures:")
    features["lines"] = {
        field["name"]: (
            field["description"]
            + (
                "\nDesired Format: " + field["desiredFormat"]
                if "desiredFormat" in field
                else ""
            )
        )
        for field in document_reference["fields"]
        if field["section"] in ["lines", "vat"]
    }
    vat_field = [
        field["name"]
        for field in document_reference["fields"]
        if field["section"] == "vat"
    ]
    feature_type = {
        d["name"]: (
            d.get("type", "text")
            if d.get("type", "text") in Config.ALLOWED_TYPES
            else "text"
        )
        for d in document_reference["fields"]
    }

    # print(features, "\n\n\n\n")
    # print(features)
    temp_dir = tempfile.mkdtemp(prefix="gcsdl_")
    if "local" in env.lower():
        local_file = document_path
    else:
        local_file = download_file_from_gcs(
            document_path, env, destination_dir=temp_dir
        )
    if local_file is None:
        return jsonify({"error": "Document not found in GCS or access denied"}), 400

    system_prompt = cache_system_prompt(features=features)
    if local_file.endswith(".pdf"):
        try:
            total_ocr_token, total_llm_token, extracted_data, num_pages, xml_data = (
                extract_text_from_pdf(
                    local_file,
                    Config.TEMP_IMAGES,
                    env,
                    features=features,
                    doc_type=document_type,
                    ocr_type=ocr_type,
                    llm_to_use=llm_to_use,
                    system_prompt=system_prompt,
                    get_xml=get_xml,
                    project_name=project,
                )
            )
        except Exception as e:
            print("Error at data extraction:", str(e))
            time.sleep(10)
            # local_file = download_file_from_gcs(document_path, env)
            local_file = download_file_from_gcs(
                document_path, env, destination_dir=temp_dir
            )
            total_ocr_token, total_llm_token, extracted_data, num_pages, xml_data = (
                extract_text_from_pdf(
                    local_file,
                    Config.TEMP_IMAGES,
                    env,
                    features=features,
                    doc_type=document_type,
                    ocr_type=ocr_type,
                    llm_to_use=llm_to_use,
                    get_xml=get_xml,
                    project_name=project,
                )
            )
    elif local_file.endswith(".xml") or local_file.endswith(".txt"):
        total_ocr_token, (total_llm_token, extracted_data) = detect_text_in_xml(
            local_file,
            features=features,
            doc_type=document_type,
            file_type=local_file.split(".")[-1],
            llm_to_use=llm_to_use,
        )
        num_pages = 1
        xml_data = ""
    else:
        # print('extracting from image')
        total_ocr_token, total_llm_token, extracted_data = detect_text_in_image(
            local_file,
            features=features,
            doc_type=document_type,
            ocr_type=ocr_type,
            llm_to_use=llm_to_use,
            system_prompt=system_prompt,
            project_name=project,
        )
        num_pages = 1
        image = Image.open(local_file)
        xml_data = generate_xml_from_images([image], env=env) if get_xml else ""

    if base_data:
        extracted_data, features, document_type = classify_doc(
            extracted_data, base_data
        )

    logging.info(json.dumps(extracted_data))
    print(json.dumps(extracted_data), flush=True)
    transformed_entry = transform_data(
        extracted_data=extracted_data,
        features=features,
        vat_field=vat_field,
        feature_type=feature_type,
    )
    transformed_entry["totalPages"] = num_pages
    transformed_entry["pagesProcessed"] = num_pages
    transformed_entry["xml"] = xml_data
    transformed_entry["file_name"] = os.path.basename(local_file)
    transformed_entry["documentType"] = document_type
    logging.info(json.dumps(transformed_entry))
    print(json.dumps(transformed_entry), flush=True)

    if "xml" in env:
        print(
            xml_data, file=open(local_file.split("/")[-1].split(".")[0] + ".xml", "w")
        )
    total_time = time.time() - start_time
    log_entry = {
        "severity": "INFO",
        "message": f"Token usage for request {document_path}",
        "request_endpoitn": "process",
        "request_id": document_path,
        "total_ocr_tokens_count": total_ocr_token,
        "llm_input_tokens_count": total_llm_token.get("input_tokens_count", 0),
        "llm_output_tokens_count": total_llm_token.get("output_tokens_count", 0),
        "total_time": total_time,
        "num_pages": num_pages,
        "time_per_page": ((total_time / num_pages) if num_pages > 0 else (total_time)),
    }
    # Print the JSON string to stdout
    logging.info(json.dumps(log_entry))
    print(json.dumps(log_entry), flush=True)

    # try:
    # cleanup_folder(Config.UPLOAD_FOLDER)
    # cleanup_folder(Config.FINAL_OUTPUT)
    # cleanup_folder(Config.EXTRACTION_FOLDER)
    # cleanup_folder(Config.PROMPT_CACHE_FOLDER)
    # cleanup_folder(Config.TEMP_IMAGES)
    # except Exception as e:
    #     print("file removal issue:", str(e), '\n\n\n')

    try:
        response = requests.post(redirect_url, json=transformed_entry)
        print("POST api Reponse:", response.json())
    except Exception as e:
        print("Final Output:", transformed_entry)
        print("POST issue:", str(e), "\n\n\n")

    if env != "local":
        if os.path.exists(local_file):
            os.remove(local_file)

    return jsonify({"message": "Processing complete", "data": transformed_entry})


# ✅ Route 4: Download extracted JSON file
@routes.route("/downloads/<filename>")
def download(filename):
    return send_from_directory(Config.FINAL_OUTPUT, filename)


# Route 5: Clear all cache
@routes.route("/cache-clear", methods=["POST"])
def clear_cache():
    data = request.json
    if data and "documentType" in data:
        document_type = data["documentType"].lower().replace(" ", "").strip()
        if len(document_type) > 10:
            document_type = document_type[:10]
        if os.path.exists(
            os.path.join(Config.PROMPT_CACHE_FOLDER, f"{document_type}.json")
        ):
            os.remove(os.path.join(Config.PROMPT_CACHE_FOLDER, f"{document_type}.json"))
        return jsonify({"message": f"Cache clear for {document_type}"})
    days = data.get("days", 7) if data else 7
    clear_old_cache(days)
    return jsonify({"message": f"Cache older than {days} days cleared."})


# Route 6: Process only the text
@routes.route("/process_text", methods=["POST"])
def process_text():
    data = request.get_json()
    print("Process Text Request: ", data)
    start_time = time.time()
    upload_id = data.get("upload_id")
    input_text = data.get("text")
    return_tokens_count = data.get("return_tokens_count", True)
    features = data.get("features")["features"]
    feature_dict = {
        d["name"]: d["description"] for d in features if d["section"] == "header"
    }
    feature_dict["lines"] = {
        field["name"]: (
            field["description"]
            + (
                "\nDesired Format: " + field["desiredFormat"]
                if "desiredFormat" in field
                else ""
            )
        )
        for field in features
        if field["section"] in ["lines", "vat"]
    }
    vat_field = [field["name"] for field in features if field["section"] == "vat"]
    feature_type = {
        d["name"]: (
            d.get("type", "text")
            if d.get("type", "text") in Config.ALLOWED_TYPES
            else "text"
        )
        for d in features
    }
    llm_to_use = data.get("llmPreference", "")
    project = data.get("project", Config.PROJECT)
    if (
        not isinstance(input_text, str)
        or not isinstance(upload_id, int)
        or not isinstance(feature_dict, dict)
    ):
        return (
            jsonify(
                {
                    "error": "Text, upload_id and features are required, features should be a dictionary, upload_id an integer and input_text a string."
                }
            ),
            400,
        )
    extracted_data, tokens = process_extraction(
        input_text,
        features,
        llm_to_use=llm_to_use,
        return_tokens_count=True,
        project_name=project,
    )

    extracted_data = transform_data(
        extracted_data, feature_dict, vat_field=vat_field, feature_type=feature_type
    )

    total_time = time.time() - start_time
    log_entry = {
        "severity": "INFO",
        "message": f"Token usage for request {upload_id}",
        "request_endpoint": "process_text",
        "request_id": upload_id,
        "input_tokens_count": tokens.get("input_tokens_count", 0),
        "output_tokens_count": tokens.get("output_tokens_count", 0),
        "total_time": total_time,
    }
    # Print the JSON string to stdout
    logging.info(json.dumps(log_entry))
    # print(json.dumps(log_entry))
    print(json.dumps(log_entry), flush=True)
    # if return_tokens_count:
    return jsonify(
        {
            "message": "Processing complete",
            "data": extracted_data,
            "input_tokens_count": tokens.get("input_tokens_count", 0),
            "output_tokens_count": tokens.get("output_tokens_count", 0),
        }
    )
    # else:
    #     return jsonify({"message": "Processing complete", "data": extracted_data})


# Route 7: Make better description
@routes.route("/generate_description", methods=["POST"])
def generate_description():
    data = request.json
    required_fields = [
        "fieldName",
        "fieldBaseDescription",
        "documentType",
        "documentTypeDescription",
    ]
    print("Request: ", data)

    for field in required_fields:
        if field not in data:
            return jsonify({"error": f"Missing required field: {field}"}), 400

    system_prompt = description_prompt(
        data["documentType"],
        data["documentTypeDescription"],
        data["fieldName"],
        data["fieldBaseDescription"],
    )
    # print("Sys:", system_prompt)
    msgs = [
        {
            "role": "user",
            "content": [{"type": "text", "text": str("Provide Description")}],
        },
        {
            "role": "assistant",
            "content": [{"type": "text", "text": "<extraction_planning>"}],
        },
    ]
    if "project" in data:
        resp = get_gemini_resp(
            system_prompt=system_prompt,
            msgs=msgs,
            json_mode=False,
            project_name=data["project"],
        )
    else:
        resp = get_gemini_resp(system_prompt=system_prompt, msgs=msgs, json_mode=False)
    print("New Desc:", resp)
    return jsonify(
        {
            "message": "Description Generated",
            "data": resp.split("</prompt_description>")[0]
            .strip()
            .split("<prompt_description>")[-1]
            .strip(),
        }
    )


# Route 8: Create many feature descriptions
@routes.route("/create_feature_description", methods=["POST"])
def create_feature_description():
    data = request.json
    required_fields = ["documentType", "feature_names"]
    print("Request: ", data)

    for field in required_fields:
        if field not in data:
            return jsonify({"error": f"Missing required field: {field}"}), 400

    doc_ref = create_doc_ref(data)
    return jsonify({"message": "Descriptions Generated", "data": doc_ref})


# Route 9: Validate the result
@routes.route("/validation", methods=["POST"])
def result_validation():
    data = request.json
    if data is None:
        return jsonify({"error": "Missing Data"}), 400

    required_fields = ["documentPath", "documentReference", "documentResult"]
    doc_ref = data["documentReference"]
    for field in required_fields:
        if field not in data:
            return jsonify({"error": f"Missing required field: {field}"}), 400
    # print(doc_ref)
    fields = doc_ref["fields"]
    features = {
        field["name"]: (
            field["description"]
            + (
                "\nDesired Format: " + field["desiredFormat"]
                if "desiredFormat" in field
                else ""
            )
        )
        for field in fields
        if field["section"] == "header"
    }
    features["lines"] = {
        field["name"]: (
            field["description"]
            + (
                "\nDesired Format: " + field["desiredFormat"]
                if "desiredFormat" in field
                else ""
            )
        )
        for field in features
        if field["section"] in ["lines", "vat"]
    }
    temp_dir = tempfile.mkdtemp(prefix="gcsdl_")
    env = data.get("environment", "dev")
    if env == "local":
        local_file = data["documentPath"]
    else:
        local_file = download_file_from_gcs(
            data["documentPath"], env, destination_dir=temp_dir
        )
    if local_file is None:
        return jsonify({"error": "Document not found in GCS or access denied"}), 400

    validation_res = validate_doc(
        local_file,
        doc_ref["documentType"],
        doc_ref["documentTypeDescription"],
        fields,
        data["documentResult"],
    )
    return jsonify(
        {
            "message": "Validated Result",
            "data": validation_res.split("<json_output>")[-1]
            .split("</json_output>")[0]
            .strip(),
        }
    )


# Route 10: Smart Split
@routes.route("/smart-split", methods=["POST"])
def smart_split():
    try:
        data = request.json
        if data is None:
            return jsonify({"error": "Missing Data"}), 400
        if (
            "filePath" not in data
            or "env" not in data
            or data["env"] not in ["PROD", "DEV", "local"]
        ):
            return (
                jsonify(
                    {"error": "Need filePath, project and env['PROD', 'DEV', 'local']"}
                ),
                400,
            )

        project = data.get("project", Config.PROJECT)
        uri = get_uri(data["filePath"], env=data["env"])
        if uri is None:
            return jsonify({"error": "Issue with uri"}, 400)
        res = llmpdfsplit(uri, False, "gemini-2.0-flash", project)
        return jsonify(res), 200

    except Exception as e:
        return jsonify({"error": str(e)}), 400


# Route 11: OCR
@routes.route("/perform-ocr", methods=["POST"])
def perform_ocr():
    try:
        data = request.json
        if data is None:
            return jsonify({"error": "Missing Data"}), 400

        print("ocr Request: ", data)
        project = data.get("project", Config.PROJECT)
        model = data.get("model", Config.OCR_MODEL)
        base_prompt = data.get("prompt", None)

        if data["env"] not in ["PROD", "DEV", "local"]:
            return (
                jsonify({"error": "Invalid environment. Must be 'prod' or 'dev'"}),
                400,
            )

        temp_dir = tempfile.mkdtemp(prefix="gcsdl_")
        if "local" in data["env"]:
            local_file = data["filePath"]
        else:
            local_file = download_file_from_gcs(
                data["filePath"], data["env"], destination_dir=temp_dir
            )

        if local_file == "" or local_file is None:
            return jsonify({"error": "No file selected"}), 400

        if local_file.split(".")[-1].lower() not in [
            "pdf",
            "jpg",
            "jpeg",
            "png",
            "webp",
            "svg",
        ]:
            return jsonify({"error": "Only PDFs and images are allowed"}), 400

        os.makedirs(Config.UPLOAD_FOLDER, exist_ok=True)

        upload_id = str(uuid.uuid4())  # Generate a unique ID
        os.makedirs(upload_id, exist_ok=True)
        if local_file.endswith(".pdf"):
            try:
                images = convert_from_path(local_file)
            except Exception as e:
                return jsonify({"error": f"Failed to process PDF: {str(e)}"}), 400
            image_paths = []
            for i, img in enumerate(images):
                img_path = os.path.join(upload_id, f"page_{i + 1}.jpg")
                img.convert("RGB").save(img_path, "JPEG")
                image_paths.append(img_path)
        else:
            image_paths = [local_file]

        res: list[dict[str, str]] = []
        total_ocr_token = 0
        for idx, im in enumerate(image_paths):
            inference = None
            try:
                if base_prompt:
                    ocr_token, inference = ocr_router(
                        im,
                        project_name=project,
                        ocr_type=model,
                        base_prompt=base_prompt,
                    )
                else:
                    ocr_token, inference = ocr_router(
                        im, project_name=project, ocr_type=model
                    )
                res.append({"page_number": str(idx + 1), "ocr_text": inference})
            except Exception as e:
                ocr_token = 0
                res.append(
                    {"page_number": str(idx + 1), "ocr_text": f"Error: {str(e)}"}
                )
            total_ocr_token += ocr_token
        log_entry = {
            "severity": "INFO",
            "message": f"Token usage for request {data['filePath']}",
            "request_endpoitn": "ocr",
            "base_prompt": base_prompt,
            "total_ocr_tokens_count": total_ocr_token,
            "res": res,
        }
        # Print the JSON string to stdout
        logging.info(json.dumps(log_entry))
        # print(json.dumps(log_entry))
        print(json.dumps(log_entry), flush=True)

        return jsonify(res), 200

    except Exception as e:
        return jsonify({"error": str(e)}), 400


@routes.route("/get-fields", methods=["POST"])
def get_fields():
    data = request.json
    print("get_data endpoint", data)
    if data is None:
        return jsonify({"error": "Missing Data"}), 400

    required_fields = ["documentPaths", "env", "documentType"]
    for field in required_fields:
        if field not in data:
            return jsonify({"error": f"Missing required field: {field}"}), 400
    FIELD_PROMPT = get_fields_base_prompt(data["documentType"])

    project = data.get("project", "llmextraction")
    temp_dir = tempfile.mkdtemp(prefix="gcsdl_")
    res = {}
    for cloud_path in data["documentPaths"]:
        local_file = download_file_from_gcs(
            cloud_path, data["env"], destination_dir=temp_dir
        )
        if local_file == "" or local_file is None:
            return jsonify({"error": "No file selected"}), 400

        if local_file.split(".")[-1].lower() not in [
            "jpg",
            "jpeg",
            "png",
            "webp",
            "svg",
            "pdf",
        ]:
            return jsonify({"error": "Only images are allowed"}), 400
        if local_file.endswith("pdf"):
            os.makedirs(Config.UPLOAD_FOLDER, exist_ok=True)

            upload_id = str(uuid.uuid4())  # Generate a unique ID
            os.makedirs(upload_id, exist_ok=True)
            try:
                images = convert_from_path(local_file)
            except Exception as e:
                return jsonify({"error": f"Failed to process PDF: {str(e)}"}), 400
            image_paths = []
            for i, img in enumerate(images):
                img_path = os.path.join(upload_id, f"page_{i + 1}.jpg")
                img.convert("RGB").save(img_path, "JPEG")
                image_paths.append(img_path)

        else:
            image_paths = [
                local_file,
            ]
        for idx, img_pth in enumerate(image_paths):
            if (idx) > 2:
                break
            inference = None
            try:
                _, inference = extract_text_with_gemini_flash(
                    img_pth,
                    base_instruction=FIELD_PROMPT,
                    project_name=project,
                    json_mode=True,
                )
                extracted_data = json.loads(inference)
            except Exception as e:
                if inference:
                    extracted_data = inference + "\n\n" + str(e)
                else:
                    extracted_data = str(e)
            res[cloud_path + "_" + str(idx)] = extracted_data
    print("RES:", res)
    final = cumulate_all_fields(res)
    # if os.path.exists(temp_dir):
    #     os.remove(temp_dir)
    return jsonify(final), 200


@routes.route("/full-extraction", methods=["POST"])
def full_extraction():
    data = request.json
    print("get_data endpoint", data)
    if data is None:
        return jsonify({"error": "Missing Data"}), 400

    required_fields = ["documentPaths", "env"]
    for field in required_fields:
        if field not in data:
            return jsonify({"error": f"Missing required field: {field}"}), 400
    FIELD_PROMPT = get_fields_without_doc_type()

    project = data.get("project", "llmextraction")
    temp_dir = tempfile.mkdtemp(prefix="gcsdl_")
    res = {}
    final_data = []
    for cloud_path in data["documentPaths"]:
        if "local" in data["env"].lower():
            local_file = cloud_path
        else:
            local_file = download_file_from_gcs(
                cloud_path, data["env"], destination_dir=temp_dir
            )
        if local_file == "" or local_file is None:
            return jsonify({"error": "No file selected"}), 400

        if local_file.split(".")[-1].lower() not in [
            "jpg",
            "jpeg",
            "png",
            "webp",
            "svg",
            "pdf",
        ]:
            return jsonify({"error": "Only images are allowed"}), 400
        if local_file.endswith("pdf"):
            os.makedirs(Config.UPLOAD_FOLDER, exist_ok=True)

            upload_id = str(uuid.uuid4())  # Generate a unique ID
            os.makedirs(upload_id, exist_ok=True)
            try:
                images = convert_from_path(local_file)
            except Exception as e:
                return jsonify({"error": f"Failed to process PDF: {str(e)}"}), 400
            image_paths = []
            for i, img in enumerate(images):
                img_path = os.path.join(upload_id, f"page_{i + 1}.jpg")
                img.convert("RGB").save(img_path, "JPEG")
                image_paths.append(img_path)

        else:
            image_paths = [
                local_file,
            ]
        for idx, img_pth in enumerate(image_paths):
            if (idx) > 2:
                break
            inference = None
            try:
                _, inference = extract_text_with_gemini_flash(
                    img_pth,
                    base_instruction=FIELD_PROMPT,
                    project_name=project,
                    json_mode=True,
                )
                extracted_data = json.loads(inference)
                data_prompt = data_extraction_prompt(extracted_data)
                _, inference = extract_text_with_gemini_flash(
                    img_pth,
                    base_instruction=data_prompt,
                    project_name=project,
                    json_mode=True,
                )
                final_data.append(json.loads(inference))
            except Exception as e:
                if inference:
                    extracted_data = inference + "\n\n" + str(e)
                else:
                    extracted_data = str(e)
            res[cloud_path + "_" + str(idx)] = extracted_data
    print("RES:", res)
    final = {"LINE_ITEMS": []}
    for datum in final_data:
        for k in datum.keys():
            if k == "LINE_ITEMS":
                final["LINE_ITEMS"].extend(datum["LINE_ITEMS"])
            else:
                final[k] = datum[k]
    # if os.path.exists(temp_dir):
    #     os.remove(temp_dir)
    return jsonify(final), 200
