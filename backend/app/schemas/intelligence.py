from pydantic import BaseModel, Field

from app.schemas.property import PropertyRead


# --- Natural-language & semantic search -------------------------------------
class NaturalSearchRequest(BaseModel):
    query: str = Field(min_length=1, max_length=400)
    limit: int = Field(default=12, ge=1, le=50)


class InterpretedQuery(BaseModel):
    filters: dict
    amenities: list[str]
    free_text: str
    interpreted: list[str]


class RankedProperty(BaseModel):
    property: PropertyRead
    relevance: float = Field(ge=0, le=1)


class NaturalSearchResponse(BaseModel):
    query: str
    interpreted: InterpretedQuery
    total: int
    results: list[RankedProperty]


class SimilarPropertiesResponse(BaseModel):
    property_id: str
    results: list[RankedProperty]


# --- DealScore investment intelligence --------------------------------------
class DealScoreRequest(BaseModel):
    asking_price: float = Field(gt=0)
    city: str
    state: str = ""
    country: str = "US"
    property_type: str
    listing_type: str = "sale"
    bedrooms: float = Field(ge=0)
    bathrooms: float = Field(ge=0)
    sqft: int = Field(gt=0)
    year_built: int | None = None
    amenities: list[str] = Field(default_factory=list)


class DealScoreFactor(BaseModel):
    name: str
    score: float = Field(ge=0, le=100)
    weight: float = Field(ge=0, le=1)
    contribution: float
    description: str


class DealScoreResponse(BaseModel):
    deal_score: float = Field(ge=0, le=100)
    grade: str
    verdict: str  # "underpriced" | "fair" | "overpriced"
    predicted_price: float
    asking_price: float
    est_gross_yield: float
    appreciation_5yr: float
    factors: list[DealScoreFactor]
    summary: str
    model_version: str
