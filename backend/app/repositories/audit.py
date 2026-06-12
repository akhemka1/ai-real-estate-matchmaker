from sqlalchemy import select
from sqlalchemy.orm import Session

from app.models.audit import AuditLog


class AuditRepository:
    def __init__(self, db: Session):
        self.db = db

    def record(
        self,
        *,
        action: str,
        organization_id: str | None = None,
        actor_id: str | None = None,
        actor_label: str | None = None,
        resource_type: str | None = None,
        resource_id: str | None = None,
        ip_address: str | None = None,
        request_id: str | None = None,
        extra: dict | None = None,
    ) -> AuditLog:
        entry = AuditLog(
            action=action,
            organization_id=organization_id,
            actor_id=actor_id,
            actor_label=actor_label,
            resource_type=resource_type,
            resource_id=resource_id,
            ip_address=ip_address,
            request_id=request_id,
            extra=extra or {},
        )
        self.db.add(entry)
        self.db.commit()
        return entry

    def list_for_org(self, organization_id: str, limit: int = 100) -> list[AuditLog]:
        return list(
            self.db.scalars(
                select(AuditLog)
                .where(AuditLog.organization_id == organization_id)
                .order_by(AuditLog.created_at.desc())
                .limit(limit)
            ).all()
        )
