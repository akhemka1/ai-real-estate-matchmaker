"""Explainable-AI response schemas.

Mirrors the output contract of SHAP/LIME-style attribution so the frontend can
render consistent "why this recommendation/price" visualizations regardless of
which underlying model produced the prediction.
"""

from pydantic import BaseModel, Field


class FeatureAttribution(BaseModel):
    feature: str
    value: float | str | None = None
    contribution: float  # signed SHAP-style contribution toward the prediction
    direction: str = Field(pattern="^(positive|neutral|negative)$")
    description: str


class ExplanationResponse(BaseModel):
    method: str  # e.g. "shap", "lime", "rule-based"
    model_version: str
    base_value: float
    predicted_value: float
    confidence: float = Field(ge=0, le=100)
    attributions: list[FeatureAttribution]
    summary: str


class ExplainRecommendationRequest(BaseModel):
    property_id: str
    user_id: str | None = None
    budget: float | None = Field(default=None, gt=0)
    preferred_cities: list[str] = Field(default_factory=list)
    lifestyle_keywords: list[str] = Field(default_factory=list)
    amenities: list[str] = Field(default_factory=list)
