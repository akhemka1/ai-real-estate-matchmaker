"""Request dependencies: authentication, tenant resolution, RBAC, and scopes.

Two authentication schemes are supported and unified behind ``Principal``:

* **Bearer JWT** — interactive users (web/mobile). Full scope within their role.
* **X-API-Key** — server-to-server B2B integrations. Limited to the key's scopes.

Every authenticated request resolves to exactly one organization (tenant), and
``Principal.organization`` is the isolation boundary all data access is scoped to.
"""

from dataclasses import dataclass, field
from typing import Annotated

from fastapi import Depends, HTTPException, Request, status
from fastapi.security import APIKeyHeader, HTTPAuthorizationCredentials, HTTPBearer
from sqlalchemy.orm import Session

from app.core.security import decode_token
from app.db.session import get_db
from app.models.organization import Organization, OrganizationStatus
from app.models.user import User
from app.repositories.api_keys import ApiKeyRepository
from app.repositories.organizations import OrganizationRepository
from app.repositories.users import UserRepository

bearer_scheme = HTTPBearer(auto_error=False, description="JWT access token")
api_key_scheme = APIKeyHeader(name="X-API-Key", auto_error=False, description="B2B API key")

DbSession = Annotated[Session, Depends(get_db)]

_CREDENTIALS_EXCEPTION = HTTPException(
    status_code=status.HTTP_401_UNAUTHORIZED,
    detail="Could not validate credentials",
    headers={"WWW-Authenticate": "Bearer"},
)


@dataclass
class Principal:
    organization: Organization
    auth_type: str  # "jwt" | "api_key"
    user: User | None = None
    scopes: set[str] = field(default_factory=set)

    def has_scope(self, scope: str) -> bool:
        return "*" in self.scopes or scope in self.scopes

    @property
    def actor_label(self) -> str:
        if self.user:
            return self.user.email
        return f"api_key:{self.auth_type}"


def get_principal(
    request: Request,
    db: DbSession,
    bearer: Annotated[HTTPAuthorizationCredentials | None, Depends(bearer_scheme)],
    api_key: Annotated[str | None, Depends(api_key_scheme)],
) -> Principal:
    if bearer is not None:
        principal = _principal_from_jwt(db, bearer.credentials)
    elif api_key:
        principal = _principal_from_api_key(db, api_key)
    else:
        raise _CREDENTIALS_EXCEPTION

    if principal.organization.status in {
        OrganizationStatus.suspended,
        OrganizationStatus.cancelled,
    }:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Organization is not active. Contact your administrator.",
        )
    request.state.organization_id = principal.organization.id
    return principal


def _principal_from_jwt(db: Session, token: str) -> Principal:
    try:
        payload = decode_token(token, expected_type="access")
        user_id = payload.get("sub")
    except ValueError as exc:
        raise _CREDENTIALS_EXCEPTION from exc
    if not user_id:
        raise _CREDENTIALS_EXCEPTION

    user = UserRepository(db).get(user_id)
    if not user or not user.is_active:
        raise _CREDENTIALS_EXCEPTION
    org = _resolve_org(db, user.organization_id)
    return Principal(organization=org, auth_type="jwt", user=user, scopes={"*"})


def _principal_from_api_key(db: Session, raw_key: str) -> Principal:
    repo = ApiKeyRepository(db)
    key = repo.resolve(raw_key)
    if key is None:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid API key")
    repo.mark_used(key)
    org = _resolve_org(db, key.organization_id)
    return Principal(organization=org, auth_type="api_key", scopes=set(key.scopes))


def _resolve_org(db: Session, organization_id: str | None) -> Organization:
    if not organization_id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Account is not associated with an organization.",
        )
    org = OrganizationRepository(db).get(organization_id)
    if org is None:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN, detail="Organization not found."
        )
    return org


# --- Convenience dependencies -----------------------------------------------
CurrentPrincipal = Annotated[Principal, Depends(get_principal)]


def get_current_user(principal: CurrentPrincipal) -> User:
    if principal.user is None:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="This endpoint requires an interactive user session, not an API key.",
        )
    return principal.user


def get_current_org(principal: CurrentPrincipal) -> Organization:
    return principal.organization


CurrentUser = Annotated[User, Depends(get_current_user)]
CurrentOrg = Annotated[Organization, Depends(get_current_org)]


def require_roles(*roles: str):
    """Require the user's domain role (buyer/seller/agent/admin/...)."""

    def dependency(user: CurrentUser) -> User:
        if user.is_superuser:
            return user
        if user.role.value not in roles:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN, detail="Insufficient permissions"
            )
        return user

    return dependency


def require_org_roles(*org_roles: str):
    """Require a workspace permission tier (owner/admin) for org administration."""

    def dependency(user: CurrentUser) -> User:
        if user.is_superuser:
            return user
        if user.org_role.value not in org_roles:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Requires organization owner or admin role",
            )
        return user

    return dependency


def require_scope(scope: str):
    """Require an API-key scope (JWT users implicitly hold all scopes)."""

    def dependency(principal: CurrentPrincipal) -> Principal:
        if not principal.has_scope(scope):
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail=f"API key is missing required scope: {scope}",
            )
        return principal

    return dependency


def require_superuser(user: CurrentUser) -> User:
    if not user.is_superuser:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN, detail="Platform administrator access required"
        )
    return user


def client_ip(request: Request) -> str | None:
    forwarded = request.headers.get("X-Forwarded-For")
    if forwarded:
        return forwarded.split(",")[0].strip()
    return request.client.host if request.client else None
