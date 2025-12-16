from sqlalchemy import Column, String, DateTime, ForeignKey, Text, Float, Integer, JSON, Enum, Boolean
from sqlalchemy.orm import relationship
from datetime import datetime
import uuid
import enum

from ..core.database import Base


class EvidenceType(str, enum.Enum):
    """How the print is deposited/found at a scene (forensic evidence classification)"""
    LATENT = "latent"  # Invisible/barely visible; requires development (powders, chemicals, ALS)
    PATENT = "patent"  # Visible prints in colored substance (blood, ink, grease, dirt, paint)
    PLASTIC = "plastic"  # 3D impressions in soft materials (wax, putty, clay, soap, dust)
    UNKNOWN = "unknown"


class PrintType(str, enum.Enum):
    """How the print was captured/recorded (acquisition method)"""
    ROLLED = "rolled"  # Nail-to-nail roll for complete pattern
    PLAIN = "plain"  # Flat press without rolling
    SLAP = "slap"  # Four-finger simultaneous capture
    LATENT_LIFT = "latent_lift"  # Lifted from scene
    PHOTO = "photo"  # Photographed in place
    CAST = "cast"  # 3D cast/mold of plastic print
    PARTIAL = "partial"  # Incomplete/fragmentary
    UNKNOWN = "unknown"


class ProcessingStatus(str, enum.Enum):
    PENDING = "pending"
    QUEUED = "queued"
    PROCESSING = "processing"
    COMPLETED = "completed"
    FAILED = "failed"


class PatternType(str, enum.Enum):
    """Primary pattern classification (Henry System) - Level 1 analysis"""
    # Core patterns
    ARCH = "arch"  # Ridges enter one side and exit the other without recurving
    LOOP = "loop"  # Ridges enter from one side, recurve, and exit the same side
    WHORL = "whorl"  # Circular/spiral ridge formations with two deltas

    # Special cases
    UNKNOWN = "unknown"  # Cannot determine with forensic confidence
    PARTIAL = "partial"  # Insufficient ridge area visible for classification


class PatternSubtype(str, enum.Enum):
    """Detailed pattern subtypes per FBI/NCIC standards"""
    # Arch subtypes (no delta, no core)
    PLAIN_ARCH = "plain_arch"  # Smooth wave-like pattern
    TENTED_ARCH = "tented_arch"  # Sharp upward thrust/spike in center, ONE delta possible

    # Loop subtypes (ONE core, ONE delta)
    ULNAR_LOOP = "ulnar_loop"  # Opens toward ulnar bone (little finger side)
    RADIAL_LOOP = "radial_loop"  # Opens toward radial bone (thumb side)
    CENTRAL_POCKET_LOOP = "central_pocket_loop"  # Loop with whorl-like center
    DOUBLE_LOOP = "double_loop"  # Two separate loop formations
    NUTANT_LOOP = "nutant_loop"  # Loop with core bent to one side

    # Whorl subtypes (TWO or more deltas)
    PLAIN_WHORL = "plain_whorl"  # Concentric circles or spirals
    CENTRAL_POCKET_WHORL = "central_pocket_whorl"  # Whorl with loop obstruction
    DOUBLE_LOOP_WHORL = "double_loop_whorl"  # Two loops with two deltas (S-type pattern)
    ACCIDENTAL_WHORL = "accidental_whorl"  # Irregular combination of patterns
    COMPOSITE_WHORL = "composite_whorl"  # Mixed pattern elements

    # Special classifications
    UNKNOWN = "unknown"
    SCARRED = "scarred"  # Permanent scarring affecting pattern
    AMPUTATED = "amputated"  # Finger missing or partially missing
    BANDAGED = "bandaged"  # Temporarily obscured


class DetailLevel(str, enum.Enum):
    """Analysis detail levels available for this impression"""
    LEVEL_1 = "level_1"  # Overall ridge flow: pattern class, cores, deltas
    LEVEL_2 = "level_2"  # Minutiae: ridge endings, bifurcations, short ridges
    LEVEL_3 = "level_3"  # Fine detail: pores, ridge edges, incipient ridges, scars


class RidgeCharacteristic(str, enum.Enum):
    """Minutiae types for ridge characteristics"""
    RIDGE_ENDING = "ridge_ending"  # Abrupt end of a ridge
    BIFURCATION = "bifurcation"  # Ridge splits into two
    SHORT_RIDGE = "short_ridge"  # Ridge significantly shorter than neighbors
    DOT = "dot"  # Isolated ridge unit
    ISLAND = "island"  # Ridge bifurcates and reunites (enclosure)
    LAKE = "lake"  # Larger enclosure than island
    SPUR = "spur"  # Bifurcation with one short branch
    CROSSOVER = "crossover"  # Two ridges cross each other
    BRIDGE = "bridge"  # Short ridge connecting two parallel ridges
    DOUBLE_BIFURCATION = "double_bifurcation"  # Two bifurcations in sequence
    TRIFURCATION = "trifurcation"  # Ridge splits into three


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

    # Evidence classification
    evidence_type = Column(Enum(EvidenceType), default=EvidenceType.UNKNOWN)  # latent/patent/plastic
    print_type = Column(Enum(PrintType), default=PrintType.UNKNOWN)  # How captured
    impression_type = Column(String, nullable=True)  # Additional: palmprint, soleprint, etc.
    finger_position = Column(Enum(FingerPosition), default=FingerPosition.UNKNOWN)
    subject_id = Column(String, nullable=True)  # Anonymous subject identifier if known

    # Analysis detail level achieved
    detail_level = Column(Enum(DetailLevel), nullable=True)  # Level 1/2/3 analysis capability

    # Processing
    status = Column(Enum(ProcessingStatus), default=ProcessingStatus.PENDING)
    processing_error = Column(Text, nullable=True)

    # Quality assessment
    quality_score = Column(Float, nullable=True)  # 0-100 quality metric
    quality_issues = Column(JSON, nullable=True)  # List of detected issues

    # Classification results (from VLM)
    pattern_type = Column(Enum(PatternType), nullable=True)
    pattern_subtype = Column(Enum(PatternSubtype), nullable=True)
    pattern_confidence = Column(Float, nullable=True)  # 0-1 confidence score
    classification_rationale = Column(Text, nullable=True)

    # Detailed forensic classification
    ncic_code = Column(String(2), nullable=True)  # NCIC FPC code (e.g., "AA", "TT", "PI")
    henry_value = Column(Integer, nullable=True)  # Henry system numerical value
    ridge_count = Column(Integer, nullable=True)  # Ridge count from delta to core
    core_count = Column(Integer, nullable=True)  # Number of cores detected (0, 1, or 2)
    delta_count = Column(Integer, nullable=True)  # Number of deltas detected (0, 1, or 2+)

    # Singular points (JSON with coordinates)
    core_positions = Column(JSON, nullable=True)  # [{"x": int, "y": int, "type": str}]
    delta_positions = Column(JSON, nullable=True)  # [{"x": int, "y": int}]

    # Minutiae summary
    minutiae_count = Column(Integer, nullable=True)  # Total minutiae detected
    minutiae_details = Column(JSON, nullable=True)  # Detailed minutiae breakdown by type

    # Ridge flow characteristics
    ridge_flow_direction = Column(String, nullable=True)  # "left_slant", "right_slant", "vertical", "mixed"
    ridge_density = Column(Float, nullable=True)  # Ridges per mm

    # Forensic examiner notes
    examiner_notes = Column(Text, nullable=True)
    manual_override = Column(Boolean, default=False)  # If classification was manually corrected

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
