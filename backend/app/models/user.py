from sqlalchemy import Column, String, Boolean, DateTime, Enum
from sqlalchemy.orm import relationship
from datetime import datetime
import uuid
import enum

from ..core.database import Base


class UserRole(str, enum.Enum):
    ADMIN = "admin"
    EXAMINER = "examiner"
    TECHNICIAN = "technician"
    READONLY = "readonly"


class AuthProvider(str, enum.Enum):
    LOCAL = "local"
    GOOGLE = "google"


class User(Base):
    __tablename__ = "users"

    id = Column(String, primary_key=True, default=lambda: str(uuid.uuid4()))
    email = Column(String, unique=True, nullable=False, index=True)
    username = Column(String, unique=True, nullable=False, index=True)
    hashed_password = Column(String, nullable=True)  # Nullable for OAuth-only users
    full_name = Column(String, nullable=True)
    role = Column(Enum(UserRole), default=UserRole.READONLY, nullable=False)
    agency = Column(String, nullable=True)
    is_active = Column(Boolean, default=True)
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    last_login = Column(DateTime, nullable=True)

    # OAuth fields
    auth_provider = Column(
        Enum(AuthProvider, values_callable=lambda obj: [e.value for e in obj]),
        default=AuthProvider.LOCAL,
        nullable=False
    )
    google_id = Column(String, unique=True, nullable=True, index=True)
    profile_picture = Column(String, nullable=True)

    # Relationships
    cases = relationship("Case", back_populates="operator")
    audit_logs = relationship("AuditLog", back_populates="user")
