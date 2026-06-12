from fastapi import APIRouter, HTTPException, status

from app.api.deps import CurrentOrg, CurrentUser, DbSession
from app.repositories.engagement import FavoriteRepository
from app.repositories.properties import PropertyRepository
from app.schemas.common import APIMessage
from app.schemas.engagement import FavoriteCreate, FavoriteRead
from app.schemas.property import PropertyRead

router = APIRouter()


@router.get("", response_model=list[FavoriteRead])
def list_favorites(db: DbSession, org: CurrentOrg, user: CurrentUser) -> list[FavoriteRead]:
    favorites = FavoriteRepository(db).list(org.id, user.id)
    prop_repo = PropertyRepository(db)
    result: list[FavoriteRead] = []
    for fav in favorites:
        property_obj = prop_repo.get(fav.property_id, org.id)
        item = FavoriteRead.model_validate(fav)
        if property_obj:
            item.property = PropertyRead.model_validate(property_obj)
        result.append(item)
    return result


@router.post("", response_model=FavoriteRead, status_code=status.HTTP_201_CREATED)
def add_favorite(
    payload: FavoriteCreate, db: DbSession, org: CurrentOrg, user: CurrentUser
) -> FavoriteRead:
    if not PropertyRepository(db).get(payload.property_id, org.id):
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Property not found")
    favorite = FavoriteRepository(db).add(org.id, user.id, payload.property_id)
    return FavoriteRead.model_validate(favorite)


@router.delete("/{property_id}", response_model=APIMessage)
def remove_favorite(
    property_id: str, db: DbSession, org: CurrentOrg, user: CurrentUser
) -> APIMessage:
    repo = FavoriteRepository(db)
    favorite = repo.get(org.id, user.id, property_id)
    if favorite is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Favorite not found")
    repo.remove(favorite)
    return APIMessage(message="Removed from favorites")
