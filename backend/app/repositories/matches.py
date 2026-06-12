from sqlalchemy import select
from sqlalchemy.orm import Session

from app.models.match import LeadMatch


class MatchRepository:
    def __init__(self, db: Session):
        self.db = db

    def create(
        self,
        *,
        organization_id: str,
        seller_id: str,
        buyer_id: str,
        property_id: str,
        match_score: float,
        confidence: float,
        reasons: list[dict],
    ) -> LeadMatch:
        match = LeadMatch(
            organization_id=organization_id,
            seller_id=seller_id,
            buyer_id=buyer_id,
            property_id=property_id,
            match_score=match_score,
            confidence=confidence,
            reasons=reasons,
        )
        self.db.add(match)
        self.db.commit()
        self.db.refresh(match)
        return match

    def list_for_property(self, organization_id: str, property_id: str) -> list[LeadMatch]:
        return list(
            self.db.scalars(
                select(LeadMatch)
                .where(
                    LeadMatch.organization_id == organization_id,
                    LeadMatch.property_id == property_id,
                )
                .order_by(LeadMatch.match_score.desc())
            ).all()
        )

    def list_for_seller(self, organization_id: str, seller_id: str, limit: int = 100) -> list[LeadMatch]:
        return list(
            self.db.scalars(
                select(LeadMatch)
                .where(
                    LeadMatch.organization_id == organization_id,
                    LeadMatch.seller_id == seller_id,
                )
                .order_by(LeadMatch.created_at.desc())
                .limit(limit)
            ).all()
        )
