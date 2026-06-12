"""Application configuration.

All settings are environment-driven (12-factor). Defaults are safe for local
development only; production deployments MUST override secrets and connection
strings via environment variables or a secret manager.
"""

from functools import lru_cache
from typing import Literal

from pydantic import AnyHttpUrl, Field, field_validator
from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    # --- Application ---------------------------------------------------------
    app_name: str = "AI Real Estate Matchmaker API"
    app_version: str = "1.0.0"
    environment: Literal["local", "dev", "staging", "prod"] = "local"
    api_v1_prefix: str = "/api/v1"
    debug: bool = False
    log_json: bool = True
    log_level: str = "INFO"
    backend_cors_origins: list[AnyHttpUrl] = Field(
        default_factory=lambda: ["http://localhost:3000", "http://127.0.0.1:3000"]
    )
    # Comma-separated hostnames allowed by TrustedHost middleware ("*" to disable).
    allowed_hosts: list[str] = Field(default_factory=lambda: ["*"])

    # --- Datastores ----------------------------------------------------------
    database_url: str = "sqlite:///./real_estate_matchmaker.db"
    db_pool_size: int = 10
    db_max_overflow: int = 20
    db_pool_recycle_seconds: int = 1800
    mongodb_url: str = "mongodb://localhost:27017"
    mongodb_db: str = "real_estate_matchmaker"
    redis_url: str = "redis://localhost:6379/0"

    # --- Auth / JWT ----------------------------------------------------------
    jwt_secret_key: str = "change-me-to-a-long-random-secret"
    jwt_algorithm: str = "HS256"
    jwt_issuer: str = "ai-real-estate-matchmaker"
    jwt_audience: str = "ai-real-estate-matchmaker-clients"
    access_token_expire_minutes: int = 30
    refresh_token_expire_days: int = 30
    password_min_length: int = 8

    # --- API keys (B2B server-to-server integrations) ------------------------
    api_key_prefix: str = "resk"  # real-estate secret key

    # --- Rate limiting -------------------------------------------------------
    rate_limit_enabled: bool = True
    rate_limit_per_minute: int = 120
    # Stricter default limit for expensive AI inference endpoints.
    ai_rate_limit_per_minute: int = 30

    # --- Firebase (optional federated auth) ----------------------------------
    firebase_project_id: str | None = None
    firebase_credentials_json: str | None = None
    firebase_service_account_path: str | None = None

    # --- Supabase (database + auth for user logins/credentials) --------------
    # Point DATABASE_URL at the Supabase Postgres connection string to store all
    # users and credentials in Supabase. Set SUPABASE_JWT_SECRET to accept
    # Supabase Auth access tokens via POST /api/v1/auth/supabase.
    supabase_url: str | None = None
    supabase_anon_key: str | None = None
    supabase_service_role_key: str | None = None
    supabase_jwt_secret: str | None = None

    # --- AI / LLM (Anthropic Claude) -----------------------------------------
    # When ANTHROPIC_API_KEY is set, AI endpoints use Claude for real inference;
    # otherwise they fall back to deterministic heuristics so the app always runs.
    anthropic_api_key: str | None = None
    anthropic_model: str = "claude-opus-4-8"
    anthropic_max_tokens: int = 1024
    anthropic_timeout_seconds: float = 30.0

    # --- AI / LLM (Google Gemini — free-tier alternative provider) -----------
    # When GEMINI_API_KEY is set (and ANTHROPIC_API_KEY is not), text generation
    # (e.g. the chatbot assistant) uses Google Gemini's free tier. Get a free key
    # at https://aistudio.google.com (no credit card required). Anthropic, when
    # set, takes priority.
    gemini_api_key: str | None = None
    gemini_model: str = "gemini-2.0-flash"

    # --- Object storage for property media (S3-compatible) -------------------
    # Works with AWS S3, Cloudflare R2, MinIO, etc. When unset, the media
    # upload endpoints report 503 (not configured) and the rest of the API is
    # unaffected.
    s3_bucket: str | None = None
    s3_region: str = "us-east-1"
    s3_endpoint_url: str | None = None  # custom endpoint for R2/MinIO
    s3_access_key_id: str | None = None
    s3_secret_access_key: str | None = None
    s3_public_base_url: str | None = None  # CDN / public bucket base URL
    upload_url_expiry_seconds: int = 900
    max_images_per_property: int = 30

    # --- Multi-tenancy / onboarding -----------------------------------------
    # When true, a brand-new signup with no organization context provisions a
    # personal organization automatically (self-serve onboarding).
    auto_provision_org_on_signup: bool = True
    default_plan: str = "trial"

    model_config = SettingsConfigDict(
        env_file=".env", env_file_encoding="utf-8", extra="ignore", case_sensitive=False
    )

    @field_validator("backend_cors_origins", "allowed_hosts", mode="before")
    @classmethod
    def split_comma_separated(cls, value: object) -> object:
        # Accept "a,b,c" in addition to JSON arrays for ergonomic env files.
        if isinstance(value, str) and not value.strip().startswith("["):
            return [item.strip() for item in value.split(",") if item.strip()]
        return value

    @property
    def is_sqlite(self) -> bool:
        return self.database_url.startswith("sqlite")

    @property
    def storage_enabled(self) -> bool:
        return bool(self.s3_bucket and self.s3_access_key_id and self.s3_secret_access_key)

    @property
    def supabase_auth_enabled(self) -> bool:
        return bool(self.supabase_jwt_secret)

    @property
    def ai_enabled(self) -> bool:
        return bool(self.anthropic_api_key or self.gemini_api_key)

    @property
    def active_ai_provider(self) -> str:
        if self.anthropic_api_key:
            return "anthropic"
        if self.gemini_api_key:
            return "gemini"
        return "heuristic"

    @property
    def active_ai_model(self) -> str | None:
        if self.anthropic_api_key:
            return self.anthropic_model
        if self.gemini_api_key:
            return self.gemini_model
        return None

    @property
    def is_production(self) -> bool:
        return self.environment in {"staging", "prod"}


@lru_cache
def get_settings() -> Settings:
    return Settings()


settings = get_settings()
