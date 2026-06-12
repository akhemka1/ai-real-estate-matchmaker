from datetime import datetime
from typing import Literal

from pydantic import BaseModel, EmailStr, Field

from app.schemas.common import ORMModel

LeadStage = Literal["new", "contacted", "qualified", "negotiation", "won", "lost"]
DistributionMode = Literal["all", "first", "rotation", "me"]


class LeadCreate(BaseModel):
    name: str = Field(min_length=1, max_length=160)
    email: EmailStr
    phone: str | None = None
    source: str = "Website"
    tags: list[str] = Field(default_factory=list)
    property_interest: str | None = None
    budget: str | None = None
    value: float | None = Field(default=None, ge=0)


class LeadUpdate(BaseModel):
    stage: LeadStage | None = None
    assigned_to: str | None = None
    tags: list[str] | None = None
    property_interest: str | None = None
    budget: str | None = None
    value: float | None = Field(default=None, ge=0)


class LeadStageUpdate(BaseModel):
    stage: LeadStage


class LeadAssignUpdate(BaseModel):
    assigned_to: str | None = None  # null = shared pool


class LeadRead(ORMModel):
    id: str
    organization_id: str
    name: str
    email: str
    phone: str | None = None
    source: str
    stage: LeadStage
    assigned_to: str | None = None
    tags: list[str]
    property_interest: str | None = None
    budget: str | None = None
    value: float | None = None
    created_at: datetime
    updated_at: datetime


class DistributionModeUpdate(BaseModel):
    mode: DistributionMode


class PipelineStats(BaseModel):
    mode: DistributionMode
    total: int
    by_stage: dict[str, int]
    won_value: float
