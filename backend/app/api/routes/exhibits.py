from fastapi import APIRouter, Depends, HTTPException, status, Request
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, func
from sqlalchemy.orm import selectinload
from typing import List

from ...core.database import get_db
from ...core.security import get_current_user_id, require_technician, require_authenticated
from ...models.case import Case
from ...models.exhibit import Exhibit
from ...models.fingerprint import Fingerprint
from ...schemas.exhibit import (
    ExhibitCreate,
    ExhibitUpdate,
    ExhibitResponse,
    ExhibitDetailResponse,
    FingerprintSummary,
)
from ...services.audit import AuditService
from ...services.storage import StorageService

router = APIRouter()


@router.get("/case/{case_id}", response_model=List[ExhibitResponse])
async def list_exhibits_for_case(
    case_id: str,
    db: AsyncSession = Depends(get_db),
    current_user_id: str = Depends(get_current_user_id),
    _: bool = Depends(require_authenticated),
):
    """List all exhibits for a case"""
    # Verify case exists
    case_result = await db.execute(select(Case).where(Case.id == case_id))
    if not case_result.scalar_one_or_none():
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Case not found",
        )

    result = await db.execute(
        select(Exhibit)
        .where(Exhibit.case_id == case_id)
        .order_by(Exhibit.sequence_order, Exhibit.created_at)
    )
    exhibits = result.scalars().all()

    exhibit_responses = []
    for exhibit in exhibits:
        fp_count_result = await db.execute(
            select(func.count()).where(Fingerprint.exhibit_id == exhibit.id)
        )
        fp_count = fp_count_result.scalar()

        exhibit_responses.append(
            ExhibitResponse(
                id=exhibit.id,
                exhibit_number=exhibit.exhibit_number,
                description=exhibit.description,
                location_collected=exhibit.location_collected,
                collection_date=exhibit.collection_date,
                collector_name=exhibit.collector_name,
                case_id=exhibit.case_id,
                sequence_order=exhibit.sequence_order,
                created_at=exhibit.created_at,
                updated_at=exhibit.updated_at,
                fingerprint_count=fp_count,
            )
        )

    return exhibit_responses


@router.get("/{exhibit_id}", response_model=ExhibitDetailResponse)
async def get_exhibit(
    exhibit_id: str,
    db: AsyncSession = Depends(get_db),
    current_user_id: str = Depends(get_current_user_id),
    _: bool = Depends(require_authenticated),
):
    """Get exhibit by ID with fingerprints"""
    result = await db.execute(
        select(Exhibit)
        .options(selectinload(Exhibit.fingerprints))
        .where(Exhibit.id == exhibit_id)
    )
    exhibit = result.scalar_one_or_none()

    if not exhibit:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Exhibit not found",
        )

    # Generate presigned URLs for fingerprint images
    storage = StorageService()
    fingerprint_summaries = []
    for fp in exhibit.fingerprints:
        original_url = await storage.get_presigned_url(fp.original_storage_path) if fp.original_storage_path else None
        fingerprint_summaries.append(
            FingerprintSummary(
                id=fp.id,
                original_filename=fp.original_filename,
                original_url=original_url,
                status=fp.status.value,
                quality_score=fp.quality_score,
                pattern_type=fp.pattern_type.value if fp.pattern_type else None,
                pattern_confidence=fp.pattern_confidence,
            )
        )

    return ExhibitDetailResponse(
        id=exhibit.id,
        exhibit_number=exhibit.exhibit_number,
        description=exhibit.description,
        location_collected=exhibit.location_collected,
        collection_date=exhibit.collection_date,
        collector_name=exhibit.collector_name,
        case_id=exhibit.case_id,
        sequence_order=exhibit.sequence_order,
        created_at=exhibit.created_at,
        updated_at=exhibit.updated_at,
        fingerprint_count=len(exhibit.fingerprints),
        fingerprints=fingerprint_summaries,
    )


@router.post("", response_model=ExhibitResponse, status_code=status.HTTP_201_CREATED)
async def create_exhibit(
    exhibit_data: ExhibitCreate,
    request: Request,
    db: AsyncSession = Depends(get_db),
    current_user_id: str = Depends(get_current_user_id),
    _: bool = Depends(require_technician),
):
    """Create a new exhibit"""
    # Verify case exists
    case_result = await db.execute(select(Case).where(Case.id == exhibit_data.case_id))
    if not case_result.scalar_one_or_none():
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Case not found",
        )

    # Get max sequence order
    max_order_result = await db.execute(
        select(func.max(Exhibit.sequence_order)).where(
            Exhibit.case_id == exhibit_data.case_id
        )
    )
    max_order = max_order_result.scalar() or 0

    exhibit = Exhibit(
        exhibit_number=exhibit_data.exhibit_number,
        description=exhibit_data.description,
        location_collected=exhibit_data.location_collected,
        collection_date=exhibit_data.collection_date,
        collector_name=exhibit_data.collector_name,
        case_id=exhibit_data.case_id,
        sequence_order=max_order + 1,
    )
    db.add(exhibit)
    await db.commit()
    await db.refresh(exhibit)

    await AuditService.log(
        db=db,
        action="exhibit_create",
        user_id=current_user_id,
        resource_type="exhibit",
        resource_id=exhibit.id,
        details={
            "exhibit_number": exhibit.exhibit_number,
            "case_id": exhibit.case_id,
        },
        ip_address=request.client.host if request.client else None,
    )

    return ExhibitResponse(
        id=exhibit.id,
        exhibit_number=exhibit.exhibit_number,
        description=exhibit.description,
        location_collected=exhibit.location_collected,
        collection_date=exhibit.collection_date,
        collector_name=exhibit.collector_name,
        case_id=exhibit.case_id,
        sequence_order=exhibit.sequence_order,
        created_at=exhibit.created_at,
        updated_at=exhibit.updated_at,
        fingerprint_count=0,
    )


@router.patch("/{exhibit_id}", response_model=ExhibitResponse)
async def update_exhibit(
    exhibit_id: str,
    exhibit_data: ExhibitUpdate,
    request: Request,
    db: AsyncSession = Depends(get_db),
    current_user_id: str = Depends(get_current_user_id),
    _: bool = Depends(require_technician),
):
    """Update exhibit"""
    result = await db.execute(select(Exhibit).where(Exhibit.id == exhibit_id))
    exhibit = result.scalar_one_or_none()

    if not exhibit:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Exhibit not found",
        )

    update_data = exhibit_data.model_dump(exclude_unset=True)
    for field, value in update_data.items():
        setattr(exhibit, field, value)

    await db.commit()
    await db.refresh(exhibit)

    await AuditService.log(
        db=db,
        action="exhibit_update",
        user_id=current_user_id,
        resource_type="exhibit",
        resource_id=exhibit.id,
        details=update_data,
        ip_address=request.client.host if request.client else None,
    )

    fp_count_result = await db.execute(
        select(func.count()).where(Fingerprint.exhibit_id == exhibit.id)
    )
    fp_count = fp_count_result.scalar()

    return ExhibitResponse(
        id=exhibit.id,
        exhibit_number=exhibit.exhibit_number,
        description=exhibit.description,
        location_collected=exhibit.location_collected,
        collection_date=exhibit.collection_date,
        collector_name=exhibit.collector_name,
        case_id=exhibit.case_id,
        sequence_order=exhibit.sequence_order,
        created_at=exhibit.created_at,
        updated_at=exhibit.updated_at,
        fingerprint_count=fp_count,
    )


@router.delete("/{exhibit_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_exhibit(
    exhibit_id: str,
    request: Request,
    db: AsyncSession = Depends(get_db),
    current_user_id: str = Depends(get_current_user_id),
    _: bool = Depends(require_technician),
):
    """Delete exhibit (and all fingerprints)"""
    result = await db.execute(select(Exhibit).where(Exhibit.id == exhibit_id))
    exhibit = result.scalar_one_or_none()

    if not exhibit:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Exhibit not found",
        )

    await AuditService.log(
        db=db,
        action="exhibit_delete",
        user_id=current_user_id,
        resource_type="exhibit",
        resource_id=exhibit.id,
        details={
            "exhibit_number": exhibit.exhibit_number,
            "case_id": exhibit.case_id,
        },
        ip_address=request.client.host if request.client else None,
    )

    await db.delete(exhibit)
    await db.commit()
