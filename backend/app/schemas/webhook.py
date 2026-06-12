from datetime import datetime

from pydantic import BaseModel, Field, HttpUrl

from app.schemas.common import ORMModel

WEBHOOK_EVENTS = [
    "property.created",
    "property.updated",
    "match.created",
    "recommendation.feedback",
]


class WebhookCreate(BaseModel):
    url: HttpUrl
    events: list[str] = Field(default_factory=lambda: list(WEBHOOK_EVENTS))


class WebhookUpdate(BaseModel):
    url: HttpUrl | None = None
    events: list[str] | None = None
    is_active: bool | None = None


class WebhookRead(ORMModel):
    id: str
    url: str
    events: list[str]
    is_active: bool
    created_at: datetime


class WebhookCreated(WebhookRead):
    secret: str  # returned once for signature verification setup
