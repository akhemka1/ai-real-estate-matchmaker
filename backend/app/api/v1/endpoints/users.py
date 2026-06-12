from typing import Annotated

from fastapi import APIRouter, Depends, HTTPException, status

from app.api.deps import CurrentOrg, CurrentUser, DbSession, require_org_roles
from app.models.user import OrgRole, User
from app.repositories.users import UserRepository
from app.schemas.user import MemberInvite, UserRead, UserUpdate
from app.services.usage import UsageService

router = APIRouter()


@router.get("/me", response_model=UserRead)
def read_me(current_user: CurrentUser) -> User:
    return current_user


@router.patch("/me", response_model=UserRead)
def update_me(payload: UserUpdate, current_user: CurrentUser, db: DbSession) -> User:
    return UserRepository(db).update(current_user, payload)


@router.get("/members", response_model=list[UserRead])
def list_members(
    db: DbSession,
    org: CurrentOrg,
    _: Annotated[User, Depends(require_org_roles("owner", "admin"))],
) -> list[User]:
    return UserRepository(db).list_for_org(org.id)


@router.post("/members", response_model=UserRead, status_code=status.HTTP_201_CREATED)
def invite_member(
    payload: MemberInvite,
    db: DbSession,
    org: CurrentOrg,
    _: Annotated[User, Depends(require_org_roles("owner", "admin"))],
) -> User:
    users = UserRepository(db)
    if users.get_by_email(payload.email):
        raise HTTPException(status_code=status.HTTP_409_CONFLICT, detail="Email already registered")
    if not UsageService(db).can_add_seat(org):
        raise HTTPException(
            status_code=status.HTTP_402_PAYMENT_REQUIRED,
            detail="Seat quota reached for your plan. Upgrade to add more members.",
        )
    return users.create(
        payload,
        organization_id=org.id,
        org_role=OrgRole(payload.org_role),
    )
