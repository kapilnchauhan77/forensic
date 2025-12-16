from fastapi import APIRouter, Depends, HTTPException, status, Request, Query
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, func
from sqlalchemy.orm import selectinload
from typing import Optional

from ...core.database import get_db
from ...core.security import get_current_user_id, require_technician, require_authenticated
from ...models.case import Case, CaseStatus
from ...models.exhibit import Exhibit
from ...models.fingerprint import Fingerprint
from ...models.user import User
from ...schemas.case import (
    CaseCreate,
    CaseUpdate,
    CaseResponse,
    CaseDetailResponse,
    CaseListResponse,
    ExhibitSummary,
)
from ...services.audit import AuditService

router = APIRouter()


@router.get("", response_model=CaseListResponse)
async def list_cases(
    page: int = Query(1, ge=1),
    page_size: int = Query(20, ge=1, le=100),
    status_filter: Optional[CaseStatus] = None,
    search: Optional[str] = None,
    db: AsyncSession = Depends(get_db),
    current_user_id: str = Depends(get_current_user_id),
    _: bool = Depends(require_authenticated),
):
    """List all cases with pagination and filtering"""
    query = select(Case).options(selectinload(Case.operator))

    if status_filter:
        query = query.where(Case.status == status_filter)

    if search:
        search_term = f"%{search}%"
        query = query.where(
            (Case.case_number.ilike(search_term))
            | (Case.title.ilike(search_term))
            | (Case.agency.ilike(search_term))
        )

    # Count total
    count_query = select(func.count()).select_from(query.subquery())
    total_result = await db.execute(count_query)
    total = total_result.scalar()

    # Paginate
    offset = (page - 1) * page_size
    query = query.offset(offset).limit(page_size).order_by(Case.created_at.desc())

    result = await db.execute(query)
    cases = result.scalars().all()

    # Get exhibit and fingerprint counts
    case_responses = []
    for case in cases:
        exhibit_count_result = await db.execute(
            select(func.count()).where(Exhibit.case_id == case.id)
        )
        exhibit_count = exhibit_count_result.scalar()

        fingerprint_count_result = await db.execute(
            select(func.count())
            .select_from(Fingerprint)
            .join(Exhibit)
            .where(Exhibit.case_id == case.id)
        )
        fingerprint_count = fingerprint_count_result.scalar()

        case_response = CaseResponse(
            id=case.id,
            case_number=case.case_number,
            title=case.title,
            description=case.description,
            agency=case.agency,
            source_type=case.source_type,
            status=case.status,
            operator_id=case.operator_id,
            operator_name=case.operator.full_name if case.operator else None,
            external_reference=case.external_reference,
            notes=case.notes,
            created_at=case.created_at,
            updated_at=case.updated_at,
            exhibit_count=exhibit_count,
            fingerprint_count=fingerprint_count,
        )
        case_responses.append(case_response)

    return CaseListResponse(
        cases=case_responses,
        total=total,
        page=page,
        page_size=page_size,
    )


@router.get("/{case_id}", response_model=CaseDetailResponse)
async def get_case(
    case_id: str,
    request: Request,
    db: AsyncSession = Depends(get_db),
    current_user_id: str = Depends(get_current_user_id),
    _: bool = Depends(require_authenticated),
):
    """Get case by ID with exhibits"""
    result = await db.execute(
        select(Case)
        .options(selectinload(Case.operator), selectinload(Case.exhibits))
        .where(Case.id == case_id)
    )
    case = result.scalar_one_or_none()

    if not case:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Case not found",
        )

    # Audit view
    await AuditService.log(
        db=db,
        action="case_view",
        user_id=current_user_id,
        resource_type="case",
        resource_id=case.id,
        ip_address=request.client.host if request.client else None,
    )

    # Get exhibit summaries with fingerprint counts
    exhibit_summaries = []
    for exhibit in case.exhibits:
        fp_count_result = await db.execute(
            select(func.count()).where(Fingerprint.exhibit_id == exhibit.id)
        )
        fp_count = fp_count_result.scalar()
        exhibit_summaries.append(
            ExhibitSummary(
                id=exhibit.id,
                exhibit_number=exhibit.exhibit_number,
                fingerprint_count=fp_count,
            )
        )

    exhibit_count = len(case.exhibits)
    fingerprint_count_result = await db.execute(
        select(func.count())
        .select_from(Fingerprint)
        .join(Exhibit)
        .where(Exhibit.case_id == case.id)
    )
    fingerprint_count = fingerprint_count_result.scalar()

    return CaseDetailResponse(
        id=case.id,
        case_number=case.case_number,
        title=case.title,
        description=case.description,
        agency=case.agency,
        source_type=case.source_type,
        status=case.status,
        operator_id=case.operator_id,
        operator_name=case.operator.full_name if case.operator else None,
        external_reference=case.external_reference,
        notes=case.notes,
        created_at=case.created_at,
        updated_at=case.updated_at,
        exhibit_count=exhibit_count,
        fingerprint_count=fingerprint_count,
        exhibits=exhibit_summaries,
    )


@router.post("", response_model=CaseResponse, status_code=status.HTTP_201_CREATED)
async def create_case(
    case_data: CaseCreate,
    request: Request,
    db: AsyncSession = Depends(get_db),
    current_user_id: str = Depends(get_current_user_id),
    _: bool = Depends(require_technician),
):
    """Create a new case"""
    # Check for duplicate case number
    result = await db.execute(
        select(Case).where(Case.case_number == case_data.case_number)
    )
    if result.scalar_one_or_none():
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Case with this case number already exists",
        )

    case = Case(
        case_number=case_data.case_number,
        title=case_data.title,
        description=case_data.description,
        agency=case_data.agency,
        source_type=case_data.source_type,
        external_reference=case_data.external_reference,
        notes=case_data.notes,
        operator_id=current_user_id,
    )
    db.add(case)
    await db.commit()
    await db.refresh(case)

    await AuditService.log(
        db=db,
        action="case_create",
        user_id=current_user_id,
        resource_type="case",
        resource_id=case.id,
        details={"case_number": case.case_number, "title": case.title},
        ip_address=request.client.host if request.client else None,
    )

    return CaseResponse(
        id=case.id,
        case_number=case.case_number,
        title=case.title,
        description=case.description,
        agency=case.agency,
        source_type=case.source_type,
        status=case.status,
        operator_id=case.operator_id,
        external_reference=case.external_reference,
        notes=case.notes,
        created_at=case.created_at,
        updated_at=case.updated_at,
        exhibit_count=0,
        fingerprint_count=0,
    )


@router.patch("/{case_id}", response_model=CaseResponse)
async def update_case(
    case_id: str,
    case_data: CaseUpdate,
    request: Request,
    db: AsyncSession = Depends(get_db),
    current_user_id: str = Depends(get_current_user_id),
    _: bool = Depends(require_technician),
):
    """Update case"""
    result = await db.execute(select(Case).where(Case.id == case_id))
    case = result.scalar_one_or_none()

    if not case:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Case not found",
        )

    old_values = {
        "status": case.status.value if case.status else None,
        "title": case.title,
    }

    update_data = case_data.model_dump(exclude_unset=True)
    for field, value in update_data.items():
        setattr(case, field, value)

    await db.commit()
    await db.refresh(case)

    await AuditService.log(
        db=db,
        action="case_update",
        user_id=current_user_id,
        resource_type="case",
        resource_id=case.id,
        old_value=old_values,
        new_value=update_data,
        ip_address=request.client.host if request.client else None,
    )

    exhibit_count_result = await db.execute(
        select(func.count()).where(Exhibit.case_id == case.id)
    )
    exhibit_count = exhibit_count_result.scalar()

    fingerprint_count_result = await db.execute(
        select(func.count())
        .select_from(Fingerprint)
        .join(Exhibit)
        .where(Exhibit.case_id == case.id)
    )
    fingerprint_count = fingerprint_count_result.scalar()

    return CaseResponse(
        id=case.id,
        case_number=case.case_number,
        title=case.title,
        description=case.description,
        agency=case.agency,
        source_type=case.source_type,
        status=case.status,
        operator_id=case.operator_id,
        external_reference=case.external_reference,
        notes=case.notes,
        created_at=case.created_at,
        updated_at=case.updated_at,
        exhibit_count=exhibit_count,
        fingerprint_count=fingerprint_count,
    )


@router.delete("/{case_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_case(
    case_id: str,
    request: Request,
    db: AsyncSession = Depends(get_db),
    current_user_id: str = Depends(get_current_user_id),
    _: bool = Depends(require_technician),
):
    """Delete case (and all exhibits/fingerprints)"""
    result = await db.execute(select(Case).where(Case.id == case_id))
    case = result.scalar_one_or_none()

    if not case:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Case not found",
        )

    await AuditService.log(
        db=db,
        action="case_delete",
        user_id=current_user_id,
        resource_type="case",
        resource_id=case.id,
        details={"case_number": case.case_number, "title": case.title},
        ip_address=request.client.host if request.client else None,
    )

    await db.delete(case)
    await db.commit()
