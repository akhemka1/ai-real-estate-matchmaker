from typing import Annotated

from fastapi import APIRouter, Depends, Query

from app.api.deps import CurrentOrg, DbSession, require_scope
from app.repositories.properties import PropertyRepository
from app.schemas.common import PaginatedResponse
from app.schemas.intelligence import (
    InterpretedQuery,
    NaturalSearchRequest,
    NaturalSearchResponse,
    RankedProperty,
)
from app.schemas.property import PropertyRead, SearchFilters
from app.services.nlq import smart_parse_query
from app.services.semantic import build_property_index

router = APIRouter()


@router.post("/natural", response_model=NaturalSearchResponse)
def natural_language_search(
    payload: NaturalSearchRequest,
    db: DbSession,
    org: CurrentOrg,
    _: Annotated[object, Depends(require_scope("search:read"))],
) -> NaturalSearchResponse:
    """Understand a free-text query, apply structured filters, then semantically rank."""
    parsed = smart_parse_query(payload.query)
    filters = SearchFilters(
        **{k: v for k, v in parsed.filters.items() if k in SearchFilters.model_fields},
        amenities=parsed.amenities,
    )
    candidates = PropertyRepository(db).candidates(org.id, filters=filters)

    index = build_property_index(candidates)
    rank_text = " ".join(filter(None, [parsed.free_text, " ".join(parsed.amenities)])) or payload.query
    ranked = index.rank(rank_text)

    by_id = {p.id: p for p in candidates}
    results: list[RankedProperty] = []
    for pid, score in ranked[: payload.limit]:
        prop = by_id.get(pid)
        if prop is not None:
            results.append(
                RankedProperty(property=PropertyRead.model_validate(prop), relevance=round(score, 4))
            )

    return NaturalSearchResponse(
        query=payload.query,
        interpreted=InterpretedQuery(
            filters=parsed.filters,
            amenities=parsed.amenities,
            free_text=parsed.free_text,
            interpreted=parsed.interpreted,
        ),
        total=len(candidates),
        results=results,
    )


@router.get("", response_model=PaginatedResponse[PropertyRead])
def search_properties(
    db: DbSession,
    org: CurrentOrg,
    _: Annotated[object, Depends(require_scope("search:read"))],
    q: str | None = Query(default=None),
    page: int = Query(default=1, ge=1),
    page_size: int = Query(default=12, ge=1, le=100),
    city: str | None = None,
    state: str | None = None,
    country: str | None = None,
    min_price: float | None = None,
    max_price: float | None = None,
    bedrooms: float | None = None,
    bathrooms: float | None = None,
    property_type: str | None = None,
    listing_type: str | None = None,
) -> PaginatedResponse[PropertyRead]:
    filters = SearchFilters(
        query=q,
        city=city,
        state=state,
        country=country,
        min_price=min_price,
        max_price=max_price,
        bedrooms=bedrooms,
        bathrooms=bathrooms,
        property_type=property_type,
        listing_type=listing_type,
    )
    rows, total = PropertyRepository(db).list(org.id, filters, page, page_size)
    return PaginatedResponse(
        data=[PropertyRead.model_validate(row) for row in rows],
        total=total,
        page=page,
        page_size=page_size,
        total_pages=(total + page_size - 1) // page_size,
    )
