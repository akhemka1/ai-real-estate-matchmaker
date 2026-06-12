from pydantic import BaseModel, Field

from app.schemas.property import PropertyRead, SearchFilters


class MatchReason(BaseModel):
    factor: str
    weight: float = Field(ge=0, le=1)
    description: str
    sentiment: str = Field(pattern="^(positive|neutral|negative)$")


class RecommendationRequest(SearchFilters):
    user_id: str | None = None
    budget: float | None = Field(default=None, gt=0)
    preferred_cities: list[str] = Field(default_factory=list)
    lifestyle_keywords: list[str] = Field(default_factory=list)
    limit: int = Field(default=10, ge=1, le=50)


class RecommendationRead(BaseModel):
    property_id: str
    property: PropertyRead
    match_score: float = Field(ge=0, le=100)
    confidence: float = Field(ge=0, le=100)
    reasons: list[MatchReason]
    rank: int


class FeedbackCreate(BaseModel):
    property_id: str
    feedback: str = Field(pattern="^(relevant|not_relevant|saved|contacted)$")
    score: float | None = Field(default=None, ge=0, le=100)
