from datetime import datetime
from typing import Literal

from pydantic import BaseModel, Field

from app.schemas.common import ORMModel

ProjectStatus = Literal["pre_launch", "selling", "under_construction", "ready"]


class UnitType(BaseModel):
    type: str
    size_sqft: int = Field(gt=0)
    price_from: float = Field(gt=0)
    available: int = Field(ge=0)


class ProjectLocation(BaseModel):
    lat: float
    lng: float
    nearby: list[str] = Field(default_factory=list)


class ProjectBase(BaseModel):
    name: str = Field(min_length=2, max_length=200)
    developer: str = Field(min_length=2, max_length=160)
    city: str
    state: str | None = None
    country: str = Field(min_length=2, max_length=2)
    status: ProjectStatus = "selling"
    completion: str
    price_from: float = Field(gt=0)
    currency: str = "AED"
    down_payment_pct: int = Field(ge=0, le=100)
    during_construction_pct: int = Field(ge=0, le=100)
    handover_pct: int = Field(ge=0, le=100)
    payment_plan_label: str = "60 / 40"
    rental_yield: float = Field(default=0, ge=0)
    appreciation_5yr: float = Field(default=0, ge=0)
    unit_types: list[UnitType] = Field(default_factory=list)
    amenities: list[str] = Field(default_factory=list)
    images: list[str] = Field(default_factory=list)
    description: str = ""
    location: ProjectLocation | None = None


class ProjectCreate(ProjectBase):
    pass


class ProjectUpdate(BaseModel):
    name: str | None = None
    developer: str | None = None
    status: ProjectStatus | None = None
    completion: str | None = None
    price_from: float | None = Field(default=None, gt=0)
    down_payment_pct: int | None = Field(default=None, ge=0, le=100)
    during_construction_pct: int | None = Field(default=None, ge=0, le=100)
    handover_pct: int | None = Field(default=None, ge=0, le=100)
    rental_yield: float | None = None
    appreciation_5yr: float | None = None
    unit_types: list[UnitType] | None = None
    amenities: list[str] | None = None
    images: list[str] | None = None
    description: str | None = None
    location: ProjectLocation | None = None


class ProjectRead(ProjectBase, ORMModel):
    id: str
    organization_id: str
    created_at: datetime
    updated_at: datetime


# --- Payment plan calculator ---------------------------------------------
class PaymentPlanRequest(BaseModel):
    price: float = Field(gt=0)
    installments: int = Field(default=8, ge=1, le=60)


class PaymentInstallment(BaseModel):
    label: str
    pct: int
    amount: float


class PaymentPlanResponse(BaseModel):
    price: float
    currency: str
    booking: PaymentInstallment
    during_construction: PaymentInstallment
    handover: PaymentInstallment
    per_installment: float
    installments: int
