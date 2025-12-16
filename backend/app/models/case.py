from sqlalchemy import Column, String, DateTime, ForeignKey, Text, Enum
from sqlalchemy.orm import relationship
from datetime import datetime
import uuid
import enum

from ..core.database import Base


class CaseStatus(str, enum.Enum):
    OPEN = "open"
    IN_PROGRESS = "in_progress"
    REVIEW = "review"
    CLOSED = "closed"
    ARCHIVED = "archived"


class SourceType(str, enum.Enum):
    CRIME_SCENE = "crime_scene"
    BOOKING = "booking"
    ELIMINATION = "elimination"
    TRAINING = "training"
    QUALITY_CONTROL = "quality_control"
    OTHER = "other"


class Case(Base):
    __tablename__ = "cases"

    id = Column(String, primary_key=True, default=lambda: str(uuid.uuid4()))
    case_number = Column(String, unique=True, nullable=False, index=True)
    title = Column(String, nullable=False)
    description = Column(Text, nullable=True)
    agency = Column(String, nullable=True)
    source_type = Column(Enum(SourceType), default=SourceType.OTHER)
    status = Column(Enum(CaseStatus), default=CaseStatus.OPEN)

    # Operator/creator
    operator_id = Column(String, ForeignKey("users.id"), nullable=False)

    # Timestamps
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    # Metadata
    external_reference = Column(String, nullable=True)  # External case ID from other systems
    notes = Column(Text, nullable=True)

    # Relationships
    operator = relationship("User", back_populates="cases")
    exhibits = relationship("Exhibit", back_populates="case", cascade="all, delete-orphan")
