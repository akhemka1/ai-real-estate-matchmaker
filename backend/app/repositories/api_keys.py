from datetime import UTC, datetime

from sqlalchemy import select
from sqlalchemy.orm import Session

from app.core.security import generate_api_key, hash_api_key
from app.models.api_key import ApiKey


class ApiKeyRepository:
    def __init__(self, db: Session):
        self.db = db

    def list_for_org(self, organization_id: str) -> list[ApiKey]:
        return list(
            self.db.scalars(
                select(ApiKey)
                .where(ApiKey.organization_id == organization_id)
                .order_by(ApiKey.created_at.desc())
            ).all()
        )

    def count_active(self, organization_id: str) -> int:
        return len(
            [k for k in self.list_for_org(organization_id) if k.is_active]
        )

    def create(
        self,
        organization_id: str,
        name: str,
        scopes: list[str],
        created_by: str | None,
        expires_at: datetime | None = None,
    ) -> tuple[ApiKey, str]:
        raw_key, prefix, hashed = generate_api_key()
        key = ApiKey(
            organization_id=organization_id,
            created_by=created_by,
            name=name,
            prefix=prefix,
            hashed_key=hashed,
            scopes=scopes,
            expires_at=expires_at,
        )
        self.db.add(key)
        self.db.commit()
        self.db.refresh(key)
        return key, raw_key

    def get_for_org(self, organization_id: str, key_id: str) -> ApiKey | None:
        key = self.db.get(ApiKey, key_id)
        if key is None or key.organization_id != organization_id:
            return None
        return key

    def resolve(self, raw_key: str) -> ApiKey | None:
        """Look up an active, unexpired key by its raw secret value."""
        key = self.db.scalar(select(ApiKey).where(ApiKey.hashed_key == hash_api_key(raw_key)))
        if key is None or not key.is_active:
            return None
        if key.expires_at and key.expires_at < datetime.now(UTC):
            return None
        return key

    def mark_used(self, key: ApiKey) -> None:
        key.last_used_at = datetime.now(UTC)
        self.db.commit()

    def revoke(self, key: ApiKey) -> None:
        key.is_active = False
        self.db.commit()
