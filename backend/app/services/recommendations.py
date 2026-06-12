"""Hybrid property recommender.

Combines a transparent **content-based** score (budget fit, location, type,
amenities, lifestyle keywords) with a **collaborative** popularity signal mined
from in-tenant engagement (favorites + positive feedback + views). The blend is
fully explainable: every contributing factor is returned as a ``MatchReason`` so
the response can drive an Explainable-AI UI.
"""

from math import exp

from app.models.property import Property
from app.schemas.explain import ExplanationResponse, FeatureAttribution
from app.schemas.property import PropertyRead
from app.schemas.recommendation import MatchReason, RecommendationRead, RecommendationRequest

CONTENT_WEIGHT = 0.8
COLLAB_WEIGHT = 0.2


class RecommendationService:
    model_version = "hybrid-heuristic-v0.1"

    def rank(
        self,
        properties: list[Property],
        request: RecommendationRequest,
        collaborative_boost: dict[str, float] | None = None,
    ) -> list[RecommendationRead]:
        collaborative_boost = collaborative_boost or {}
        scored = [
            self._score_property(property_obj, request, collaborative_boost.get(property_obj.id, 0.0))
            for property_obj in properties
        ]
        scored.sort(key=lambda item: item.match_score, reverse=True)
        return [
            item.model_copy(update={"rank": index + 1})
            for index, item in enumerate(scored[: request.limit])
        ]

    def explain(
        self,
        property_obj: Property,
        request: RecommendationRequest,
        collaborative_boost: float = 0.0,
    ) -> ExplanationResponse:
        scored = self._score_property(property_obj, request, collaborative_boost)
        base_value = 45.0
        attributions = [
            FeatureAttribution(
                feature=reason.factor,
                value=None,
                contribution=round(reason.weight * 100, 2),
                direction=reason.sentiment,
                description=reason.description,
            )
            for reason in scored.reasons
        ]
        return ExplanationResponse(
            method="rule-based-additive",
            model_version=self.model_version,
            base_value=base_value,
            predicted_value=scored.match_score,
            confidence=scored.confidence,
            attributions=attributions,
            summary=(
                f"Match score {scored.match_score:.0f}/100 with {scored.confidence:.0f}% confidence, "
                f"driven by {len(scored.reasons)} weighted factors."
            ),
        )

    def _score_property(
        self, property_obj: Property, request: RecommendationRequest, collaborative_boost: float
    ) -> RecommendationRead:
        reasons: list[MatchReason] = []
        content_score = 45.0
        confidence = 72.0

        budget = request.budget or request.max_price
        if budget:
            ratio = float(property_obj.price) / budget
            budget_score = max(0, 100 * exp(-abs(1 - ratio) * 2.8))
            content_score += budget_score * 0.25
            sentiment = "positive" if ratio <= 1.05 else "negative"
            reasons.append(
                MatchReason(
                    factor="Budget Fit",
                    weight=0.25,
                    description=f"Listed at {ratio:.0%} of the target budget.",
                    sentiment=sentiment,
                )
            )

        if request.preferred_cities and property_obj.address.get("city") in request.preferred_cities:
            content_score += 18
            reasons.append(
                MatchReason(
                    factor="Location Preference",
                    weight=0.2,
                    description="Property is in one of the preferred cities.",
                    sentiment="positive",
                )
            )

        if request.property_type and property_obj.property_type == request.property_type:
            content_score += 10
            reasons.append(
                MatchReason(
                    factor="Property Type",
                    weight=0.12,
                    description="Matches the requested property type.",
                    sentiment="positive",
                )
            )

        amenity_hits = set(a.lower() for a in request.amenities).intersection(
            set(a.lower() for a in property_obj.amenities)
        )
        if amenity_hits:
            content_score += min(16, len(amenity_hits) * 5)
            reasons.append(
                MatchReason(
                    factor="Amenities",
                    weight=0.16,
                    description=f"Matches amenities: {', '.join(sorted(amenity_hits))}.",
                    sentiment="positive",
                )
            )

        text = f"{property_obj.title} {property_obj.description}".lower()
        lifestyle_hits = [word for word in request.lifestyle_keywords if word.lower() in text]
        if lifestyle_hits:
            content_score += min(12, len(lifestyle_hits) * 4)
            reasons.append(
                MatchReason(
                    factor="Lifestyle Fit",
                    weight=0.14,
                    description=f"Description aligns with: {', '.join(lifestyle_hits)}.",
                    sentiment="positive",
                )
            )

        # Collaborative signal: how popular this listing is with similar users.
        collab_component = min(20.0, collaborative_boost)
        if collab_component > 0:
            reasons.append(
                MatchReason(
                    factor="Community Interest",
                    weight=round(COLLAB_WEIGHT, 2),
                    description="Buyers with similar preferences engaged with this listing.",
                    sentiment="positive",
                )
            )

        if not reasons or (len(reasons) == 1 and collab_component > 0):
            reasons.append(
                MatchReason(
                    factor="General Fit",
                    weight=0.1,
                    description="Ranked using available property features and market defaults.",
                    sentiment="neutral",
                )
            )
            confidence = 61

        blended = CONTENT_WEIGHT * content_score + COLLAB_WEIGHT * (content_score + collab_component)
        return RecommendationRead(
            property_id=property_obj.id,
            property=PropertyRead.model_validate(property_obj),
            match_score=min(100, round(blended, 1)),
            confidence=min(100, round(confidence + len(reasons) * 3, 1)),
            reasons=reasons,
            rank=0,
        )
