"""Subscription plan catalog and quota definitions.

This is the commercial backbone of the SaaS: every organization is on a plan,
and plans cap seats, listing volume, and metered AI usage. Quotas are enforced
in `app.services.usage` and surfaced via the organizations API so customers can
see consumption against their entitlements.

`-1` denotes "unlimited".
"""

from __future__ import annotations

from dataclasses import dataclass, field


@dataclass(frozen=True)
class Plan:
    code: str
    name: str
    price_usd_per_month: float
    max_seats: int
    max_properties: int
    ai_calls_per_month: int
    api_keys: int
    features: list[str] = field(default_factory=list)

    def as_dict(self) -> dict:
        return {
            "code": self.code,
            "name": self.name,
            "price_usd_per_month": self.price_usd_per_month,
            "max_seats": self.max_seats,
            "max_properties": self.max_properties,
            "ai_calls_per_month": self.ai_calls_per_month,
            "api_keys": self.api_keys,
            "features": list(self.features),
        }


PLANS: dict[str, Plan] = {
    "trial": Plan(
        code="trial",
        name="14-Day Trial",
        price_usd_per_month=0.0,
        max_seats=3,
        max_properties=50,
        ai_calls_per_month=500,
        api_keys=1,
        features=["recommendations", "price_prediction", "explainable_ai"],
    ),
    "starter": Plan(
        code="starter",
        name="Starter",
        price_usd_per_month=199.0,
        max_seats=10,
        max_properties=1_000,
        ai_calls_per_month=10_000,
        api_keys=3,
        features=["recommendations", "price_prediction", "explainable_ai", "lead_matching"],
    ),
    "growth": Plan(
        code="growth",
        name="Growth",
        price_usd_per_month=799.0,
        max_seats=50,
        max_properties=25_000,
        ai_calls_per_month=150_000,
        api_keys=15,
        features=[
            "recommendations",
            "price_prediction",
            "explainable_ai",
            "lead_matching",
            "image_analysis",
            "webhooks",
        ],
    ),
    "enterprise": Plan(
        code="enterprise",
        name="Enterprise",
        price_usd_per_month=2_499.0,
        max_seats=-1,
        max_properties=-1,
        ai_calls_per_month=-1,
        api_keys=-1,
        features=[
            "recommendations",
            "price_prediction",
            "explainable_ai",
            "lead_matching",
            "image_analysis",
            "webhooks",
            "sso",
            "priority_support",
            "custom_models",
        ],
    ),
}

DEFAULT_PLAN = "trial"


def get_plan(code: str | None) -> Plan:
    return PLANS.get(code or DEFAULT_PLAN, PLANS[DEFAULT_PLAN])


def is_unlimited(value: int) -> bool:
    return value < 0


def within_limit(current: int, limit: int) -> bool:
    """Return True if one more unit fits inside the limit (`-1` == unlimited)."""
    if is_unlimited(limit):
        return True
    return current < limit
