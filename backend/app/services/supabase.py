"""Supabase Auth integration.

Supabase manages user logins/credentials and issues HS256 JWT access tokens
signed with the project's JWT secret. This service verifies those tokens so a
Supabase-authenticated user can be linked to a local tenant account via
``POST /api/v1/auth/supabase``.

Storing the users themselves in Supabase is done by pointing ``DATABASE_URL`` at
the Supabase Postgres connection string — no code change required, since the ORM
is standard PostgreSQL.
"""

from functools import lru_cache
from typing import Any

from jose import JWTError, jwt

from app.core.config import settings


class SupabaseNotConfiguredError(RuntimeError):
    pass


class SupabaseAuthService:
    def is_configured(self) -> bool:
        return settings.supabase_auth_enabled

    def verify_access_token(self, access_token: str) -> dict[str, Any]:
        if not self.is_configured():
            raise SupabaseNotConfiguredError("Supabase Auth is not configured")
        try:
            return jwt.decode(
                access_token,
                settings.supabase_jwt_secret,
                algorithms=["HS256"],
                audience="authenticated",
            )
        except JWTError as exc:
            raise ValueError("Invalid Supabase token") from exc


@lru_cache
def get_supabase_auth_service() -> SupabaseAuthService:
    return SupabaseAuthService()
