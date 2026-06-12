"""Seller-side matching: find the buyers/renters most likely to want a listing.

For each in-tenant buyer we infer a preference profile (via SignalService) from
their engagement history, then score the target property against that profile.
Returns confidence-scored, explained matches that a seller or agent can action.
"""

from sqlalchemy.orm import Session

from app.models.property import Property
from app.models.user import User
from app.schemas.match import MatchedBuyer
from app.schemas.recommendation import MatchReason
from app.services.signals import BuyerProfile, SignalService

MODEL_VERSION = "lead-matching-heuristic-v0.1"


class LeadMatchingService:
    def __init__(self, db: Session):
        self.db = db
        self.signals = SignalService(db)

    def match_buyers(
        self, organization_id: str, property_obj: Property, buyers: list[User], limit: int
    ) -> list[MatchedBuyer]:
        results: list[MatchedBuyer] = []
        for buyer in buyers:
            profile = self.signals.buyer_profile(organization_id, buyer.id)
            score, confidence, reasons = self._score(property_obj, profile)
            results.append(
                MatchedBuyer(
                    buyer_id=buyer.id,
                    buyer_name=buyer.full_name,
                    buyer_email=buyer.email,
                    match_score=round(score, 1),
                    confidence=round(confidence, 1),
                    reasons=reasons,
                )
            )
        results.sort(key=lambda m: m.match_score, reverse=True)
        return results[:limit]

    def _score(
        self, property_obj: Property, profile: BuyerProfile
    ) -> tuple[float, float, list[MatchReason]]:
        reasons: list[MatchReason] = []
        score = 40.0
        confidence = 55.0

        if profile.sample_size == 0:
            reasons.append(
                MatchReason(
                    factor="Cold Lead",
                    weight=0.1,
                    description="No engagement history yet; matched on listing appeal only.",
                    sentiment="neutral",
                )
            )
            return score, confidence, reasons

        # Confidence grows with how much history we have.
        confidence = min(90.0, 55.0 + profile.sample_size * 5)

        if profile.avg_price:
            ratio = float(property_obj.price) / profile.avg_price
            if 0.8 <= ratio <= 1.2:
                score += 22
                reasons.append(
                    MatchReason(
                        factor="Budget Alignment",
                        weight=0.28,
                        description=f"Priced within the buyer's typical range ({ratio:.0%} of average).",
                        sentiment="positive",
                    )
                )
            elif ratio > 1.5:
                score -= 8
                reasons.append(
                    MatchReason(
                        factor="Budget Alignment",
                        weight=0.28,
                        description="Listing is well above the buyer's typical price range.",
                        sentiment="negative",
                    )
                )

        city = property_obj.address.get("city")
        if city and city in profile.cities:
            score += 18
            reasons.append(
                MatchReason(
                    factor="Preferred Location",
                    weight=0.22,
                    description=f"Buyer has shown interest in {city}.",
                    sentiment="positive",
                )
            )

        if property_obj.property_type.value in profile.property_types:
            score += 12
            reasons.append(
                MatchReason(
                    factor="Property Type",
                    weight=0.16,
                    description=f"Buyer favors {property_obj.property_type.value} listings.",
                    sentiment="positive",
                )
            )

        amenity_hits = set(a.lower() for a in (property_obj.amenities or [])).intersection(
            set(a.lower() for a in profile.amenities)
        )
        if amenity_hits:
            score += min(14, len(amenity_hits) * 5)
            reasons.append(
                MatchReason(
                    factor="Amenity Overlap",
                    weight=0.18,
                    description=f"Shares amenities the buyer values: {', '.join(sorted(amenity_hits))}.",
                    sentiment="positive",
                )
            )

        if not reasons:
            reasons.append(
                MatchReason(
                    factor="Weak Signal",
                    weight=0.1,
                    description="Buyer history did not strongly align with this listing.",
                    sentiment="neutral",
                )
            )

        return min(100.0, score), confidence, reasons
