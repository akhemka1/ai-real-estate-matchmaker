from pydantic import BaseModel, Field

from app.schemas.property import AppreciationForecast, ImageTag
from app.schemas.recommendation import MatchReason


class PricePredictionRequest(BaseModel):
    city: str
    state: str
    country: str = "US"
    property_type: str
    listing_type: str
    bedrooms: float = Field(ge=0)
    bathrooms: float = Field(ge=0)
    sqft: int = Field(gt=0)
    year_built: int | None = None
    amenities: list[str] = Field(default_factory=list)


class PricePredictionResponse(BaseModel):
    predicted_price: float
    confidence: float
    model_version: str
    drivers: list[MatchReason]


class AppreciationRequest(PricePredictionRequest):
    current_price: float = Field(gt=0)


class AppreciationResponse(BaseModel):
    forecast: AppreciationForecast
    model_version: str
    drivers: list[MatchReason]


class ImageAnalysisRequest(BaseModel):
    image_urls: list[str] = Field(min_length=1, max_length=20)


class ImageAnalysisResponse(BaseModel):
    tags: list[ImageTag]
    quality_score: float = Field(ge=0, le=100)
    model_version: str


class DescriptionAnalysisRequest(BaseModel):
    description: str = Field(min_length=10)


class DescriptionAnalysisResponse(BaseModel):
    keywords: list[str]
    sentiment: str
    condition_score: float = Field(ge=0, le=100)
    model_version: str
    ai_generated: bool = False


class GenerateDescriptionRequest(BaseModel):
    city: str
    state: str = ""
    country: str = "US"
    property_type: str
    listing_type: str = "sale"
    bedrooms: float = Field(ge=0)
    bathrooms: float = Field(ge=0)
    sqft: int = Field(gt=0)
    amenities: list[str] = Field(default_factory=list)
    year_built: int | None = None
    tone: str = Field(default="professional", pattern="^(professional|luxury|friendly)$")


class GenerateDescriptionResponse(BaseModel):
    headline: str
    description: str
    model_version: str
    ai_generated: bool = False


class AssistantRequest(BaseModel):
    question: str = Field(min_length=1, max_length=2000)
    context: str | None = Field(default=None, max_length=8000)


class AssistantResponse(BaseModel):
    answer: str
    model_version: str
    ai_generated: bool = False
