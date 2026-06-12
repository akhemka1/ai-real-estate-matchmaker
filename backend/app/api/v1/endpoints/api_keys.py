from typing import Annotated

from fastapi import APIRouter, Depends, HTTPException, status

from app.api.deps import CurrentOrg, DbSession, require_org_roles
from app.models.user import User
from app.repositories.api_keys import ApiKeyRepository
from app.schemas.api_key import API_KEY_SCOPES, ApiKeyCreate, ApiKeyCreated, ApiKeyRead
from app.schemas.common import APIMessage
from app.services.usage import UsageService

router = APIRouter()


@router.get("", response_model=list[ApiKeyRead])
def list_api_keys(
    db: DbSession,
    org: CurrentOrg,
    _: Annotated[User, Depends(require_org_roles("owner", "admin"))],
) -> list[ApiKeyRead]:
    return [ApiKeyRead.model_validate(k) for k in ApiKeyRepository(db).list_for_org(org.id)]


@router.post("", response_model=ApiKeyCreated, status_code=status.HTTP_201_CREATED)
def create_api_key(
    payload: ApiKeyCreate,
    db: DbSession,
    org: CurrentOrg,
    member: Annotated[User, Depends(require_org_roles("owner", "admin"))],
) -> ApiKeyCreated:
    invalid = set(payload.scopes) - set(API_KEY_SCOPES)
    if invalid:
        raise HTTPException(
            status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
            detail=f"Unknown scopes: {', '.join(sorted(invalid))}",
        )
    if not UsageService(db).can_add_api_key(org):
        raise HTTPException(
            status_code=status.HTTP_402_PAYMENT_REQUIRED,
            detail="API key quota reached for your plan.",
        )
    key, raw_key = ApiKeyRepository(db).create(
        organization_id=org.id,
        name=payload.name,
        scopes=payload.scopes,
        created_by=member.id,
        expires_at=payload.expires_at,
    )
    data = ApiKeyRead.model_validate(key).model_dump()
    return ApiKeyCreated(**data, api_key=raw_key)


@router.delete("/{key_id}", response_model=APIMessage)
def revoke_api_key(
    key_id: str,
    db: DbSession,
    org: CurrentOrg,
    _: Annotated[User, Depends(require_org_roles("owner", "admin"))],
) -> APIMessage:
    repo = ApiKeyRepository(db)
    key = repo.get_for_org(org.id, key_id)
    if key is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="API key not found")
    repo.revoke(key)
    return APIMessage(message="API key revoked")
