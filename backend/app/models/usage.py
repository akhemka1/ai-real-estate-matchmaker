"""Metered usage records for plan-quota enforcement and billing.

One row per (organization, metric, period) where period is a UTC month key
("2026-06"). Counts are upserted atomically by the usage service.
"""

from sqlalchemy import BigInteger, ForeignKey, String, UniqueConstraint
from sqlalchemy.orm import Mapped, mapped_column

from app.db.mixins import TimestampMixin, UUIDPrimaryKeyMixin
from app.db.session import Base


class UsageRecord(UUIDPrimaryKeyMixin, TimestampMixin, Base):
    __tablename__ = "usage_records"
    __table_args__ = (
        UniqueConstraint("organization_id", "metric", "period", name="uq_usage_org_metric_period"),
    )

    organization_id: Mapped[str] = mapped_column(
        String(36), ForeignKey("organizations.id", ondelete="CASCADE"), index=True, nullable=False
    )
    metric: Mapped[str] = mapped_column(String(80), index=True, nullable=False)
    period: Mapped[str] = mapped_column(String(7), index=True, nullable=False)  # YYYY-MM
    count: Mapped[int] = mapped_column(BigInteger, default=0, nullable=False)
