from pydantic import BaseModel
from typing import Optional, List
from datetime import datetime
from ..models.case import CaseStatus, SourceType


class CaseBase(BaseModel):
    case_number: str
    title: str
    description: Optional[str] = None
    agency: Optional[str] = None
    source_type: SourceType = SourceType.OTHER
    external_reference: Optional[str] = None
    notes: Optional[str] = None


class CaseCreate(CaseBase):
    pass


class CaseUpdate(BaseModel):
    title: Optional[str] = None
    description: Optional[str] = None
    agency: Optional[str] = None
    source_type: Optional[SourceType] = None
    status: Optional[CaseStatus] = None
    external_reference: Optional[str] = None
    notes: Optional[str] = None


class ExhibitSummary(BaseModel):
    id: str
    exhibit_number: str
    fingerprint_count: int

    class Config:
        from_attributes = True


class CaseResponse(CaseBase):
    id: str
    status: CaseStatus
    operator_id: str
    operator_name: Optional[str] = None
    created_at: datetime
    updated_at: datetime
    exhibit_count: int = 0
    fingerprint_count: int = 0

    class Config:
        from_attributes = True


class CaseDetailResponse(CaseResponse):
    exhibits: List[ExhibitSummary] = []


class CaseListResponse(BaseModel):
    cases: List[CaseResponse]
    total: int
    page: int
    page_size: int
