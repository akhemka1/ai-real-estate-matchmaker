"""CRM Lead model and lead-distribution configuration.

A Lead is a prospective buyer/renter routed to a team member according to the
organization's distribution mode (all / first / rotation / me). Stages model the
sales pipeline from first contact to won/lost.
"""

import enum

from sqlalchemy import JSON, Enum, ForeignKey, Numeric, String
from sqlalchemy.orm import Mapped, mapped_column

from app.db.mixins import TimestampMixin, UUIDPrimaryKeyMixin
from app.db.session import Base


class LeadStage(str, enum.Enum):
    new = "new"
    contacted = "contacted"
    qualified = "qualified"
    negotiation = "negotiation"
    won = "won"
    lost = "lost"


class DistributionMode(str, enum.Enum):
    all = "all"  # shared pool, unassigned
    first = "first"  # first responder claims
    rotation = "rotation"  # fair round-robin auto-assign
    me = "me"  # assign to the creating user


class Lead(UUIDPrimaryKeyMixin, TimestampMixin, Base):
    __tablename__ = "leads"

    organization_id: Mapped[str] = mapped_column(
        String(36), ForeignKey("organizations.id", ondelete="CASCADE"), index=True, nullable=False
    )
    name: Mapped[str] = mapped_column(String(160), nullable=False)
    email: Mapped[str] = mapped_column(String(255), index=True, nullable=False)
    phone: Mapped[str | None] = mapped_column(String(40))
    source: Mapped[str] = mapped_column(String(60), default="Website", nullable=False)
    stage: Mapped[LeadStage] = mapped_column(
        Enum(LeadStage), default=LeadStage.new, index=True, nullable=False
    )
    assigned_to: Mapped[str | None] = mapped_column(
        String(36), ForeignKey("users.id", ondelete="SET NULL"), index=True
    )
    tags: Mapped[list[str]] = mapped_column(JSON, default=list, nullable=False)
    property_interest: Mapped[str | None] = mapped_column(String(200))
    budget: Mapped[str | None] = mapped_column(String(80))
    value: Mapped[float | None] = mapped_column(Numeric(16, 2))
