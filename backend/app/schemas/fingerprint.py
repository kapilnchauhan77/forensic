from pydantic import BaseModel, Field
from typing import Optional, List, Dict, Any
from datetime import datetime
from ..models.fingerprint import (
    PrintType, ProcessingStatus, PatternType, PatternSubtype,
    FingerPosition, EvidenceType, DetailLevel
)


class QualityIssue(BaseModel):
    code: str
    severity: str  # "low", "medium", "high"
    description: str


class QualityAssessment(BaseModel):
    score: float  # 0-100
    issues: List[QualityIssue] = []
    ridge_clarity: Optional[float] = None
    contrast_level: Optional[float] = None
    noise_level: Optional[float] = None
    completeness: Optional[float] = None  # Percentage of print visible


class SingularPointPosition(BaseModel):
    """Position of a core or delta point"""
    x: int = Field(..., ge=0, le=100, description="X position as percentage from left edge")
    y: int = Field(..., ge=0, le=100, description="Y position as percentage from top edge")
    type: Optional[str] = Field(None, description="For cores: loop, whorl, spiral, tented")


class MinutiaeBreakdown(BaseModel):
    """Detailed count of minutiae by type"""
    ridge_endings: int = Field(0, ge=0, description="Count of ridge endings")
    bifurcations: int = Field(0, ge=0, description="Count of bifurcations")
    short_ridges: int = Field(0, ge=0, description="Count of short ridges")
    dots: int = Field(0, ge=0, description="Count of isolated dots")
    islands: int = Field(0, ge=0, description="Count of islands/enclosures")
    other: int = Field(0, ge=0, description="Count of other minutiae types")


class ClassificationResult(BaseModel):
    """Comprehensive fingerprint classification per FBI/NCIC standards"""
    # Primary classification
    pattern_type: PatternType
    pattern_subtype: Optional[PatternSubtype] = None
    confidence: float = Field(..., ge=0, le=1, description="Classification confidence 0-1")
    rationale: str = Field(..., description="Detailed explanation of classification decision")

    # Alternative patterns considered
    alternative_patterns: List[Dict[str, Any]] = Field(
        default=[], description="Other possible patterns with confidence scores"
    )

    # Singular points
    core_detected: bool = False
    delta_detected: bool = False
    core_count: int = Field(0, ge=0, le=2, description="Number of cores detected")
    delta_count: int = Field(0, ge=0, le=3, description="Number of deltas detected")
    core_positions: List[SingularPointPosition] = Field(
        default=[], description="Positions of detected cores"
    )
    delta_positions: List[SingularPointPosition] = Field(
        default=[], description="Positions of detected deltas"
    )

    # FBI/NCIC Classification codes
    ncic_code: Optional[str] = Field(
        None, max_length=2,
        description="NCIC FPC code: AA, TT, PI/PM/PO, II/IM/IO, WI/WM/WO, XX, SR, UP"
    )
    henry_value: Optional[int] = Field(
        None, ge=0, le=16,
        description="Henry system value based on finger position and whorl presence"
    )

    # Ridge characteristics
    ridge_count: Optional[int] = Field(
        None, ge=0,
        description="Ridge count from delta to core (for loops)"
    )
    ridge_flow_direction: Optional[str] = Field(
        None,
        description="Primary ridge flow: left_slant, right_slant, vertical, circular, mixed"
    )
    ridge_density: Optional[float] = Field(
        None, ge=0,
        description="Estimated ridges per mm (typical: 0.3-0.5)"
    )

    # Minutiae summary
    minutiae_count: Optional[int] = Field(
        None, ge=0,
        description="Total estimated minutiae count"
    )
    minutiae_details: Optional[MinutiaeBreakdown] = Field(
        None,
        description="Breakdown of minutiae by type"
    )


class ProcessingResultResponse(BaseModel):
    id: str
    enhanced_storage_path: str
    enhanced_url: Optional[str] = None  # Presigned URL for download
    pipeline_version: str
    enhancement_preset: str
    quality_score_before: Optional[float] = None
    quality_score_after: Optional[float] = None
    quality_improvement: Optional[float] = None
    processing_time_ms: Optional[int] = None
    artifact_risk_level: Optional[str] = None
    artifact_warnings: Optional[List[str]] = None
    is_primary: bool
    created_at: datetime

    class Config:
        from_attributes = True


class FingerprintBase(BaseModel):
    evidence_type: EvidenceType = EvidenceType.UNKNOWN
    print_type: PrintType = PrintType.UNKNOWN
    finger_position: FingerPosition = FingerPosition.UNKNOWN
    subject_id: Optional[str] = None


class FingerprintUploadResponse(BaseModel):
    id: str
    original_filename: str
    original_hash_sha256: str
    file_size_bytes: int
    status: ProcessingStatus
    created_at: datetime

    class Config:
        from_attributes = True


class FingerprintResponse(FingerprintBase):
    id: str
    original_filename: str
    original_hash_sha256: str
    original_url: Optional[str] = None  # Presigned URL for viewing
    file_size_bytes: int
    mime_type: str
    image_width: Optional[int] = None
    image_height: Optional[int] = None
    dpi: Optional[int] = None

    status: ProcessingStatus
    processing_error: Optional[str] = None

    quality_score: Optional[float] = None
    quality_issues: Optional[List[QualityIssue]] = None

    # Classification results
    detail_level: Optional[DetailLevel] = Field(None, description="Analysis detail level (1/2/3)")
    pattern_type: Optional[PatternType] = None
    pattern_subtype: Optional[PatternSubtype] = None
    pattern_confidence: Optional[float] = None
    classification_rationale: Optional[str] = None

    # FBI/NCIC Classification
    ncic_code: Optional[str] = Field(None, description="NCIC FPC code")
    henry_value: Optional[int] = Field(None, description="Henry system value")
    ridge_count: Optional[int] = Field(None, description="Ridge count from delta to core")
    core_count: Optional[int] = Field(None, description="Number of cores detected")
    delta_count: Optional[int] = Field(None, description="Number of deltas detected")

    # Singular point positions
    core_positions: Optional[List[Dict[str, Any]]] = None
    delta_positions: Optional[List[Dict[str, Any]]] = None

    # Minutiae summary
    minutiae_count: Optional[int] = None
    minutiae_details: Optional[Dict[str, int]] = None

    # Ridge characteristics
    ridge_flow_direction: Optional[str] = None
    ridge_density: Optional[float] = None

    # Examiner fields
    examiner_notes: Optional[str] = None
    manual_override: bool = False

    exhibit_id: str
    uploaded_by_id: str

    created_at: datetime
    updated_at: datetime
    processed_at: Optional[datetime] = None

    processing_results: List[ProcessingResultResponse] = []

    class Config:
        from_attributes = True


class FingerprintDetailResponse(FingerprintResponse):
    classification: Optional[ClassificationResult] = None
    quality_assessment: Optional[QualityAssessment] = None
    ridge_orientation_map_url: Optional[str] = None
    rationale_overlay_url: Optional[str] = None


class BatchUploadResponse(BaseModel):
    successful: List[FingerprintUploadResponse]
    failed: List[Dict[str, str]]  # filename -> error message
    total_uploaded: int
    total_failed: int


class ProcessFingerprintRequest(BaseModel):
    enhancement_preset: str = "rolled_plain"
    generate_variants: bool = True


class ReprocessFingerprintRequest(BaseModel):
    enhancement_preset: Optional[str] = None
    force: bool = False  # Force reprocess even if already completed
