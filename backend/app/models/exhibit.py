from sqlalchemy import Column, String, DateTime, ForeignKey, Text, Integer
from sqlalchemy.orm import relationship
from datetime import datetime
import uuid

from ..core.database import Base


class Exhibit(Base):
    __tablename__ = "exhibits"

    id = Column(String, primary_key=True, default=lambda: str(uuid.uuid4()))
    exhibit_number = Column(String, nullable=False)  # E.g., "Exhibit A", "E-001"
    description = Column(Text, nullable=True)
    location_collected = Column(String, nullable=True)
    collection_date = Column(DateTime, nullable=True)
    collector_name = Column(String, nullable=True)

    # Case reference
    case_id = Column(String, ForeignKey("cases.id"), nullable=False)

    # Metadata
    sequence_order = Column(Integer, default=0)  # For ordering exhibits within a case

    # Timestamps
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    # Relationships
    case = relationship("Case", back_populates="exhibits")
    fingerprints = relationship("Fingerprint", back_populates="exhibit", cascade="all, delete-orphan")
