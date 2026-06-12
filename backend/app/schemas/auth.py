from pydantic import BaseModel, EmailStr, Field

from app.schemas.user import UserRead

UserRole = str


class SignupRequest(BaseModel):
    """Self-serve onboarding: creates an organization and its owner user."""

    email: EmailStr
    password: str = Field(min_length=8, max_length=128)
    first_name: str = Field(min_length=1, max_length=80)
    last_name: str = Field(min_length=1, max_length=80)
    role: str = "agent"
    organization_name: str | None = Field(
        default=None, description="If omitted, a personal workspace is created."
    )
    plan_code: str | None = None
    phone: str | None = None


class LoginRequest(BaseModel):
    email: EmailStr
    password: str


class TokenResponse(BaseModel):
    access_token: str
    refresh_token: str | None = None
    token_type: str = "bearer"
    expires_in: int
    user: UserRead


class RefreshRequest(BaseModel):
    refresh_token: str


class FirebaseLoginRequest(BaseModel):
    id_token: str
    role: str = "buyer"
    organization_name: str | None = None


class SupabaseLoginRequest(BaseModel):
    access_token: str
    role: str = "buyer"
    organization_name: str | None = None
