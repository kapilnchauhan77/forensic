from fastapi import APIRouter, Depends, HTTPException, status, Request
from fastapi.responses import StreamingResponse
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from sqlalchemy.orm import selectinload
from typing import Optional
import zipfile
import io
import json
from datetime import datetime

from ...core.database import get_db
from ...core.security import get_current_user_id, require_authenticated
from ...models.case import Case
from ...models.exhibit import Exhibit
from ...models.fingerprint import Fingerprint, FingerprintProcessingResult
from ...services.audit import AuditService
from ...services.storage import StorageService

router = APIRouter()


@router.get("/case/{case_id}/evidence-pack")
async def export_evidence_pack(
    case_id: str,
    request: Request,
    include_originals: bool = True,
    include_enhanced: bool = True,
    db: AsyncSession = Depends(get_db),
    current_user_id: str = Depends(get_current_user_id),
    _: bool = Depends(require_authenticated),
):
    """Export case evidence pack as ZIP file"""
    # Get case with all related data
    result = await db.execute(
        select(Case)
        .options(
            selectinload(Case.exhibits).selectinload(Exhibit.fingerprints).selectinload(
                Fingerprint.processing_results
            )
        )
        .where(Case.id == case_id)
    )
    case = result.scalar_one_or_none()

    if not case:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Case not found",
        )

    storage = StorageService()
    zip_buffer = io.BytesIO()

    with zipfile.ZipFile(zip_buffer, "w", zipfile.ZIP_DEFLATED) as zip_file:
        # Case metadata
        case_metadata = {
            "case_id": case.id,
            "case_number": case.case_number,
            "title": case.title,
            "description": case.description,
            "agency": case.agency,
            "source_type": case.source_type.value if case.source_type else None,
            "status": case.status.value if case.status else None,
            "created_at": case.created_at.isoformat() if case.created_at else None,
            "exported_at": datetime.utcnow().isoformat(),
            "exported_by": current_user_id,
            "exhibits": [],
        }

        for exhibit in case.exhibits:
            exhibit_data = {
                "exhibit_id": exhibit.id,
                "exhibit_number": exhibit.exhibit_number,
                "description": exhibit.description,
                "location_collected": exhibit.location_collected,
                "collection_date": exhibit.collection_date.isoformat() if exhibit.collection_date else None,
                "collector_name": exhibit.collector_name,
                "fingerprints": [],
            }

            exhibit_folder = f"exhibits/{exhibit.exhibit_number}"

            for fingerprint in exhibit.fingerprints:
                fp_data = {
                    "fingerprint_id": fingerprint.id,
                    "original_filename": fingerprint.original_filename,
                    "original_hash_sha256": fingerprint.original_hash_sha256,
                    "print_type": fingerprint.print_type.value if fingerprint.print_type else None,
                    "finger_position": fingerprint.finger_position.value if fingerprint.finger_position else None,
                    "quality_score": fingerprint.quality_score,
                    "pattern_type": fingerprint.pattern_type.value if fingerprint.pattern_type else None,
                    "pattern_confidence": fingerprint.pattern_confidence,
                    "classification_rationale": fingerprint.classification_rationale,
                    "processing_results": [],
                }

                fp_folder = f"{exhibit_folder}/{fingerprint.original_filename.rsplit('.', 1)[0]}"

                # Add original image
                if include_originals:
                    try:
                        original_content = await storage.get_file(fingerprint.original_storage_path)
                        original_path = f"{fp_folder}/original/{fingerprint.original_filename}"
                        zip_file.writestr(original_path, original_content)
                        fp_data["original_path"] = original_path
                    except Exception as e:
                        fp_data["original_error"] = str(e)

                # Add enhanced images
                if include_enhanced:
                    for pr in fingerprint.processing_results:
                        pr_data = {
                            "result_id": pr.id,
                            "pipeline_version": pr.pipeline_version,
                            "enhancement_preset": pr.enhancement_preset,
                            "pipeline_config": pr.pipeline_config,
                            "model_name": pr.model_name,
                            "model_version": pr.model_version,
                            "quality_score_before": pr.quality_score_before,
                            "quality_score_after": pr.quality_score_after,
                            "quality_improvement": pr.quality_improvement,
                            "processing_time_ms": pr.processing_time_ms,
                            "artifact_risk_level": pr.artifact_risk_level,
                            "artifact_warnings": pr.artifact_warnings,
                            "is_primary": pr.is_primary,
                            "created_at": pr.created_at.isoformat() if pr.created_at else None,
                        }

                        try:
                            enhanced_content = await storage.get_file(pr.enhanced_storage_path)
                            enhanced_path = f"{fp_folder}/enhanced/{pr.enhancement_preset}_{pr.id[:8]}.png"
                            zip_file.writestr(enhanced_path, enhanced_content)
                            pr_data["enhanced_path"] = enhanced_path
                        except Exception as e:
                            pr_data["enhanced_error"] = str(e)

                        # Add overlay images if available
                        if pr.ridge_orientation_map_path:
                            try:
                                overlay_content = await storage.get_file(pr.ridge_orientation_map_path)
                                overlay_path = f"{fp_folder}/overlays/ridge_orientation_{pr.id[:8]}.png"
                                zip_file.writestr(overlay_path, overlay_content)
                                pr_data["ridge_orientation_path"] = overlay_path
                            except Exception:
                                pass

                        if pr.rationale_overlay_path:
                            try:
                                overlay_content = await storage.get_file(pr.rationale_overlay_path)
                                overlay_path = f"{fp_folder}/overlays/rationale_{pr.id[:8]}.png"
                                zip_file.writestr(overlay_path, overlay_content)
                                pr_data["rationale_overlay_path"] = overlay_path
                            except Exception:
                                pass

                        fp_data["processing_results"].append(pr_data)

                exhibit_data["fingerprints"].append(fp_data)

            case_metadata["exhibits"].append(exhibit_data)

        # Write metadata JSON
        zip_file.writestr(
            "case_report.json",
            json.dumps(case_metadata, indent=2, default=str),
        )

        # Generate summary report
        summary = generate_summary_report(case_metadata)
        zip_file.writestr("SUMMARY.txt", summary)

    zip_buffer.seek(0)

    await AuditService.log(
        db=db,
        action="export_evidence_pack",
        user_id=current_user_id,
        resource_type="case",
        resource_id=case.id,
        details={
            "include_originals": include_originals,
            "include_enhanced": include_enhanced,
        },
        ip_address=request.client.host if request.client else None,
    )

    filename = f"case_{case.case_number}_{datetime.utcnow().strftime('%Y%m%d_%H%M%S')}.zip"

    return StreamingResponse(
        zip_buffer,
        media_type="application/zip",
        headers={"Content-Disposition": f"attachment; filename={filename}"},
    )


@router.get("/fingerprint/{fingerprint_id}/report")
async def export_fingerprint_report(
    fingerprint_id: str,
    request: Request,
    db: AsyncSession = Depends(get_db),
    current_user_id: str = Depends(get_current_user_id),
    _: bool = Depends(require_authenticated),
):
    """Export single fingerprint processing report as JSON"""
    result = await db.execute(
        select(Fingerprint)
        .options(selectinload(Fingerprint.processing_results))
        .where(Fingerprint.id == fingerprint_id)
    )
    fingerprint = result.scalar_one_or_none()

    if not fingerprint:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Fingerprint not found",
        )

    report = {
        "fingerprint_id": fingerprint.id,
        "original_filename": fingerprint.original_filename,
        "original_hash_sha256": fingerprint.original_hash_sha256,
        "file_size_bytes": fingerprint.file_size_bytes,
        "image_dimensions": {
            "width": fingerprint.image_width,
            "height": fingerprint.image_height,
            "dpi": fingerprint.dpi,
        },
        "print_type": fingerprint.print_type.value if fingerprint.print_type else None,
        "finger_position": fingerprint.finger_position.value if fingerprint.finger_position else None,
        "quality_assessment": {
            "score": fingerprint.quality_score,
            "issues": fingerprint.quality_issues,
        },
        "classification": {
            "pattern_type": fingerprint.pattern_type.value if fingerprint.pattern_type else None,
            "confidence": fingerprint.pattern_confidence,
            "rationale": fingerprint.classification_rationale,
        },
        "processing_results": [
            {
                "result_id": pr.id,
                "pipeline_version": pr.pipeline_version,
                "enhancement_preset": pr.enhancement_preset,
                "pipeline_config": pr.pipeline_config,
                "model_name": pr.model_name,
                "model_version": pr.model_version,
                "prompt_version": pr.prompt_version,
                "quality_improvement": {
                    "before": pr.quality_score_before,
                    "after": pr.quality_score_after,
                    "improvement": pr.quality_improvement,
                },
                "processing_time_ms": pr.processing_time_ms,
                "artifact_risk_level": pr.artifact_risk_level,
                "artifact_warnings": pr.artifact_warnings,
                "is_primary": pr.is_primary,
                "created_at": pr.created_at.isoformat() if pr.created_at else None,
            }
            for pr in fingerprint.processing_results
        ],
        "timestamps": {
            "uploaded_at": fingerprint.created_at.isoformat() if fingerprint.created_at else None,
            "processed_at": fingerprint.processed_at.isoformat() if fingerprint.processed_at else None,
        },
        "report_generated_at": datetime.utcnow().isoformat(),
    }

    await AuditService.log(
        db=db,
        action="export_report",
        user_id=current_user_id,
        resource_type="fingerprint",
        resource_id=fingerprint.id,
        ip_address=request.client.host if request.client else None,
    )

    return report


def generate_summary_report(case_metadata: dict) -> str:
    """Generate human-readable summary report"""
    lines = [
        "=" * 60,
        "FINGERPRINT ANALYSIS CASE REPORT",
        "=" * 60,
        "",
        f"Case Number: {case_metadata['case_number']}",
        f"Case Title: {case_metadata['title']}",
        f"Agency: {case_metadata.get('agency', 'N/A')}",
        f"Source Type: {case_metadata.get('source_type', 'N/A')}",
        f"Status: {case_metadata.get('status', 'N/A')}",
        f"Created: {case_metadata.get('created_at', 'N/A')}",
        f"Exported: {case_metadata.get('exported_at', 'N/A')}",
        "",
        "-" * 60,
        "EXHIBITS AND FINGERPRINTS",
        "-" * 60,
        "",
    ]

    total_fingerprints = 0
    total_processed = 0

    for exhibit in case_metadata.get("exhibits", []):
        lines.append(f"Exhibit: {exhibit['exhibit_number']}")
        lines.append(f"  Description: {exhibit.get('description', 'N/A')}")
        lines.append(f"  Location: {exhibit.get('location_collected', 'N/A')}")
        lines.append(f"  Collected: {exhibit.get('collection_date', 'N/A')}")
        lines.append(f"  Collector: {exhibit.get('collector_name', 'N/A')}")
        lines.append("")

        for fp in exhibit.get("fingerprints", []):
            total_fingerprints += 1
            if fp.get("processing_results"):
                total_processed += 1

            lines.append(f"    Fingerprint: {fp['original_filename']}")
            lines.append(f"      Hash (SHA-256): {fp['original_hash_sha256']}")
            lines.append(f"      Print Type: {fp.get('print_type', 'N/A')}")
            lines.append(f"      Quality Score: {fp.get('quality_score', 'N/A')}")
            lines.append(f"      Pattern Type: {fp.get('pattern_type', 'N/A')}")
            lines.append(f"      Pattern Confidence: {fp.get('pattern_confidence', 'N/A')}")

            if fp.get("classification_rationale"):
                lines.append(f"      Classification Rationale: {fp['classification_rationale'][:200]}...")

            for pr in fp.get("processing_results", []):
                if pr.get("is_primary"):
                    lines.append(f"      Enhancement Preset: {pr['enhancement_preset']}")
                    lines.append(f"      Pipeline Version: {pr['pipeline_version']}")
                    lines.append(f"      Quality Improvement: {pr.get('quality_improvement', 'N/A')}")
                    if pr.get("artifact_warnings"):
                        lines.append(f"      Artifact Warnings: {', '.join(pr['artifact_warnings'])}")

            lines.append("")

    lines.extend([
        "-" * 60,
        "SUMMARY",
        "-" * 60,
        f"Total Exhibits: {len(case_metadata.get('exhibits', []))}",
        f"Total Fingerprints: {total_fingerprints}",
        f"Fingerprints Processed: {total_processed}",
        "",
        "=" * 60,
        "END OF REPORT",
        "=" * 60,
    ])

    return "\n".join(lines)
