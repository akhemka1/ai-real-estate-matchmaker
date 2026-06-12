from fastapi import APIRouter, HTTPException, status

from app.api.deps import CurrentOrg, CurrentUser, DbSession
from app.repositories.engagement import SavedSearchRepository
from app.schemas.common import APIMessage
from app.schemas.engagement import SavedSearchCreate, SavedSearchRead

router = APIRouter()


@router.get("", response_model=list[SavedSearchRead])
def list_saved_searches(db: DbSession, org: CurrentOrg, user: CurrentUser) -> list[SavedSearchRead]:
    return [
        SavedSearchRead.model_validate(s)
        for s in SavedSearchRepository(db).list(org.id, user.id)
    ]


@router.post("", response_model=SavedSearchRead, status_code=status.HTTP_201_CREATED)
def create_saved_search(
    payload: SavedSearchCreate, db: DbSession, org: CurrentOrg, user: CurrentUser
) -> SavedSearchRead:
    saved = SavedSearchRepository(db).create(
        org.id,
        user.id,
        payload.name,
        payload.filters.model_dump(exclude_none=True),
        payload.notify,
    )
    return SavedSearchRead.model_validate(saved)


@router.delete("/{saved_id}", response_model=APIMessage)
def delete_saved_search(
    saved_id: str, db: DbSession, org: CurrentOrg, user: CurrentUser
) -> APIMessage:
    repo = SavedSearchRepository(db)
    saved = repo.get(org.id, user.id, saved_id)
    if saved is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Saved search not found")
    repo.delete(saved)
    return APIMessage(message="Saved search deleted")
