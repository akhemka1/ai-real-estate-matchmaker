from datetime import datetime

from pydantic import BaseModel, Field

from app.schemas.common import ORMModel
from app.schemas.property import PropertyRead, SearchFilters


class SavedSearchCreate(BaseModel):
    name: str = Field(min_length=1, max_length=120)
    filters: SearchFilters
    notify: bool = False


class SavedSearchRead(ORMModel):
    id: str
    name: str
    filters: dict
    notify: bool
    created_at: datetime


class FavoriteCreate(BaseModel):
    property_id: str


class FavoriteRead(ORMModel):
    id: str
    property_id: str
    property: PropertyRead | None = None
    created_at: datetime
