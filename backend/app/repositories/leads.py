from sqlalchemy import func, select
from sqlalchemy.orm import Session

from app.models.lead import Lead, LeadStage
from app.schemas.lead import LeadCreate, LeadUpdate


class LeadRepository:
    def __init__(self, db: Session):
        self.db = db

    def get(self, lead_id: str, organization_id: str) -> Lead | None:
        lead = self.db.get(Lead, lead_id)
        if lead is None or lead.organization_id != organization_id:
            return None
        return lead

    def list(
        self, organization_id: str, stage: str | None = None, assigned_to: str | None = None
    ) -> list[Lead]:
        stmt = select(Lead).where(Lead.organization_id == organization_id)
        if stage:
            stmt = stmt.where(Lead.stage == stage)
        if assigned_to:
            stmt = stmt.where(Lead.assigned_to == assigned_to)
        return list(self.db.scalars(stmt.order_by(Lead.created_at.desc())).all())

    def create(self, payload: LeadCreate, organization_id: str, assigned_to: str | None) -> Lead:
        lead = Lead(
            organization_id=organization_id,
            assigned_to=assigned_to,
            email=payload.email.lower(),
            name=payload.name,
            phone=payload.phone,
            source=payload.source,
            tags=payload.tags,
            property_interest=payload.property_interest,
            budget=payload.budget,
            value=payload.value,
        )
        self.db.add(lead)
        self.db.commit()
        self.db.refresh(lead)
        return lead

    def update(self, lead: Lead, payload: LeadUpdate) -> Lead:
        for field, value in payload.model_dump(exclude_unset=True).items():
            setattr(lead, field, value)
        self.db.commit()
        self.db.refresh(lead)
        return lead

    def set_stage(self, lead: Lead, stage: str) -> Lead:
        lead.stage = LeadStage(stage)
        self.db.commit()
        self.db.refresh(lead)
        return lead

    def set_assignee(self, lead: Lead, assigned_to: str | None) -> Lead:
        lead.assigned_to = assigned_to
        self.db.commit()
        self.db.refresh(lead)
        return lead

    def delete(self, lead: Lead) -> None:
        self.db.delete(lead)
        self.db.commit()

    def stats(self, organization_id: str) -> dict:
        rows = self.db.execute(
            select(Lead.stage, func.count())
            .where(Lead.organization_id == organization_id)
            .group_by(Lead.stage)
        ).all()
        by_stage = {stage.value if hasattr(stage, "value") else str(stage): count for stage, count in rows}
        won_value = (
            self.db.scalar(
                select(func.coalesce(func.sum(Lead.value), 0)).where(
                    Lead.organization_id == organization_id, Lead.stage == LeadStage.won
                )
            )
            or 0
        )
        total = sum(by_stage.values())
        return {"by_stage": by_stage, "won_value": float(won_value), "total": total}
