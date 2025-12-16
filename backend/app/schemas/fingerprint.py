from pydantic import BaseModel
from typing import Optional, List, Dict, Any
from datetime import datetime
from ..models.fingerprint import PrintType, ProcessingStatus, PatternType, FingerPosition


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


class ClassificationResult(BaseModel):
    pattern_type: PatternType
    confidence: float  # 0-1
    rationale: str
    alternative_patterns: List[Dict[str, Any]] = []  # Other possible patterns with lower confidence
    core_detected: bool = False
    delta_detected: bool = False


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

    pattern_type: Optional[PatternType] = None
    pattern_confidence: Optional[float] = None
    classification_rationale: Optional[str] = None

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
