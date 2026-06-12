"""Organization (tenant) model.

An Organization is a paying customer — a real estate brokerage, agency, or
marketplace. It is the root of tenant isolation: every domain row carries an
`organization_id`, and all data access is scoped to the caller's organization.
"""

import enum

from sqlalchemy import JSON, Enum, Integer, String
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.db.mixins import TimestampMixin, UUIDPrimaryKeyMixin
from app.db.session import Base


class OrganizationStatus(str, enum.Enum):
    trialing = "trialing"
    active = "active"
    past_due = "past_due"
    suspended = "suspended"
    cancelled = "cancelled"


class Organization(UUIDPrimaryKeyMixin, TimestampMixin, Base):
    __tablename__ = "organizations"

    name: Mapped[str] = mapped_column(String(160), nullable=False)
    slug: Mapped[str] = mapped_column(String(80), unique=True, index=True, nullable=False)
    plan_code: Mapped[str] = mapped_column(String(40), default="trial", nullable=False)
    status: Mapped[OrganizationStatus] = mapped_column(
        Enum(OrganizationStatus), default=OrganizationStatus.trialing, index=True, nullable=False
    )
    billing_email: Mapped[str | None] = mapped_column(String(255))
    country: Mapped[str | None] = mapped_column(String(2))
    settings: Mapped[dict] = mapped_column(JSON, default=dict, nullable=False)

    # CRM lead routing config.
    lead_distribution_mode: Mapped[str] = mapped_column(String(20), default="rotation", nullable=False)
    lead_rotation_index: Mapped[int] = mapped_column(Integer, default=0, nullable=False)

    members = relationship("User", back_populates="organization", foreign_keys="User.organization_id")
