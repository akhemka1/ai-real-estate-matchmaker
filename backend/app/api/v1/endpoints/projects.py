from typing import Annotated

from fastapi import APIRouter, Depends, HTTPException, status

from app.api.deps import CurrentOrg, DbSession, get_current_user
from app.models.user import User
from app.repositories.projects import ProjectRepository
from app.schemas.project import (
    PaymentPlanRequest,
    PaymentPlanResponse,
    ProjectCreate,
    ProjectRead,
    ProjectUpdate,
)
from app.services.projects import compute_payment_plan

router = APIRouter()


def _require_lister(user: User) -> None:
    if user.role.value not in {"seller", "agent", "admin"} and not user.is_superuser:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Only sellers, agents, or admins can manage off-plan projects",
        )


@router.get("", response_model=list[ProjectRead])
def list_projects(db: DbSession, org: CurrentOrg) -> list[ProjectRead]:
    return [ProjectRead.model_validate(p) for p in ProjectRepository(db).list(org.id)]


@router.post("", response_model=ProjectRead, status_code=status.HTTP_201_CREATED)
def create_project(
    payload: ProjectCreate,
    db: DbSession,
    org: CurrentOrg,
    current_user: Annotated[User, Depends(get_current_user)],
) -> ProjectRead:
    _require_lister(current_user)
    return ProjectRead.model_validate(ProjectRepository(db).create(payload, org.id))


@router.get("/{project_id}", response_model=ProjectRead)
def get_project(project_id: str, db: DbSession, org: CurrentOrg) -> ProjectRead:
    project = ProjectRepository(db).get(project_id, org.id)
    if not project:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Project not found")
    return ProjectRead.model_validate(project)


@router.patch("/{project_id}", response_model=ProjectRead)
def update_project(
    project_id: str,
    payload: ProjectUpdate,
    db: DbSession,
    org: CurrentOrg,
    current_user: Annotated[User, Depends(get_current_user)],
) -> ProjectRead:
    _require_lister(current_user)
    repo = ProjectRepository(db)
    project = repo.get(project_id, org.id)
    if not project:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Project not found")
    return ProjectRead.model_validate(repo.update(project, payload))


@router.delete("/{project_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_project(
    project_id: str,
    db: DbSession,
    org: CurrentOrg,
    current_user: Annotated[User, Depends(get_current_user)],
) -> None:
    _require_lister(current_user)
    repo = ProjectRepository(db)
    project = repo.get(project_id, org.id)
    if not project:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Project not found")
    repo.delete(project)


@router.post("/{project_id}/payment-plan", response_model=PaymentPlanResponse)
def payment_plan(
    project_id: str, payload: PaymentPlanRequest, db: DbSession, org: CurrentOrg
) -> PaymentPlanResponse:
    project = ProjectRepository(db).get(project_id, org.id)
    if not project:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Project not found")
    return compute_payment_plan(project, payload.price, payload.installments)
