"""Collaborative-filtering signals mined from in-tenant engagement.

Produces a per-property popularity boost (favorites + positive feedback + views)
that the hybrid recommender blends with its content-based score, and builds a
lightweight preference profile for a buyer from the listings they engaged with.
"""

from collections import Counter
from dataclasses import dataclass, field

from sqlalchemy import func, select
from sqlalchemy.orm import Session

from app.models.activity import ActivityType, UserActivity
from app.models.engagement import Favorite
from app.models.match import FeedbackValue, RecommendationFeedback
from app.models.property import Property


@dataclass
class BuyerProfile:
    avg_price: float | None = None
    cities: list[str] = field(default_factory=list)
    property_types: list[str] = field(default_factory=list)
    amenities: list[str] = field(default_factory=list)
    sample_size: int = 0


class SignalService:
    def __init__(self, db: Session):
        self.db = db

    def collaborative_boosts(self, organization_id: str) -> dict[str, float]:
        """Map property_id -> popularity boost (favorites x3 + positive feedback x4 + views x1)."""
        boosts: Counter[str] = Counter()

        fav_rows = self.db.execute(
            select(Favorite.property_id, func.count())
            .where(Favorite.organization_id == organization_id)
            .group_by(Favorite.property_id)
        ).all()
        for property_id, count in fav_rows:
            boosts[property_id] += count * 3.0

        fb_rows = self.db.execute(
            select(RecommendationFeedback.property_id, func.count())
            .where(
                RecommendationFeedback.organization_id == organization_id,
                RecommendationFeedback.feedback.in_(
                    [FeedbackValue.relevant, FeedbackValue.saved, FeedbackValue.contacted]
                ),
            )
            .group_by(RecommendationFeedback.property_id)
        ).all()
        for property_id, count in fb_rows:
            boosts[property_id] += count * 4.0

        view_rows = self.db.execute(
            select(UserActivity.property_id, func.count())
            .where(
                UserActivity.organization_id == organization_id,
                UserActivity.activity_type == ActivityType.view,
                UserActivity.property_id.is_not(None),
            )
            .group_by(UserActivity.property_id)
        ).all()
        for property_id, count in view_rows:
            if property_id:
                boosts[property_id] += count * 1.0

        return dict(boosts)

    def buyer_profile(self, organization_id: str, buyer_id: str) -> BuyerProfile:
        """Infer a buyer's preferences from properties they favorited or rated positively."""
        property_ids: set[str] = set()

        property_ids.update(
            self.db.scalars(
                select(Favorite.property_id).where(
                    Favorite.organization_id == organization_id, Favorite.user_id == buyer_id
                )
            ).all()
        )
        property_ids.update(
            self.db.scalars(
                select(RecommendationFeedback.property_id).where(
                    RecommendationFeedback.organization_id == organization_id,
                    RecommendationFeedback.user_id == buyer_id,
                    RecommendationFeedback.feedback.in_(
                        [FeedbackValue.relevant, FeedbackValue.saved, FeedbackValue.contacted]
                    ),
                )
            ).all()
        )

        if not property_ids:
            return BuyerProfile()

        properties = list(
            self.db.scalars(select(Property).where(Property.id.in_(property_ids))).all()
        )
        if not properties:
            return BuyerProfile()

        prices = [float(p.price) for p in properties]
        cities = Counter(p.address.get("city") for p in properties if p.address.get("city"))
        types = Counter(p.property_type.value for p in properties)
        amenities = Counter(a for p in properties for a in (p.amenities or []))

        return BuyerProfile(
            avg_price=sum(prices) / len(prices),
            cities=[city for city, _ in cities.most_common(3)],
            property_types=[t for t, _ in types.most_common(2)],
            amenities=[a for a, _ in amenities.most_common(6)],
            sample_size=len(properties),
        )
