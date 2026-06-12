from datetime import datetime

from pydantic import BaseModel, Field

from app.schemas.common import ORMModel
from app.schemas.recommendation import MatchReason


class GenerateMatchesRequest(BaseModel):
    """Find likely buyers/renters for one of the organization's listings."""

    property_id: str
    limit: int = Field(default=10, ge=1, le=50)
    persist: bool = True


class MatchedBuyer(BaseModel):
    buyer_id: str
    buyer_name: str
    buyer_email: str
    match_score: float = Field(ge=0, le=100)
    confidence: float = Field(ge=0, le=100)
    reasons: list[MatchReason]


class GenerateMatchesResponse(BaseModel):
    property_id: str
    model_version: str
    matches: list[MatchedBuyer]


class LeadMatchRead(ORMModel):
    id: str
    seller_id: str
    buyer_id: str
    property_id: str
    match_score: float
    confidence: float
    reasons: list[dict]
    created_at: datetime
