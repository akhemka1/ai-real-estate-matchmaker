from __future__ import annotations

import re
import secrets

from sqlalchemy import select
from sqlalchemy.orm import Session

from app.models.organization import Organization, OrganizationStatus


def slugify(value: str) -> str:
    slug = re.sub(r"[^a-z0-9]+", "-", value.lower()).strip("-")
    return slug or "org"


class OrganizationRepository:
    def __init__(self, db: Session):
        self.db = db

    def get(self, organization_id: str) -> Organization | None:
        return self.db.get(Organization, organization_id)

    def get_by_slug(self, slug: str) -> Organization | None:
        return self.db.scalar(select(Organization).where(Organization.slug == slug))

    def list(self) -> list[Organization]:
        return list(self.db.scalars(select(Organization).order_by(Organization.created_at.desc())).all())

    def create(
        self,
        name: str,
        *,
        plan_code: str = "trial",
        billing_email: str | None = None,
        status: OrganizationStatus = OrganizationStatus.trialing,
    ) -> Organization:
        org = Organization(
            name=name,
            slug=self._unique_slug(name),
            plan_code=plan_code,
            billing_email=billing_email,
            status=status,
        )
        self.db.add(org)
        self.db.commit()
        self.db.refresh(org)
        return org

    def update(self, org: Organization, **fields) -> Organization:
        for key, value in fields.items():
            if value is not None:
                setattr(org, key, value)
        self.db.commit()
        self.db.refresh(org)
        return org

    def _unique_slug(self, name: str) -> str:
        base = slugify(name)
        slug = base
        while self.get_by_slug(slug) is not None:
            slug = f"{base}-{secrets.token_hex(2)}"
        return slug
