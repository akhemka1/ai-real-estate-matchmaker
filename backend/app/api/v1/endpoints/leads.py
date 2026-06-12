from typing import Annotated

from fastapi import APIRouter, Depends, HTTPException, Query, status

from app.api.deps import CurrentOrg, DbSession, get_current_user, require_org_roles
from app.models.organization import Organization
from app.models.user import User
from app.repositories.leads import LeadRepository
from app.repositories.organizations import OrganizationRepository
from app.schemas.common import APIMessage
from app.schemas.lead import (
    DistributionModeUpdate,
    LeadAssignUpdate,
    LeadCreate,
    LeadRead,
    LeadStageUpdate,
    LeadUpdate,
    PipelineStats,
)
from app.services.leads import LeadDistributionService

router = APIRouter()


@router.get("", response_model=list[LeadRead])
def list_leads(
    db: DbSession,
    org: CurrentOrg,
    stage: str | None = Query(default=None),
    assigned_to: str | None = Query(default=None),
) -> list[LeadRead]:
    return [LeadRead.model_validate(lead) for lead in LeadRepository(db).list(org.id, stage, assigned_to)]


@router.post("", response_model=LeadRead, status_code=status.HTTP_201_CREATED)
def create_lead(
    payload: LeadCreate,
    db: DbSession,
    org: CurrentOrg,
    current_user: Annotated[User, Depends(get_current_user)],
) -> LeadRead:
    assignee = LeadDistributionService(db).assign(org, current_user.id)
    return LeadRead.model_validate(LeadRepository(db).create(payload, org.id, assignee))


@router.get("/stats", response_model=PipelineStats)
def pipeline_stats(db: DbSession, org: CurrentOrg) -> PipelineStats:
    stats = LeadRepository(db).stats(org.id)
    return PipelineStats(
        mode=org.lead_distribution_mode,  # type: ignore[arg-type]
        total=stats["total"],
        by_stage=stats["by_stage"],
        won_value=stats["won_value"],
    )


@router.get("/distribution")
def get_distribution(org: CurrentOrg) -> dict:
    return {"mode": org.lead_distribution_mode, "rotation_index": org.lead_rotation_index}


@router.put("/distribution")
def set_distribution(
    payload: DistributionModeUpdate,
    db: DbSession,
    org: CurrentOrg,
    _: Annotated[User, Depends(require_org_roles("owner", "admin"))],
) -> dict:
    OrganizationRepository(db).update(org, lead_distribution_mode=payload.mode)
    return {"mode": payload.mode}


def _get_lead_or_404(db, org: Organization, lead_id: str):
    lead = LeadRepository(db).get(lead_id, org.id)
    if not lead:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Lead not found")
    return lead


@router.patch("/{lead_id}", response_model=LeadRead)
def update_lead(
    lead_id: str,
    payload: LeadUpdate,
    db: DbSession,
    org: CurrentOrg,
    _: Annotated[User, Depends(get_current_user)],
) -> LeadRead:
    repo = LeadRepository(db)
    lead = _get_lead_or_404(db, org, lead_id)
    return LeadRead.model_validate(repo.update(lead, payload))


@router.post("/{lead_id}/stage", response_model=LeadRead)
def move_stage(
    lead_id: str,
    payload: LeadStageUpdate,
    db: DbSession,
    org: CurrentOrg,
    _: Annotated[User, Depends(get_current_user)],
) -> LeadRead:
    repo = LeadRepository(db)
    lead = _get_lead_or_404(db, org, lead_id)
    return LeadRead.model_validate(repo.set_stage(lead, payload.stage))


@router.post("/{lead_id}/assign", response_model=LeadRead)
def assign_lead(
    lead_id: str,
    payload: LeadAssignUpdate,
    db: DbSession,
    org: CurrentOrg,
    _: Annotated[User, Depends(get_current_user)],
) -> LeadRead:
    repo = LeadRepository(db)
    lead = _get_lead_or_404(db, org, lead_id)
    return LeadRead.model_validate(repo.set_assignee(lead, payload.assigned_to))


@router.post("/{lead_id}/claim", response_model=LeadRead)
def claim_lead(
    lead_id: str,
    db: DbSession,
    org: CurrentOrg,
    current_user: Annotated[User, Depends(get_current_user)],
) -> LeadRead:
    repo = LeadRepository(db)
    lead = _get_lead_or_404(db, org, lead_id)
    return LeadRead.model_validate(repo.set_assignee(lead, current_user.id))


@router.delete("/{lead_id}", response_model=APIMessage)
def delete_lead(
    lead_id: str,
    db: DbSession,
    org: CurrentOrg,
    _: Annotated[User, Depends(get_current_user)],
) -> APIMessage:
    repo = LeadRepository(db)
    lead = _get_lead_or_404(db, org, lead_id)
    repo.delete(lead)
    return APIMessage(message="Lead deleted")
