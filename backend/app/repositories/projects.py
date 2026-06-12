from sqlalchemy import select
from sqlalchemy.orm import Session

from app.models.project import OffPlanProject
from app.schemas.project import ProjectCreate, ProjectUpdate


class ProjectRepository:
    def __init__(self, db: Session):
        self.db = db

    def get(self, project_id: str, organization_id: str) -> OffPlanProject | None:
        project = self.db.get(OffPlanProject, project_id)
        if project is None or project.organization_id != organization_id:
            return None
        return project

    def list(self, organization_id: str) -> list[OffPlanProject]:
        return list(
            self.db.scalars(
                select(OffPlanProject)
                .where(OffPlanProject.organization_id == organization_id)
                .order_by(OffPlanProject.created_at.desc())
            ).all()
        )

    def create(self, payload: ProjectCreate, organization_id: str) -> OffPlanProject:
        data = payload.model_dump()
        if data.get("location") is not None:
            data["location"] = payload.location.model_dump() if payload.location else {}
        else:
            data["location"] = {}
        data["unit_types"] = [u.model_dump() for u in payload.unit_types]
        project = OffPlanProject(organization_id=organization_id, **data)
        self.db.add(project)
        self.db.commit()
        self.db.refresh(project)
        return project

    def update(self, project: OffPlanProject, payload: ProjectUpdate) -> OffPlanProject:
        for field, value in payload.model_dump(exclude_unset=True).items():
            if field == "location" and value is not None:
                value = payload.location.model_dump()
            if field == "unit_types" and value is not None:
                value = [u.model_dump() for u in payload.unit_types]
            setattr(project, field, value)
        self.db.commit()
        self.db.refresh(project)
        return project

    def delete(self, project: OffPlanProject) -> None:
        self.db.delete(project)
        self.db.commit()
