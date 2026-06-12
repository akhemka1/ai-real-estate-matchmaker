from __future__ import annotations

from sqlalchemy import select
from sqlalchemy.orm import Session

from app.models.engagement import Favorite, SavedSearch


class SavedSearchRepository:
    def __init__(self, db: Session):
        self.db = db

    def list(self, organization_id: str, user_id: str) -> list[SavedSearch]:
        return list(
            self.db.scalars(
                select(SavedSearch)
                .where(
                    SavedSearch.organization_id == organization_id,
                    SavedSearch.user_id == user_id,
                )
                .order_by(SavedSearch.created_at.desc())
            ).all()
        )

    def create(self, organization_id: str, user_id: str, name: str, filters: dict, notify: bool) -> SavedSearch:
        saved = SavedSearch(
            organization_id=organization_id,
            user_id=user_id,
            name=name,
            filters=filters,
            notify=notify,
        )
        self.db.add(saved)
        self.db.commit()
        self.db.refresh(saved)
        return saved

    def get(self, organization_id: str, user_id: str, saved_id: str) -> SavedSearch | None:
        saved = self.db.get(SavedSearch, saved_id)
        if saved is None or saved.organization_id != organization_id or saved.user_id != user_id:
            return None
        return saved

    def delete(self, saved: SavedSearch) -> None:
        self.db.delete(saved)
        self.db.commit()


class FavoriteRepository:
    def __init__(self, db: Session):
        self.db = db

    def list(self, organization_id: str, user_id: str) -> list[Favorite]:
        return list(
            self.db.scalars(
                select(Favorite)
                .where(Favorite.organization_id == organization_id, Favorite.user_id == user_id)
                .order_by(Favorite.created_at.desc())
            ).all()
        )

    def get(self, organization_id: str, user_id: str, property_id: str) -> Favorite | None:
        return self.db.scalar(
            select(Favorite).where(
                Favorite.organization_id == organization_id,
                Favorite.user_id == user_id,
                Favorite.property_id == property_id,
            )
        )

    def add(self, organization_id: str, user_id: str, property_id: str) -> Favorite:
        existing = self.get(organization_id, user_id, property_id)
        if existing:
            return existing
        favorite = Favorite(organization_id=organization_id, user_id=user_id, property_id=property_id)
        self.db.add(favorite)
        self.db.commit()
        self.db.refresh(favorite)
        return favorite

    def remove(self, favorite: Favorite) -> None:
        self.db.delete(favorite)
        self.db.commit()
