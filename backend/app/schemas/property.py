from datetime import datetime
from typing import Literal

from pydantic import BaseModel, Field

from app.schemas.common import ORMModel

PropertyType = Literal["house", "condo", "apartment", "townhouse", "land"]
ListingType = Literal["sale", "rent"]
PropertyStatus = Literal["active", "pending", "sold", "off_market"]


class Address(BaseModel):
    street: str
    city: str
    state: str
    zip_code: str
    country: str = "US"
    lat: float
    lng: float


class AppreciationForecast(BaseModel):
    year1: float
    year3: float
    year5: float
    year10: float
    confidence: float = Field(ge=0, le=100)


class ImageTag(BaseModel):
    label: str
    confidence: float = Field(ge=0, le=1)
    category: Literal["room", "feature", "condition", "style"]


class PropertyBase(BaseModel):
    title: str = Field(min_length=3, max_length=200)
    description: str = Field(min_length=10)
    price: float = Field(gt=0)
    currency: str = "USD"
    bedrooms: float = Field(ge=0)
    bathrooms: float = Field(ge=0)
    sqft: int = Field(gt=0)
    property_type: PropertyType
    listing_type: ListingType
    address: Address
    images: list[str] = Field(default_factory=list)
    amenities: list[str] = Field(default_factory=list)
    year_built: int | None = None
    lot_size: float | None = None
    status: PropertyStatus = "active"
    agent_id: str | None = None
    seller_id: str | None = None


class PropertyCreate(PropertyBase):
    pass


class PropertyUpdate(BaseModel):
    title: str | None = None
    description: str | None = None
    price: float | None = Field(default=None, gt=0)
    currency: str | None = None
    bedrooms: float | None = Field(default=None, ge=0)
    bathrooms: float | None = Field(default=None, ge=0)
    sqft: int | None = Field(default=None, gt=0)
    property_type: PropertyType | None = None
    listing_type: ListingType | None = None
    address: Address | None = None
    images: list[str] | None = None
    amenities: list[str] | None = None
    year_built: int | None = None
    lot_size: float | None = None
    status: PropertyStatus | None = None


class PropertyRead(PropertyBase, ORMModel):
    id: str
    organization_id: str
    ai_price_estimate: float | None = None
    appreciation_forecast: AppreciationForecast | None = None
    image_tags: list[ImageTag] | None = None
    created_at: datetime
    updated_at: datetime


class ImageUploadRequest(BaseModel):
    filename: str = Field(min_length=1, max_length=255)
    content_type: str = Field(description="MIME type, e.g. image/jpeg")


class ImageUploadResponse(BaseModel):
    upload_url: str
    public_url: str
    key: str
    expires_in: int


class PropertyImagesUpdate(BaseModel):
    """Replace a property's ordered image list (images[0] is the cover photo)."""

    images: list[str] = Field(default_factory=list, max_length=30)


class SearchFilters(BaseModel):
    query: str | None = None
    city: str | None = None
    state: str | None = None
    country: str | None = None
    min_price: float | None = Field(default=None, ge=0)
    max_price: float | None = Field(default=None, ge=0)
    bedrooms: float | None = Field(default=None, ge=0)
    bathrooms: float | None = Field(default=None, ge=0)
    property_type: PropertyType | None = None
    listing_type: ListingType | None = None
    min_sqft: int | None = Field(default=None, ge=0)
    max_sqft: int | None = Field(default=None, ge=0)
    amenities: list[str] = Field(default_factory=list)
