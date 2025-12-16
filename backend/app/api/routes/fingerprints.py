from fastapi import APIRouter, Depends, HTTPException, status, Request, UploadFile, File, Form
from fastapi.responses import StreamingResponse
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from sqlalchemy.orm import selectinload
from typing import List, Optional
import hashlib
import io

from ...core.database import get_db
from ...core.security import get_current_user_id, require_technician, require_authenticated
from ...core.config import settings
from ...models.exhibit import Exhibit
from ...models.fingerprint import Fingerprint, FingerprintProcessingResult, ProcessingStatus, PrintType
from ...schemas.fingerprint import (
    FingerprintResponse,
    FingerprintUploadResponse,
    FingerprintDetailResponse,
    BatchUploadResponse,
    ProcessFingerprintRequest,
    ReprocessFingerprintRequest,
    ProcessingResultResponse,
    QualityAssessment,
    QualityIssue,
    ClassificationResult,
)
from ...services.audit import AuditService
from ...services.storage import StorageService
from ...services.fingerprint_processor import FingerprintProcessorService

router = APIRouter()


def compute_sha256(data: bytes) -> str:
    return hashlib.sha256(data).hexdigest()


@router.post("/upload/{exhibit_id}", response_model=FingerprintUploadResponse, status_code=status.HTTP_201_CREATED)
async def upload_fingerprint(
    exhibit_id: str,
    request: Request,
    file: UploadFile = File(...),
    print_type: PrintType = Form(PrintType.UNKNOWN),
    db: AsyncSession = Depends(get_db),
    current_user_id: str = Depends(get_current_user_id),
    _: bool = Depends(require_technician),
):
    """Upload a single fingerprint image"""
    # Verify exhibit exists
    exhibit_result = await db.execute(select(Exhibit).where(Exhibit.id == exhibit_id))
    exhibit = exhibit_result.scalar_one_or_none()
    if not exhibit:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Exhibit not found",
        )

    # Validate file type
    file_ext = file.filename.split(".")[-1].lower() if file.filename else ""
    if file_ext not in settings.SUPPORTED_IMAGE_FORMATS:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Unsupported file format. Supported: {settings.SUPPORTED_IMAGE_FORMATS}",
        )

    # Read file content
    content = await file.read()
    file_size = len(content)

    # Check file size
    if file_size > settings.MAX_UPLOAD_SIZE_MB * 1024 * 1024:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"File too large. Maximum size: {settings.MAX_UPLOAD_SIZE_MB}MB",
        )

    # Compute hash
    file_hash = compute_sha256(content)

    # Get image dimensions
    from PIL import Image
    img = Image.open(io.BytesIO(content))
    width, height = img.size
    dpi = img.info.get("dpi", (None, None))[0]

    # Store original file (immutable)
    storage = StorageService()
    storage_path = await storage.store_original(
        content=content,
        filename=file.filename,
        exhibit_id=exhibit_id,
        file_hash=file_hash,
    )

    # Create fingerprint record
    fingerprint = Fingerprint(
        original_filename=file.filename,
        original_storage_path=storage_path,
        original_hash_sha256=file_hash,
        file_size_bytes=file_size,
        mime_type=file.content_type or f"image/{file_ext}",
        image_width=width,
        image_height=height,
        dpi=int(dpi) if dpi else None,
        print_type=print_type,
        exhibit_id=exhibit_id,
        uploaded_by_id=current_user_id,
        status=ProcessingStatus.PENDING,
    )
    db.add(fingerprint)
    await db.commit()
    await db.refresh(fingerprint)

    await AuditService.log(
        db=db,
        action="fingerprint_upload",
        user_id=current_user_id,
        resource_type="fingerprint",
        resource_id=fingerprint.id,
        details={
            "filename": file.filename,
            "hash": file_hash,
            "exhibit_id": exhibit_id,
        },
        ip_address=request.client.host if request.client else None,
    )

    return FingerprintUploadResponse(
        id=fingerprint.id,
        original_filename=fingerprint.original_filename,
        original_hash_sha256=fingerprint.original_hash_sha256,
        file_size_bytes=fingerprint.file_size_bytes,
        status=fingerprint.status,
        created_at=fingerprint.created_at,
    )


@router.post("/upload-batch/{exhibit_id}", response_model=BatchUploadResponse)
async def upload_fingerprints_batch(
    exhibit_id: str,
    request: Request,
    files: List[UploadFile] = File(...),
    print_type: PrintType = Form(PrintType.UNKNOWN),
    db: AsyncSession = Depends(get_db),
    current_user_id: str = Depends(get_current_user_id),
    _: bool = Depends(require_technician),
):
    """Upload multiple fingerprint images"""
    # Verify exhibit exists
    exhibit_result = await db.execute(select(Exhibit).where(Exhibit.id == exhibit_id))
    exhibit = exhibit_result.scalar_one_or_none()
    if not exhibit:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Exhibit not found",
        )

    successful = []
    failed = []
    storage = StorageService()

    for file in files:
        try:
            # Validate file type
            file_ext = file.filename.split(".")[-1].lower() if file.filename else ""
            if file_ext not in settings.SUPPORTED_IMAGE_FORMATS:
                failed.append({"filename": file.filename, "error": "Unsupported format"})
                continue

            content = await file.read()
            file_size = len(content)

            if file_size > settings.MAX_UPLOAD_SIZE_MB * 1024 * 1024:
                failed.append({"filename": file.filename, "error": "File too large"})
                continue

            file_hash = compute_sha256(content)

            from PIL import Image
            img = Image.open(io.BytesIO(content))
            width, height = img.size
            dpi = img.info.get("dpi", (None, None))[0]

            storage_path = await storage.store_original(
                content=content,
                filename=file.filename,
                exhibit_id=exhibit_id,
                file_hash=file_hash,
            )

            fingerprint = Fingerprint(
                original_filename=file.filename,
                original_storage_path=storage_path,
                original_hash_sha256=file_hash,
                file_size_bytes=file_size,
                mime_type=file.content_type or f"image/{file_ext}",
                image_width=width,
                image_height=height,
                dpi=int(dpi) if dpi else None,
                print_type=print_type,
                exhibit_id=exhibit_id,
                uploaded_by_id=current_user_id,
                status=ProcessingStatus.PENDING,
            )
            db.add(fingerprint)
            await db.commit()
            await db.refresh(fingerprint)

            successful.append(
                FingerprintUploadResponse(
                    id=fingerprint.id,
                    original_filename=fingerprint.original_filename,
                    original_hash_sha256=fingerprint.original_hash_sha256,
                    file_size_bytes=fingerprint.file_size_bytes,
                    status=fingerprint.status,
                    created_at=fingerprint.created_at,
                )
            )

        except Exception as e:
            failed.append({"filename": file.filename, "error": str(e)})

    await AuditService.log(
        db=db,
        action="fingerprint_upload",
        user_id=current_user_id,
        resource_type="fingerprint",
        resource_id=exhibit_id,
        details={
            "batch_upload": True,
            "successful_count": len(successful),
            "failed_count": len(failed),
        },
        ip_address=request.client.host if request.client else None,
    )

    return BatchUploadResponse(
        successful=successful,
        failed=failed,
        total_uploaded=len(successful),
        total_failed=len(failed),
    )


@router.get("/{fingerprint_id}", response_model=FingerprintDetailResponse)
async def get_fingerprint(
    fingerprint_id: str,
    request: Request,
    db: AsyncSession = Depends(get_db),
    current_user_id: str = Depends(get_current_user_id),
    _: bool = Depends(require_authenticated),
):
    """Get fingerprint details with processing results"""
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

    await AuditService.log(
        db=db,
        action="fingerprint_view",
        user_id=current_user_id,
        resource_type="fingerprint",
        resource_id=fingerprint.id,
        ip_address=request.client.host if request.client else None,
    )

    storage = StorageService()
    original_url = await storage.get_presigned_url(fingerprint.original_storage_path)

    processing_results = [
        ProcessingResultResponse(
            id=pr.id,
            enhanced_storage_path=pr.enhanced_storage_path,
            enhanced_url=await storage.get_presigned_url(pr.enhanced_storage_path),
            pipeline_version=pr.pipeline_version,
            enhancement_preset=pr.enhancement_preset,
            quality_score_before=pr.quality_score_before,
            quality_score_after=pr.quality_score_after,
            quality_improvement=pr.quality_improvement,
            processing_time_ms=pr.processing_time_ms,
            artifact_risk_level=pr.artifact_risk_level,
            artifact_warnings=pr.artifact_warnings,
            is_primary=pr.is_primary,
            created_at=pr.created_at,
        )
        for pr in fingerprint.processing_results
    ]

    # Build quality assessment
    quality_assessment = None
    if fingerprint.quality_score is not None:
        quality_issues = []
        if fingerprint.quality_issues:
            quality_issues = [
                QualityIssue(
                    code=issue.get("code", "unknown"),
                    severity=issue.get("severity", "medium"),
                    description=issue.get("description", ""),
                )
                for issue in fingerprint.quality_issues
            ]
        quality_assessment = QualityAssessment(
            score=fingerprint.quality_score,
            issues=quality_issues,
        )

    # Build classification result
    classification = None
    if fingerprint.pattern_type:
        classification = ClassificationResult(
            pattern_type=fingerprint.pattern_type,
            confidence=fingerprint.pattern_confidence or 0.0,
            rationale=fingerprint.classification_rationale or "",
        )

    # Get overlay URLs from primary processing result
    ridge_orientation_map_url = None
    rationale_overlay_url = None
    for pr in fingerprint.processing_results:
        if pr.is_primary:
            if pr.ridge_orientation_map_path:
                ridge_orientation_map_url = await storage.get_presigned_url(
                    pr.ridge_orientation_map_path
                )
            if pr.rationale_overlay_path:
                rationale_overlay_url = await storage.get_presigned_url(
                    pr.rationale_overlay_path
                )
            break

    return FingerprintDetailResponse(
        id=fingerprint.id,
        original_filename=fingerprint.original_filename,
        original_hash_sha256=fingerprint.original_hash_sha256,
        original_url=original_url,
        file_size_bytes=fingerprint.file_size_bytes,
        mime_type=fingerprint.mime_type,
        image_width=fingerprint.image_width,
        image_height=fingerprint.image_height,
        dpi=fingerprint.dpi,
        print_type=fingerprint.print_type,
        finger_position=fingerprint.finger_position,
        subject_id=fingerprint.subject_id,
        status=fingerprint.status,
        processing_error=fingerprint.processing_error,
        quality_score=fingerprint.quality_score,
        quality_issues=[
            QualityIssue(
                code=issue.get("code", "unknown"),
                severity=issue.get("severity", "medium"),
                description=issue.get("description", ""),
            )
            for issue in (fingerprint.quality_issues or [])
        ] if fingerprint.quality_issues else None,
        pattern_type=fingerprint.pattern_type,
        pattern_confidence=fingerprint.pattern_confidence,
        classification_rationale=fingerprint.classification_rationale,
        exhibit_id=fingerprint.exhibit_id,
        uploaded_by_id=fingerprint.uploaded_by_id,
        created_at=fingerprint.created_at,
        updated_at=fingerprint.updated_at,
        processed_at=fingerprint.processed_at,
        processing_results=processing_results,
        classification=classification,
        quality_assessment=quality_assessment,
        ridge_orientation_map_url=ridge_orientation_map_url,
        rationale_overlay_url=rationale_overlay_url,
    )


@router.post("/{fingerprint_id}/process", response_model=FingerprintResponse)
async def process_fingerprint(
    fingerprint_id: str,
    request: Request,
    process_request: ProcessFingerprintRequest = ProcessFingerprintRequest(),
    db: AsyncSession = Depends(get_db),
    current_user_id: str = Depends(get_current_user_id),
    _: bool = Depends(require_technician),
):
    """Queue fingerprint for processing"""
    result = await db.execute(select(Fingerprint).where(Fingerprint.id == fingerprint_id))
    fingerprint = result.scalar_one_or_none()

    if not fingerprint:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Fingerprint not found",
        )

    # Update status to queued
    fingerprint.status = ProcessingStatus.QUEUED
    await db.commit()

    # Queue for async processing
    from ...workers.tasks import process_fingerprint_task
    process_fingerprint_task.delay(
        fingerprint_id=fingerprint_id,
        enhancement_preset=process_request.enhancement_preset,
        generate_variants=process_request.generate_variants,
        user_id=current_user_id,
    )

    await AuditService.log(
        db=db,
        action="fingerprint_process",
        user_id=current_user_id,
        resource_type="fingerprint",
        resource_id=fingerprint.id,
        details={
            "preset": process_request.enhancement_preset,
            "generate_variants": process_request.generate_variants,
        },
        ip_address=request.client.host if request.client else None,
    )

    # Re-fetch with eager loading of processing_results
    result = await db.execute(
        select(Fingerprint)
        .options(selectinload(Fingerprint.processing_results))
        .where(Fingerprint.id == fingerprint_id)
    )
    fingerprint = result.scalar_one()
    return fingerprint


@router.post("/{fingerprint_id}/reprocess", response_model=FingerprintResponse)
async def reprocess_fingerprint(
    fingerprint_id: str,
    request: Request,
    reprocess_request: ReprocessFingerprintRequest = ReprocessFingerprintRequest(),
    db: AsyncSession = Depends(get_db),
    current_user_id: str = Depends(get_current_user_id),
    _: bool = Depends(require_technician),
):
    """Reprocess fingerprint with different settings"""
    result = await db.execute(select(Fingerprint).where(Fingerprint.id == fingerprint_id))
    fingerprint = result.scalar_one_or_none()

    if not fingerprint:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Fingerprint not found",
        )

    if fingerprint.status == ProcessingStatus.PROCESSING and not reprocess_request.force:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Fingerprint is currently being processed. Use force=true to override.",
        )

    fingerprint.status = ProcessingStatus.QUEUED
    await db.commit()

    from ...workers.tasks import process_fingerprint_task
    process_fingerprint_task.delay(
        fingerprint_id=fingerprint_id,
        enhancement_preset=reprocess_request.enhancement_preset or settings.DEFAULT_ENHANCEMENT_PRESET,
        generate_variants=True,
        user_id=current_user_id,
    )

    await AuditService.log(
        db=db,
        action="fingerprint_reprocess",
        user_id=current_user_id,
        resource_type="fingerprint",
        resource_id=fingerprint.id,
        details={
            "preset": reprocess_request.enhancement_preset,
            "force": reprocess_request.force,
        },
        ip_address=request.client.host if request.client else None,
    )

    # Re-fetch with eager loading of processing_results
    result = await db.execute(
        select(Fingerprint)
        .options(selectinload(Fingerprint.processing_results))
        .where(Fingerprint.id == fingerprint_id)
    )
    fingerprint = result.scalar_one()
    return fingerprint


@router.get("/{fingerprint_id}/original")
async def download_original(
    fingerprint_id: str,
    request: Request,
    db: AsyncSession = Depends(get_db),
    current_user_id: str = Depends(get_current_user_id),
    _: bool = Depends(require_authenticated),
):
    """Download original fingerprint image"""
    result = await db.execute(select(Fingerprint).where(Fingerprint.id == fingerprint_id))
    fingerprint = result.scalar_one_or_none()

    if not fingerprint:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Fingerprint not found",
        )

    storage = StorageService()
    content = await storage.get_file(fingerprint.original_storage_path)

    await AuditService.log(
        db=db,
        action="fingerprint_download",
        user_id=current_user_id,
        resource_type="fingerprint",
        resource_id=fingerprint.id,
        details={"type": "original"},
        ip_address=request.client.host if request.client else None,
    )

    return StreamingResponse(
        io.BytesIO(content),
        media_type=fingerprint.mime_type,
        headers={
            "Content-Disposition": f"attachment; filename={fingerprint.original_filename}"
        },
    )


@router.get("/{fingerprint_id}/enhanced/{result_id}")
async def download_enhanced(
    fingerprint_id: str,
    result_id: str,
    request: Request,
    db: AsyncSession = Depends(get_db),
    current_user_id: str = Depends(get_current_user_id),
    _: bool = Depends(require_authenticated),
):
    """Download enhanced fingerprint image"""
    result = await db.execute(
        select(FingerprintProcessingResult)
        .where(
            FingerprintProcessingResult.id == result_id,
            FingerprintProcessingResult.fingerprint_id == fingerprint_id,
        )
    )
    processing_result = result.scalar_one_or_none()

    if not processing_result:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Processing result not found",
        )

    storage = StorageService()
    content = await storage.get_file(processing_result.enhanced_storage_path)

    await AuditService.log(
        db=db,
        action="fingerprint_download",
        user_id=current_user_id,
        resource_type="fingerprint",
        resource_id=fingerprint_id,
        details={"type": "enhanced", "result_id": result_id},
        ip_address=request.client.host if request.client else None,
    )

    # Get original fingerprint for filename
    fp_result = await db.execute(select(Fingerprint).where(Fingerprint.id == fingerprint_id))
    fingerprint = fp_result.scalar_one()

    filename_parts = fingerprint.original_filename.rsplit(".", 1)
    enhanced_filename = f"{filename_parts[0]}_enhanced.{filename_parts[1] if len(filename_parts) > 1 else 'png'}"

    return StreamingResponse(
        io.BytesIO(content),
        media_type="image/png",
        headers={"Content-Disposition": f"attachment; filename={enhanced_filename}"},
    )


@router.delete("/{fingerprint_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_fingerprint(
    fingerprint_id: str,
    request: Request,
    db: AsyncSession = Depends(get_db),
    current_user_id: str = Depends(get_current_user_id),
    _: bool = Depends(require_technician),
):
    """Delete fingerprint"""
    result = await db.execute(select(Fingerprint).where(Fingerprint.id == fingerprint_id))
    fingerprint = result.scalar_one_or_none()

    if not fingerprint:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Fingerprint not found",
        )

    await AuditService.log(
        db=db,
        action="fingerprint_delete",
        user_id=current_user_id,
        resource_type="fingerprint",
        resource_id=fingerprint.id,
        details={
            "filename": fingerprint.original_filename,
            "hash": fingerprint.original_hash_sha256,
        },
        ip_address=request.client.host if request.client else None,
    )

    # Note: We keep original files in storage for forensic integrity
    # Only delete the database record
    await db.delete(fingerprint)
    await db.commit()
