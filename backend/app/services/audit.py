from sqlalchemy.ext.asyncio import AsyncSession
from typing import Optional, Any
from ..models.audit import AuditLog, AuditAction


class AuditService:
    @staticmethod
    async def log(
        db: AsyncSession,
        action: str,
        user_id: Optional[str] = None,
        username: Optional[str] = None,
        resource_type: Optional[str] = None,
        resource_id: Optional[str] = None,
        details: Optional[dict] = None,
        old_value: Optional[dict] = None,
        new_value: Optional[dict] = None,
        ip_address: Optional[str] = None,
        user_agent: Optional[str] = None,
        success: str = "success",
        error_message: Optional[str] = None,
    ) -> AuditLog:
        """Create an audit log entry"""
        # Map string action to enum
        try:
            action_enum = AuditAction(action)
        except ValueError:
            action_enum = AuditAction.CONFIG_CHANGE  # Default fallback

        audit_log = AuditLog(
            user_id=user_id,
            username=username,
            action=action_enum,
            resource_type=resource_type,
            resource_id=resource_id,
            details=details,
            old_value=old_value,
            new_value=new_value,
            ip_address=ip_address,
            user_agent=user_agent,
            success=success,
            error_message=error_message,
        )

        db.add(audit_log)
        await db.commit()
        return audit_log
