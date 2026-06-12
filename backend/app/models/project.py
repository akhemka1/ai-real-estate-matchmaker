"""Off-Plan Project (development) model — the off-plan marketplace domain.

Mirrors the off-plan listing experience: developments from a developer with a
structured payment plan (booking / during-construction / handover splits),
unit-type inventory, yield/appreciation forecasts, and location intelligence.
"""

import enum

from sqlalchemy import JSON, Enum, Float, ForeignKey, Integer, Numeric, String, Text
from sqlalchemy.orm import Mapped, mapped_column

from app.db.mixins import TimestampMixin, UUIDPrimaryKeyMixin
from app.db.session import Base


class ProjectStatus(str, enum.Enum):
    pre_launch = "pre_launch"
    selling = "selling"
    under_construction = "under_construction"
    ready = "ready"


class OffPlanProject(UUIDPrimaryKeyMixin, TimestampMixin, Base):
    __tablename__ = "off_plan_projects"

    organization_id: Mapped[str] = mapped_column(
        String(36), ForeignKey("organizations.id", ondelete="CASCADE"), index=True, nullable=False
    )
    name: Mapped[str] = mapped_column(String(200), index=True, nullable=False)
    developer: Mapped[str] = mapped_column(String(160), index=True, nullable=False)
    city: Mapped[str] = mapped_column(String(120), index=True, nullable=False)
    state: Mapped[str | None] = mapped_column(String(120))
    country: Mapped[str] = mapped_column(String(2), index=True, nullable=False)
    status: Mapped[ProjectStatus] = mapped_column(
        Enum(ProjectStatus), default=ProjectStatus.selling, index=True, nullable=False
    )
    completion: Mapped[str] = mapped_column(String(40), nullable=False)  # "Q4 2027"
    price_from: Mapped[float] = mapped_column(Numeric(16, 2), index=True, nullable=False)
    currency: Mapped[str] = mapped_column(String(8), default="AED", nullable=False)

    # Payment plan split (percentages summing to 100).
    down_payment_pct: Mapped[int] = mapped_column(Integer, default=20, nullable=False)
    during_construction_pct: Mapped[int] = mapped_column(Integer, default=40, nullable=False)
    handover_pct: Mapped[int] = mapped_column(Integer, default=40, nullable=False)
    payment_plan_label: Mapped[str] = mapped_column(String(40), default="60 / 40", nullable=False)

    rental_yield: Mapped[float] = mapped_column(Float, default=0.0, nullable=False)
    appreciation_5yr: Mapped[float] = mapped_column(Float, default=0.0, nullable=False)

    unit_types: Mapped[list[dict]] = mapped_column(JSON, default=list, nullable=False)
    amenities: Mapped[list[str]] = mapped_column(JSON, default=list, nullable=False)
    images: Mapped[list[str]] = mapped_column(JSON, default=list, nullable=False)
    description: Mapped[str] = mapped_column(Text, default="", nullable=False)
    location: Mapped[dict] = mapped_column(JSON, default=dict, nullable=False)
