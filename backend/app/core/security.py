"""Cryptographic primitives: password hashing, JWT issuance, API-key generation.

Tokens are signed with HS256 and carry standard registered claims (``iss``,
``aud``, ``exp``, ``iat``, ``jti``) plus a ``type`` claim that distinguishes
access tokens from refresh tokens so a refresh token can never be replayed as an
access token.
"""

import hashlib
import secrets
from datetime import UTC, datetime, timedelta
from typing import Any, Literal

import bcrypt
from jose import JWTError, jwt

from app.core.config import settings

TokenType = Literal["access", "refresh"]

# bcrypt only considers the first 72 bytes of the input; longer inputs raise in
# bcrypt 4.x, so we truncate deterministically (industry-standard behaviour).
_BCRYPT_MAX_BYTES = 72


# --- Passwords ---------------------------------------------------------------
# Passwords are NEVER stored in plaintext. We persist a salted bcrypt hash
# (the ``hashed_password`` column). bcrypt embeds a per-password random salt and
# a tunable work factor, so identical passwords produce different hashes and
# brute-forcing is computationally expensive — the OWASP-recommended approach.
def hash_password(password: str) -> str:
    pwd = password.encode("utf-8")[:_BCRYPT_MAX_BYTES]
    return bcrypt.hashpw(pwd, bcrypt.gensalt()).decode("utf-8")


def verify_password(plain_password: str, hashed_password: str) -> bool:
    try:
        return bcrypt.checkpw(
            plain_password.encode("utf-8")[:_BCRYPT_MAX_BYTES],
            hashed_password.encode("utf-8"),
        )
    except (ValueError, TypeError):
        return False


# --- JWT ---------------------------------------------------------------------
def _create_token(
    subject: str,
    token_type: TokenType,
    expires_delta: timedelta,
    claims: dict[str, Any] | None = None,
) -> str:
    now = datetime.now(UTC)
    payload: dict[str, Any] = {
        "sub": subject,
        "type": token_type,
        "iss": settings.jwt_issuer,
        "aud": settings.jwt_audience,
        "iat": now,
        "exp": now + expires_delta,
        "jti": secrets.token_urlsafe(16),
    }
    if claims:
        payload.update(claims)
    return jwt.encode(payload, settings.jwt_secret_key, algorithm=settings.jwt_algorithm)


def create_access_token(subject: str, claims: dict[str, Any] | None = None) -> str:
    return _create_token(
        subject,
        "access",
        timedelta(minutes=settings.access_token_expire_minutes),
        claims,
    )


def create_refresh_token(subject: str, claims: dict[str, Any] | None = None) -> str:
    return _create_token(
        subject,
        "refresh",
        timedelta(days=settings.refresh_token_expire_days),
        claims,
    )


def decode_token(token: str, expected_type: TokenType | None = None) -> dict[str, Any]:
    try:
        payload = jwt.decode(
            token,
            settings.jwt_secret_key,
            algorithms=[settings.jwt_algorithm],
            audience=settings.jwt_audience,
            issuer=settings.jwt_issuer,
        )
    except JWTError as exc:
        raise ValueError("Invalid or expired token") from exc
    if expected_type is not None and payload.get("type") != expected_type:
        raise ValueError(f"Expected a {expected_type} token")
    return payload


# Backwards-compatible alias used by older call sites.
def decode_access_token(token: str) -> dict[str, Any]:
    return decode_token(token, expected_type="access")


# --- API keys ----------------------------------------------------------------
def generate_api_key() -> tuple[str, str, str]:
    """Return ``(raw_key, prefix, hashed_key)``.

    The raw key is shown to the user exactly once. Only the prefix (for display)
    and the SHA-256 hash (for lookup/verification) are persisted.
    """
    env = "live" if settings.is_production else "test"
    body = secrets.token_urlsafe(32)
    prefix = f"{settings.api_key_prefix}_{env}_{secrets.token_hex(4)}"
    raw_key = f"{prefix}.{body}"
    return raw_key, prefix, hash_api_key(raw_key)


def hash_api_key(raw_key: str) -> str:
    return hashlib.sha256(raw_key.encode("utf-8")).hexdigest()


def extract_api_key_prefix(raw_key: str) -> str | None:
    return raw_key.split(".", 1)[0] if "." in raw_key else None
