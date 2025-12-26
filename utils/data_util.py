import json
import os

from utils.json_repair import repair_json
from utils.type_check import type_check


def transform_data(extracted_data, features, vat_field=[], feature_type={}):
    extracted_data.setdefault("LINE_ITEMS", [])

    line_features = {k: [] for k in (features["lines"].keys())}
    feature_names = [
        k
        for k in features.keys()
        if k not in vat_field and k not in line_features.keys() and k != "lines"
    ]
    for name in feature_names:
        if name not in extracted_data.keys():
            extracted_data[name] = ""
    # print(f"feature_names: {feature_names}")
    # print(f"extracted_data: {extracted_data}")
    for item in extracted_data["LINE_ITEMS"]:
        if type(item) == str:
            parsed_item = repair_json(item)
            if parsed_item is None:
                continue
            item = parsed_item

        for k, v in item.items():
            if k not in line_features:
                continue
            line_features[k].append(type_check(v, feature_type.get(k, "text")))

    lines_attributes = []
    vat_lines_attributes = []
    for k, values in line_features.items():
        for idx, v in enumerate(values):
            if k in vat_field:
                if len(vat_lines_attributes) <= idx:
                    vat_lines_attributes.append([])
                vat_lines_attributes[idx].append(
                    {"name": k, "value": type_check(v, feature_type.get(k, "text"))}
                )
            else:
                if len(lines_attributes) <= idx:
                    lines_attributes.append([])
                lines_attributes[idx].append(
                    {"name": k, "value": type_check(v, feature_type.get(k, "text"))}
                )
    print("\n\nvat_lines_attributes")
    print(vat_lines_attributes)
    print("\n\nvat_lines_attributes\n\n\n\n")

    transformed_entry = {
        "status": 16,
        "attributes": (
            [
                {
                    "name": k,
                    "value": type_check(v, feature_type.get(k, "text")),
                    "trust": True,
                }
                for k, v in extracted_data.items()
                if k != "LINE_ITEMS" and k not in line_features
            ]
        ),
        "lines": (
            [
                {
                    "line": idx + 1,
                    "attributes": item,
                }
                for idx, item in enumerate(lines_attributes)
            ]
        ),
        "vatLines": (
            [
                {
                    "line": idx + 1,
                    "attributes": item,
                }
                for idx, item in enumerate(vat_lines_attributes)
            ]
        ),
    }
    return transformed_entry
