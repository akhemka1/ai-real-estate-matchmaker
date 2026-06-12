from datetime import datetime

from pydantic import BaseModel, Field

from app.schemas.common import ORMModel

# Scopes available to API keys (least-privilege; combine as needed).
API_KEY_SCOPES = [
    "properties:read",
    "properties:write",
    "search:read",
    "recommendations:read",
    "ai:invoke",
    "matches:read",
]


class ApiKeyCreate(BaseModel):
    name: str = Field(min_length=2, max_length=120)
    scopes: list[str] = Field(default_factory=lambda: ["properties:read", "search:read"])
    expires_at: datetime | None = None


class ApiKeyRead(ORMModel):
    id: str
    name: str
    prefix: str
    scopes: list[str]
    is_active: bool
    last_used_at: datetime | None = None
    expires_at: datetime | None = None
    created_at: datetime


class ApiKeyCreated(ApiKeyRead):
    """Returned once on creation; ``api_key`` is never retrievable again."""

    api_key: str
