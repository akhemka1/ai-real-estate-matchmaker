from datetime import datetime
from typing import Literal

from pydantic import BaseModel, EmailStr, Field

from app.schemas.common import ORMModel

UserRole = Literal["buyer", "renter", "seller", "agent", "admin"]
OrgRole = Literal["owner", "admin", "member"]


class UserBase(BaseModel):
    email: EmailStr
    first_name: str = Field(min_length=1, max_length=80)
    last_name: str = Field(min_length=1, max_length=80)
    role: UserRole
    phone: str | None = None
    avatar_url: str | None = None


class UserCreate(UserBase):
    password: str = Field(min_length=8, max_length=128)


class MemberInvite(UserBase):
    """Create a user inside the caller's organization."""

    password: str = Field(min_length=8, max_length=128)
    org_role: OrgRole = "member"


class UserUpdate(BaseModel):
    first_name: str | None = Field(default=None, min_length=1, max_length=80)
    last_name: str | None = Field(default=None, min_length=1, max_length=80)
    phone: str | None = None
    avatar_url: str | None = None


class UserRead(UserBase, ORMModel):
    id: str
    organization_id: str | None = None
    org_role: OrgRole = "member"
    is_superuser: bool = False
    auth_provider: str = "local"
    firebase_uid: str | None = None
    supabase_uid: str | None = None
    is_active: bool
    last_login_at: datetime | None = None
    created_at: datetime
    updated_at: datetime
