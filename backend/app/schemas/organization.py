from datetime import datetime
from typing import Literal

from pydantic import BaseModel, EmailStr, Field

from app.schemas.common import ORMModel

OrganizationStatus = Literal["trialing", "active", "past_due", "suspended", "cancelled"]


class OrganizationUpdate(BaseModel):
    name: str | None = Field(default=None, min_length=2, max_length=160)
    billing_email: EmailStr | None = None
    country: str | None = Field(default=None, min_length=2, max_length=2)
    settings: dict | None = None


class PlanChangeRequest(BaseModel):
    plan_code: Literal["trial", "starter", "growth", "enterprise"]


class OrganizationRead(ORMModel):
    id: str
    name: str
    slug: str
    plan_code: str
    status: OrganizationStatus
    billing_email: str | None = None
    country: str | None = None
    settings: dict = Field(default_factory=dict)
    created_at: datetime
    updated_at: datetime


class QuotaUsage(BaseModel):
    metric: str
    used: int
    limit: int  # -1 means unlimited
    remaining: int  # -1 means unlimited


class OrganizationUsageRead(BaseModel):
    organization_id: str
    plan_code: str
    plan_name: str
    period: str
    quotas: list[QuotaUsage]
