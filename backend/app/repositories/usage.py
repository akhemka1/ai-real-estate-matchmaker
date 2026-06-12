from datetime import UTC, datetime

from sqlalchemy import select
from sqlalchemy.orm import Session

from app.models.usage import UsageRecord


def current_period() -> str:
    now = datetime.now(UTC)
    return f"{now.year:04d}-{now.month:02d}"


class UsageRepository:
    def __init__(self, db: Session):
        self.db = db

    def get_count(self, organization_id: str, metric: str, period: str | None = None) -> int:
        period = period or current_period()
        record = self._get(organization_id, metric, period)
        return record.count if record else 0

    def increment(self, organization_id: str, metric: str, amount: int = 1) -> int:
        period = current_period()
        record = self._get(organization_id, metric, period)
        if record is None:
            record = UsageRecord(
                organization_id=organization_id, metric=metric, period=period, count=amount
            )
            self.db.add(record)
        else:
            record.count += amount
        self.db.commit()
        return record.count

    def _get(self, organization_id: str, metric: str, period: str) -> UsageRecord | None:
        return self.db.scalar(
            select(UsageRecord).where(
                UsageRecord.organization_id == organization_id,
                UsageRecord.metric == metric,
                UsageRecord.period == period,
            )
        )
