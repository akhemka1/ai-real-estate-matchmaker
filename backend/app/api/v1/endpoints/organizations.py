from typing import Annotated

from fastapi import APIRouter, Depends

from app.api.deps import CurrentOrg, DbSession, require_org_roles
from app.core.plans import PLANS, get_plan
from app.models.organization import Organization
from app.models.user import User
from app.repositories.organizations import OrganizationRepository
from app.schemas.organization import (
    OrganizationRead,
    OrganizationUpdate,
    OrganizationUsageRead,
    PlanChangeRequest,
    QuotaUsage,
)
from app.services.usage import UsageService

router = APIRouter()


@router.get("/plans", summary="List available subscription plans")
def list_plans() -> dict:
    return {"plans": [plan.as_dict() for plan in PLANS.values()]}


@router.get("/current", response_model=OrganizationRead)
def get_current_organization(org: CurrentOrg) -> Organization:
    return org


@router.patch("/current", response_model=OrganizationRead)
def update_current_organization(
    payload: OrganizationUpdate,
    db: DbSession,
    org: CurrentOrg,
    _: Annotated[User, Depends(require_org_roles("owner", "admin"))],
) -> Organization:
    return OrganizationRepository(db).update(org, **payload.model_dump(exclude_unset=True))


@router.post("/current/plan", response_model=OrganizationRead)
def change_plan(
    payload: PlanChangeRequest,
    db: DbSession,
    org: CurrentOrg,
    _: Annotated[User, Depends(require_org_roles("owner"))],
) -> Organization:
    plan = get_plan(payload.plan_code)
    return OrganizationRepository(db).update(org, plan_code=plan.code)


@router.get("/current/usage", response_model=OrganizationUsageRead)
def get_usage(db: DbSession, org: CurrentOrg) -> OrganizationUsageRead:
    from app.repositories.usage import current_period

    snapshot = UsageService(db).snapshot(org)
    return OrganizationUsageRead(
        organization_id=org.id,
        plan_code=snapshot["plan_code"],
        plan_name=snapshot["plan_name"],
        period=current_period(),
        quotas=[QuotaUsage(**q) for q in snapshot["quotas"]],
    )
