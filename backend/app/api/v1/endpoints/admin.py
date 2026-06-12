from typing import Annotated

from fastapi import APIRouter, Depends, HTTPException, status

from app.api.deps import CurrentOrg, DbSession, require_org_roles, require_superuser
from app.models.organization import OrganizationStatus
from app.models.user import User
from app.repositories.audit import AuditRepository
from app.repositories.organizations import OrganizationRepository
from app.schemas.common import APIMessage
from app.schemas.organization import OrganizationRead

router = APIRouter()


# --- Org-scoped audit (org owners/admins) ------------------------------------
@router.get("/audit-logs")
def list_audit_logs(
    db: DbSession,
    org: CurrentOrg,
    _: Annotated[User, Depends(require_org_roles("owner", "admin"))],
    limit: int = 100,
) -> list[dict]:
    entries = AuditRepository(db).list_for_org(org.id, limit=limit)
    return [
        {
            "id": e.id,
            "action": e.action,
            "actor_label": e.actor_label,
            "resource_type": e.resource_type,
            "resource_id": e.resource_id,
            "ip_address": e.ip_address,
            "created_at": e.created_at,
        }
        for e in entries
    ]


# --- Platform administration (superusers only) -------------------------------
@router.get("/organizations", response_model=list[OrganizationRead])
def list_all_organizations(
    db: DbSession, _: Annotated[User, Depends(require_superuser)]
) -> list[OrganizationRead]:
    return [OrganizationRead.model_validate(o) for o in OrganizationRepository(db).list()]


@router.post("/organizations/{organization_id}/suspend", response_model=APIMessage)
def suspend_organization(
    organization_id: str, db: DbSession, _: Annotated[User, Depends(require_superuser)]
) -> APIMessage:
    repo = OrganizationRepository(db)
    org = repo.get(organization_id)
    if org is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Organization not found")
    repo.update(org, status=OrganizationStatus.suspended)
    return APIMessage(message=f"Organization {org.slug} suspended")


@router.post("/organizations/{organization_id}/activate", response_model=APIMessage)
def activate_organization(
    organization_id: str, db: DbSession, _: Annotated[User, Depends(require_superuser)]
) -> APIMessage:
    repo = OrganizationRepository(db)
    org = repo.get(organization_id)
    if org is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Organization not found")
    repo.update(org, status=OrganizationStatus.active)
    return APIMessage(message=f"Organization {org.slug} activated")
