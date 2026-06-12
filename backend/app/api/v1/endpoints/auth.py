
from fastapi import APIRouter, HTTPException, Request, status

from app.api.deps import DbSession, client_ip
from app.core.config import settings
from app.core.plans import PLANS
from app.core.security import create_access_token, create_refresh_token, decode_token
from app.models.organization import OrganizationStatus
from app.models.user import OrgRole, User
from app.repositories.audit import AuditRepository
from app.repositories.organizations import OrganizationRepository
from app.repositories.users import UserRepository
from app.schemas.auth import (
    FirebaseLoginRequest,
    LoginRequest,
    RefreshRequest,
    SignupRequest,
    SupabaseLoginRequest,
    TokenResponse,
)
from app.schemas.user import UserCreate, UserRead
from app.services.firebase import FirebaseNotConfiguredError, get_firebase_auth_service
from app.services.supabase import SupabaseNotConfiguredError, get_supabase_auth_service

router = APIRouter()


@router.get("/config", summary="Public auth configuration for the frontend")
def auth_config() -> dict:
    """Tell the client which login methods are available.

    The web app uses ``firebase_enabled`` to decide whether to render the
    Google / Firebase sign-in button.
    """
    firebase_enabled = get_firebase_auth_service().is_configured()
    supabase_enabled = get_supabase_auth_service().is_configured()
    providers = ["password"]
    if firebase_enabled:
        providers.append("firebase")
    if supabase_enabled:
        providers.append("supabase")
    return {
        "providers": providers,
        "firebase_enabled": firebase_enabled,
        "firebase_project_id": settings.firebase_project_id if firebase_enabled else None,
        "supabase_enabled": supabase_enabled,
        "supabase_url": settings.supabase_url if supabase_enabled else None,
    }


def _token_response(user: User) -> TokenResponse:
    claims = {
        "role": user.role.value,
        "org_role": user.org_role.value,
        "org": user.organization_id,
    }
    return TokenResponse(
        access_token=create_access_token(user.id, claims),
        refresh_token=create_refresh_token(user.id, {"org": user.organization_id}),
        expires_in=settings.access_token_expire_minutes * 60,
        user=UserRead.model_validate(user),
    )


@router.post("/signup", response_model=TokenResponse, status_code=status.HTTP_201_CREATED)
def signup(payload: SignupRequest, db: DbSession, request: Request) -> TokenResponse:
    """Self-serve onboarding: provisions an organization and its owner account."""
    users = UserRepository(db)
    if users.get_by_email(payload.email):
        raise HTTPException(status_code=status.HTTP_409_CONFLICT, detail="Email already registered")

    plan_code = payload.plan_code if payload.plan_code in PLANS else settings.default_plan
    org_name = payload.organization_name or f"{payload.first_name} {payload.last_name}'s Workspace"
    org = OrganizationRepository(db).create(
        org_name, plan_code=plan_code, billing_email=payload.email, status=OrganizationStatus.trialing
    )

    user = users.create(
        UserCreate(
            email=payload.email,
            password=payload.password,
            first_name=payload.first_name,
            last_name=payload.last_name,
            role=payload.role,
            phone=payload.phone,
        ),
        organization_id=org.id,
        org_role=OrgRole.owner,
    )
    AuditRepository(db).record(
        action="user.signup",
        organization_id=org.id,
        actor_id=user.id,
        actor_label=user.email,
        resource_type="organization",
        resource_id=org.id,
        ip_address=client_ip(request),
        request_id=getattr(request.state, "request_id", None),
    )
    return _token_response(user)


@router.post("/login", response_model=TokenResponse)
def login(payload: LoginRequest, db: DbSession) -> TokenResponse:
    users = UserRepository(db)
    user = users.authenticate(payload.email, payload.password)
    if not user:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid email or password"
        )
    if not user.is_active:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Account is disabled")
    users.touch_login(user)
    return _token_response(user)


@router.post("/refresh", response_model=TokenResponse)
def refresh(payload: RefreshRequest, db: DbSession) -> TokenResponse:
    try:
        claims = decode_token(payload.refresh_token, expected_type="refresh")
    except ValueError as exc:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid refresh token"
        ) from exc
    user = UserRepository(db).get(claims.get("sub", ""))
    if not user or not user.is_active:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid refresh token")
    return _token_response(user)


@router.post(
    "/firebase",
    response_model=TokenResponse,
    summary="Google Firebase Login",
    description="Verify a Firebase Auth ID token and exchange it for the backend JWT.",
)
def firebase_login(payload: FirebaseLoginRequest, db: DbSession) -> TokenResponse:
    try:
        decoded = get_firebase_auth_service().verify_id_token(payload.id_token)
    except FirebaseNotConfiguredError as exc:
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail="Firebase authentication is not configured on this backend",
        ) from exc
    except Exception as exc:  # noqa: BLE001 - any verification failure is a 401
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid Firebase token"
        ) from exc

    firebase_uid = decoded["uid"]
    email = decoded.get("email")
    if not email:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Firebase token must include a verified email address",
        )

    repo = UserRepository(db)
    user = repo.get_by_firebase_uid(firebase_uid)
    if user is None:
        user = repo.get_by_email(email)
        if user:
            user = repo.attach_firebase_uid(user, firebase_uid)
        else:
            name = decoded.get("name") or ""
            first_name, _, last_name = name.partition(" ")
            org = OrganizationRepository(db).create(
                payload.organization_name or f"{first_name or 'New'} Workspace",
                plan_code=settings.default_plan,
                billing_email=email,
            )
            user = repo.create_from_firebase(
                firebase_uid=firebase_uid,
                email=email,
                first_name=first_name or "Firebase",
                last_name=last_name or "User",
                organization_id=org.id,
                role=payload.role,
                org_role=OrgRole.owner,
                avatar_url=decoded.get("picture"),
            )
    return _token_response(user)


@router.post(
    "/supabase",
    response_model=TokenResponse,
    summary="Supabase Login",
    description="Verify a Supabase Auth access token and exchange it for the backend JWT.",
)
def supabase_login(payload: SupabaseLoginRequest, db: DbSession) -> TokenResponse:
    service = get_supabase_auth_service()
    if not service.is_configured():
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail="Supabase authentication is not configured on this backend",
        )
    try:
        decoded = service.verify_access_token(payload.access_token)
    except SupabaseNotConfiguredError as exc:
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail="Supabase authentication is not configured on this backend",
        ) from exc
    except ValueError as exc:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid Supabase token"
        ) from exc

    supabase_uid = decoded.get("sub")
    email = decoded.get("email")
    if not supabase_uid or not email:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Supabase token must include a subject and verified email",
        )

    repo = UserRepository(db)
    user = repo.get_by_supabase_uid(supabase_uid)
    if user is None:
        user = repo.get_by_email(email)
        if user:
            user = repo.attach_supabase_uid(user, supabase_uid)
        else:
            metadata = decoded.get("user_metadata") or {}
            name = metadata.get("full_name") or metadata.get("name") or ""
            first_name, _, last_name = name.partition(" ")
            org = OrganizationRepository(db).create(
                payload.organization_name or f"{first_name or 'New'} Workspace",
                plan_code=settings.default_plan,
                billing_email=email,
            )
            user = repo.create_from_supabase(
                supabase_uid=supabase_uid,
                email=email,
                first_name=first_name or "Supabase",
                last_name=last_name or "User",
                organization_id=org.id,
                role=payload.role,
                org_role=OrgRole.owner,
                avatar_url=metadata.get("avatar_url"),
            )
    return _token_response(user)
