"""Property data access — always scoped to a single organization (tenant)."""

from __future__ import annotations

from sqlalchemy import Select, func, or_, select
from sqlalchemy.orm import Session

from app.models.property import Property
from app.schemas.property import PropertyCreate, PropertyUpdate, SearchFilters


class PropertyRepository:
    def __init__(self, db: Session):
        self.db = db

    def get(self, property_id: str, organization_id: str) -> Property | None:
        property_obj = self.db.get(Property, property_id)
        if property_obj is None or property_obj.organization_id != organization_id:
            return None
        return property_obj

    def count_for_org(self, organization_id: str) -> int:
        return (
            self.db.scalar(
                select(func.count())
                .select_from(Property)
                .where(Property.organization_id == organization_id)
            )
            or 0
        )

    def create(self, payload: PropertyCreate, organization_id: str) -> Property:
        data = payload.model_dump()
        data["address"] = payload.address.model_dump()
        property_obj = Property(organization_id=organization_id, **data)
        self.db.add(property_obj)
        self.db.commit()
        self.db.refresh(property_obj)
        return property_obj

    def update(self, property_obj: Property, payload: PropertyUpdate) -> Property:
        for field, value in payload.model_dump(exclude_unset=True).items():
            if field == "address" and value is not None:
                value = payload.address.model_dump()
            setattr(property_obj, field, value)
        self.db.commit()
        self.db.refresh(property_obj)
        return property_obj

    def delete(self, property_obj: Property) -> None:
        self.db.delete(property_obj)
        self.db.commit()

    def list(
        self, organization_id: str, filters: SearchFilters, page: int, page_size: int
    ) -> tuple[list[Property], int]:
        statement = self._scoped(organization_id, filters)
        total = self.db.scalar(select(func.count()).select_from(statement.subquery())) or 0
        rows = self.db.scalars(
            statement.order_by(Property.created_at.desc())
            .offset((page - 1) * page_size)
            .limit(page_size)
        ).all()
        return list(rows), total

    def candidates(
        self, organization_id: str, filters: SearchFilters | None = None, limit: int = 500
    ) -> list[Property]:
        statement = self._scoped(organization_id, filters)
        return list(self.db.scalars(statement.limit(limit)).all())

    def _scoped(self, organization_id: str, filters: SearchFilters | None) -> Select:
        statement = select(Property).where(Property.organization_id == organization_id)
        if filters:
            statement = self._apply_filters(statement, filters)
        return statement

    def _apply_filters(self, statement: Select, filters: SearchFilters) -> Select:
        if filters.query:
            query = f"%{filters.query.lower()}%"
            statement = statement.where(
                or_(func.lower(Property.title).like(query), func.lower(Property.description).like(query))
            )
        if filters.city:
            statement = statement.where(func.lower(Property.address["city"].as_string()) == filters.city.lower())
        if filters.state:
            statement = statement.where(func.lower(Property.address["state"].as_string()) == filters.state.lower())
        if filters.country:
            statement = statement.where(func.lower(Property.address["country"].as_string()) == filters.country.lower())
        if filters.min_price is not None:
            statement = statement.where(Property.price >= filters.min_price)
        if filters.max_price is not None:
            statement = statement.where(Property.price <= filters.max_price)
        if filters.bedrooms is not None:
            statement = statement.where(Property.bedrooms >= filters.bedrooms)
        if filters.bathrooms is not None:
            statement = statement.where(Property.bathrooms >= filters.bathrooms)
        if filters.property_type:
            statement = statement.where(Property.property_type == filters.property_type)
        if filters.listing_type:
            statement = statement.where(Property.listing_type == filters.listing_type)
        if filters.min_sqft is not None:
            statement = statement.where(Property.sqft >= filters.min_sqft)
        if filters.max_sqft is not None:
            statement = statement.where(Property.sqft <= filters.max_sqft)
        return statement
