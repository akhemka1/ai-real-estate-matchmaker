"""Plan-quota enforcement and usage metering.

Wraps the usage repository with the plan catalog so endpoints can ask
"may this org perform one more X?" and record consumption atomically.
"""

from sqlalchemy.orm import Session

from app.core.plans import get_plan, within_limit
from app.models.organization import Organization
from app.repositories.api_keys import ApiKeyRepository
from app.repositories.properties import PropertyRepository
from app.repositories.usage import UsageRepository
from app.repositories.users import UserRepository

# Metric keys.
METRIC_AI_CALLS = "ai_calls"


class QuotaExceededError(Exception):
    def __init__(self, metric: str, limit: int):
        self.metric = metric
        self.limit = limit
        super().__init__(f"Quota exceeded for '{metric}' (limit {limit}).")


class UsageService:
    def __init__(self, db: Session):
        self.db = db
        self.usage = UsageRepository(db)

    # --- AI metering -----------------------------------------------------
    def consume_ai_call(self, org: Organization, amount: int = 1) -> int:
        plan = get_plan(org.plan_code)
        used = self.usage.get_count(org.id, METRIC_AI_CALLS)
        if not within_limit(used + amount - 1, plan.ai_calls_per_month):
            raise QuotaExceededError(METRIC_AI_CALLS, plan.ai_calls_per_month)
        return self.usage.increment(org.id, METRIC_AI_CALLS, amount)

    # --- Seat / listing / key guards (checked before create) -------------
    def can_add_seat(self, org: Organization) -> bool:
        plan = get_plan(org.plan_code)
        return within_limit(UserRepository(self.db).count_for_org(org.id), plan.max_seats)

    def can_add_property(self, org: Organization) -> bool:
        plan = get_plan(org.plan_code)
        return within_limit(PropertyRepository(self.db).count_for_org(org.id), plan.max_properties)

    def can_add_api_key(self, org: Organization) -> bool:
        plan = get_plan(org.plan_code)
        return within_limit(ApiKeyRepository(self.db).count_active(org.id), plan.api_keys)

    # --- Reporting -------------------------------------------------------
    def snapshot(self, org: Organization) -> dict:
        plan = get_plan(org.plan_code)
        seats = UserRepository(self.db).count_for_org(org.id)
        properties = PropertyRepository(self.db).count_for_org(org.id)
        ai_calls = self.usage.get_count(org.id, METRIC_AI_CALLS)
        api_keys = ApiKeyRepository(self.db).count_active(org.id)

        def quota(metric: str, used: int, limit: int) -> dict:
            remaining = -1 if limit < 0 else max(0, limit - used)
            return {"metric": metric, "used": used, "limit": limit, "remaining": remaining}

        return {
            "plan_code": plan.code,
            "plan_name": plan.name,
            "quotas": [
                quota("seats", seats, plan.max_seats),
                quota("properties", properties, plan.max_properties),
                quota("ai_calls", ai_calls, plan.ai_calls_per_month),
                quota("api_keys", api_keys, plan.api_keys),
            ],
        }
