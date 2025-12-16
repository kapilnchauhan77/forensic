from sqlalchemy import Column, String, DateTime, ForeignKey, Text, Float, Integer, JSON, Enum, Boolean
from sqlalchemy.orm import relationship
from datetime import datetime
import uuid
import enum

from ..core.database import Base


class PrintType(str, enum.Enum):
    LATENT = "latent"
    ROLLED = "rolled"
    PLAIN = "plain"
    SLAP = "slap"
    PARTIAL = "partial"
    UNKNOWN = "unknown"


class ProcessingStatus(str, enum.Enum):
    PENDING = "pending"
    QUEUED = "queued"
    PROCESSING = "processing"
    COMPLETED = "completed"
    FAILED = "failed"


class PatternType(str, enum.Enum):
    ARCH = "arch"
    TENTED_ARCH = "tented_arch"
    LEFT_LOOP = "left_loop"
    RIGHT_LOOP = "right_loop"
    WHORL = "whorl"
    UNKNOWN = "unknown"
    PARTIAL = "partial"


class FingerPosition(str, enum.Enum):
    RIGHT_THUMB = "right_thumb"
    RIGHT_INDEX = "right_index"
    RIGHT_MIDDLE = "right_middle"
    RIGHT_RING = "right_ring"
    RIGHT_LITTLE = "right_little"
    LEFT_THUMB = "left_thumb"
    LEFT_INDEX = "left_index"
    LEFT_MIDDLE = "left_middle"
    LEFT_RING = "left_ring"
    LEFT_LITTLE = "left_little"
    UNKNOWN = "unknown"


class Fingerprint(Base):
    __tablename__ = "fingerprints"

    id = Column(String, primary_key=True, default=lambda: str(uuid.uuid4()))

    # Original file info
    original_filename = Column(String, nullable=False)
    original_storage_path = Column(String, nullable=False)  # Path in object storage
    original_hash_sha256 = Column(String(64), nullable=False)  # For integrity verification
    file_size_bytes = Column(Integer, nullable=False)
    mime_type = Column(String, nullable=False)
    image_width = Column(Integer, nullable=True)
    image_height = Column(Integer, nullable=True)
    dpi = Column(Integer, nullable=True)

    # Metadata
    print_type = Column(Enum(PrintType), default=PrintType.UNKNOWN)
    finger_position = Column(Enum(FingerPosition), default=FingerPosition.UNKNOWN)
    subject_id = Column(String, nullable=True)  # Anonymous subject identifier if known

    # Processing
    status = Column(Enum(ProcessingStatus), default=ProcessingStatus.PENDING)
    processing_error = Column(Text, nullable=True)

    # Quality assessment
    quality_score = Column(Float, nullable=True)  # 0-100 quality metric
    quality_issues = Column(JSON, nullable=True)  # List of detected issues

    # Classification results (from VLM)
    pattern_type = Column(Enum(PatternType), nullable=True)
    pattern_confidence = Column(Float, nullable=True)  # 0-1 confidence score
    classification_rationale = Column(Text, nullable=True)

    # Exhibit reference
    exhibit_id = Column(String, ForeignKey("exhibits.id"), nullable=False)

    # Uploaded by
    uploaded_by_id = Column(String, ForeignKey("users.id"), nullable=False)

    # Timestamps
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    processed_at = Column(DateTime, nullable=True)

    # Relationships
    exhibit = relationship("Exhibit", back_populates="fingerprints")
    uploaded_by = relationship("User")
    processing_results = relationship(
        "FingerprintProcessingResult",
        back_populates="fingerprint",
        cascade="all, delete-orphan"
    )


class FingerprintProcessingResult(Base):
    """Stores each processing result with full provenance"""
    __tablename__ = "fingerprint_processing_results"

    id = Column(String, primary_key=True, default=lambda: str(uuid.uuid4()))

    fingerprint_id = Column(String, ForeignKey("fingerprints.id"), nullable=False)

    # Enhanced image
    enhanced_storage_path = Column(String, nullable=False)
    enhanced_hash_sha256 = Column(String(64), nullable=False)

    # Pipeline provenance
    pipeline_version = Column(String, nullable=False)  # e.g., "1.0.0"
    pipeline_config = Column(JSON, nullable=False)  # Full parameters used
    enhancement_preset = Column(String, nullable=False)  # e.g., "latent", "rolled_plain"

    # Model provenance (for VLM classification)
    model_name = Column(String, nullable=True)  # e.g., "gemini-1.5-pro"
    model_version = Column(String, nullable=True)
    prompt_version = Column(String, nullable=True)
    prompt_hash = Column(String(64), nullable=True)

    # Quality metrics after enhancement
    quality_score_before = Column(Float, nullable=True)
    quality_score_after = Column(Float, nullable=True)
    quality_improvement = Column(Float, nullable=True)

    # Processing metadata
    processing_time_ms = Column(Integer, nullable=True)
    artifact_risk_level = Column(String, nullable=True)  # "low", "medium", "high"
    artifact_warnings = Column(JSON, nullable=True)

    # Classification overlay data
    ridge_orientation_map_path = Column(String, nullable=True)
    rationale_overlay_path = Column(String, nullable=True)

    # Is this the "best" result for this fingerprint?
    is_primary = Column(Boolean, default=False)

    # Timestamps
    created_at = Column(DateTime, default=datetime.utcnow)

    # Relationships
    fingerprint = relationship("Fingerprint", back_populates="processing_results")
