from pydantic import BaseModel
from typing import Optional, List
from datetime import datetime


class ExhibitBase(BaseModel):
    exhibit_number: str
    description: Optional[str] = None
    location_collected: Optional[str] = None
    collection_date: Optional[datetime] = None
    collector_name: Optional[str] = None


class ExhibitCreate(ExhibitBase):
    case_id: str


class ExhibitUpdate(BaseModel):
    exhibit_number: Optional[str] = None
    description: Optional[str] = None
    location_collected: Optional[str] = None
    collection_date: Optional[datetime] = None
    collector_name: Optional[str] = None
    sequence_order: Optional[int] = None


class FingerprintSummary(BaseModel):
    id: str
    original_filename: str
    status: str
    quality_score: Optional[float] = None
    pattern_type: Optional[str] = None
    pattern_confidence: Optional[float] = None

    class Config:
        from_attributes = True


class ExhibitResponse(ExhibitBase):
    id: str
    case_id: str
    sequence_order: int
    created_at: datetime
    updated_at: datetime
    fingerprint_count: int = 0

    class Config:
        from_attributes = True


class ExhibitDetailResponse(ExhibitResponse):
    fingerprints: List[FingerprintSummary] = []
