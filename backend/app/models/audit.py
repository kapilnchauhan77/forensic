from sqlalchemy import Column, String, DateTime, ForeignKey, Text, JSON, Enum
from sqlalchemy.orm import relationship
from datetime import datetime
import uuid
import enum

from ..core.database import Base


class AuditAction(str, enum.Enum):
    # Authentication
    LOGIN = "login"
    LOGOUT = "logout"
    LOGIN_FAILED = "login_failed"

    # Case operations
    CASE_CREATE = "case_create"
    CASE_UPDATE = "case_update"
    CASE_DELETE = "case_delete"
    CASE_VIEW = "case_view"

    # Exhibit operations
    EXHIBIT_CREATE = "exhibit_create"
    EXHIBIT_UPDATE = "exhibit_update"
    EXHIBIT_DELETE = "exhibit_delete"

    # Fingerprint operations
    FINGERPRINT_UPLOAD = "fingerprint_upload"
    FINGERPRINT_DELETE = "fingerprint_delete"
    FINGERPRINT_PROCESS = "fingerprint_process"
    FINGERPRINT_REPROCESS = "fingerprint_reprocess"
    FINGERPRINT_VIEW = "fingerprint_view"
    FINGERPRINT_DOWNLOAD = "fingerprint_download"

    # Export operations
    EXPORT_EVIDENCE_PACK = "export_evidence_pack"
    EXPORT_REPORT = "export_report"

    # Admin operations
    USER_CREATE = "user_create"
    USER_UPDATE = "user_update"
    USER_DELETE = "user_delete"
    USER_ROLE_CHANGE = "user_role_change"
    CONFIG_CHANGE = "config_change"

    # Pipeline operations
    PIPELINE_CONFIG_UPDATE = "pipeline_config_update"


class AuditLog(Base):
    __tablename__ = "audit_logs"

    id = Column(String, primary_key=True, default=lambda: str(uuid.uuid4()))

    # Who
    user_id = Column(String, ForeignKey("users.id"), nullable=True)  # Nullable for failed logins
    username = Column(String, nullable=True)  # Stored separately in case user is deleted

    # What
    action = Column(Enum(AuditAction), nullable=False)
    resource_type = Column(String, nullable=True)  # "case", "fingerprint", "user", etc.
    resource_id = Column(String, nullable=True)

    # Details
    details = Column(JSON, nullable=True)  # Action-specific details
    old_value = Column(JSON, nullable=True)  # For update actions
    new_value = Column(JSON, nullable=True)  # For update actions

    # Context
    ip_address = Column(String, nullable=True)
    user_agent = Column(String, nullable=True)

    # Status
    success = Column(String, default="success")  # "success", "failure", "partial"
    error_message = Column(Text, nullable=True)

    # Timestamp
    created_at = Column(DateTime, default=datetime.utcnow, index=True)

    # Relationships
    user = relationship("User", back_populates="audit_logs")
