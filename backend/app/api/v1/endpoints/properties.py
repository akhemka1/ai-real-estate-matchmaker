from typing import Annotated

from fastapi import APIRouter, BackgroundTasks, Depends, HTTPException, Query, Request, status

from app.api.deps import (
    CurrentOrg,
    DbSession,
    client_ip,
    get_current_user,
    require_scope,
)
from app.models.user import User
from app.repositories.audit import AuditRepository
from app.repositories.properties import PropertyRepository
from app.schemas.common import PaginatedResponse
from app.schemas.intelligence import RankedProperty, SimilarPropertiesResponse
from app.schemas.property import (
    ImageUploadRequest,
    ImageUploadResponse,
    PropertyCreate,
    PropertyImagesUpdate,
    PropertyRead,
    PropertyUpdate,
    SearchFilters,
)
from app.services.semantic import build_property_index
from app.services.storage import (
    StorageNotConfiguredError,
    UnsupportedMediaTypeError,
    storage_service,
)
from app.services.usage import UsageService
from app.services.webhooks import dispatch_event

router = APIRouter()


def _can_edit(user: User, property_obj) -> bool:
    """A listing can be edited by a superuser, org owner/admin, or its owning agent/seller."""
    return (
        user.is_superuser
        or user.role.value == "admin"
        or user.org_role.value in {"owner", "admin"}
        or user.id in {property_obj.seller_id, property_obj.agent_id}
    )


@router.get("", response_model=PaginatedResponse[PropertyRead])
def list_properties(
    db: DbSession,
    org: CurrentOrg,
    _: Annotated[object, Depends(require_scope("properties:read"))],
    page: int = Query(default=1, ge=1),
    page_size: int = Query(default=12, ge=1, le=100),
    query: str | None = None,
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
        query=query,
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


@router.post("", response_model=PropertyRead, status_code=status.HTTP_201_CREATED)
def create_property(
    payload: PropertyCreate,
    db: DbSession,
    org: CurrentOrg,
    request: Request,
    background: BackgroundTasks,
    current_user: Annotated[User, Depends(get_current_user)],
    _: Annotated[object, Depends(require_scope("properties:write"))],
) -> PropertyRead:
    if current_user.role.value not in {"seller", "agent", "admin"} and not current_user.is_superuser:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Only sellers, agents, or admins can create listings",
        )
    if not UsageService(db).can_add_property(org):
        raise HTTPException(
            status_code=status.HTTP_402_PAYMENT_REQUIRED,
            detail="Listing quota reached for your plan. Upgrade to add more properties.",
        )

    if current_user.role.value == "seller":
        payload.seller_id = current_user.id
    if current_user.role.value == "agent":
        payload.agent_id = current_user.id

    property_obj = PropertyRepository(db).create(payload, organization_id=org.id)
    AuditRepository(db).record(
        action="property.created",
        organization_id=org.id,
        actor_id=current_user.id,
        actor_label=current_user.email,
        resource_type="property",
        resource_id=property_obj.id,
        ip_address=client_ip(request),
        request_id=getattr(request.state, "request_id", None),
    )
    background.add_task(
        dispatch_event, org.id, "property.created", {"property_id": property_obj.id}
    )
    return PropertyRead.model_validate(property_obj)


@router.get("/{property_id}", response_model=PropertyRead)
def get_property(
    property_id: str,
    db: DbSession,
    org: CurrentOrg,
    _: Annotated[object, Depends(require_scope("properties:read"))],
) -> PropertyRead:
    property_obj = PropertyRepository(db).get(property_id, org.id)
    if not property_obj:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Property not found")
    return PropertyRead.model_validate(property_obj)


@router.patch("/{property_id}", response_model=PropertyRead)
def update_property(
    property_id: str,
    payload: PropertyUpdate,
    db: DbSession,
    org: CurrentOrg,
    request: Request,
    background: BackgroundTasks,
    current_user: Annotated[User, Depends(get_current_user)],
) -> PropertyRead:
    repo = PropertyRepository(db)
    property_obj = repo.get(property_id, org.id)
    if not property_obj:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Property not found")
    allowed = (
        current_user.is_superuser
        or current_user.role.value == "admin"
        or current_user.org_role.value in {"owner", "admin"}
        or current_user.id in {property_obj.seller_id, property_obj.agent_id}
    )
    if not allowed:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Insufficient permissions")
    updated = repo.update(property_obj, payload)
    background.add_task(dispatch_event, org.id, "property.updated", {"property_id": updated.id})
    return PropertyRead.model_validate(updated)


@router.get("/{property_id}/similar", response_model=SimilarPropertiesResponse)
def similar_properties(
    property_id: str,
    db: DbSession,
    org: CurrentOrg,
    _: Annotated[object, Depends(require_scope("properties:read"))],
    limit: int = Query(default=6, ge=1, le=20),
) -> SimilarPropertiesResponse:
    """Semantic 'more like this' — ranks listings by description/feature similarity."""
    repo = PropertyRepository(db)
    target = repo.get(property_id, org.id)
    if not target:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Property not found")

    candidates = repo.candidates(org.id)
    index = build_property_index(candidates)
    by_id = {p.id: p for p in candidates}
    results: list[RankedProperty] = []
    for pid, score in index.similar_to(property_id)[:limit]:
        prop = by_id.get(pid)
        if prop is not None:
            results.append(
                RankedProperty(property=PropertyRead.model_validate(prop), relevance=round(score, 4))
            )
    return SimilarPropertiesResponse(property_id=property_id, results=results)


@router.post("/{property_id}/images/upload-url", response_model=ImageUploadResponse)
def create_image_upload_url(
    property_id: str,
    payload: ImageUploadRequest,
    db: DbSession,
    org: CurrentOrg,
    current_user: Annotated[User, Depends(get_current_user)],
    _: Annotated[object, Depends(require_scope("properties:write"))],
) -> ImageUploadResponse:
    """Return a short-lived presigned URL to upload a property photo directly to storage."""
    property_obj = PropertyRepository(db).get(property_id, org.id)
    if not property_obj:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Property not found")
    if not _can_edit(current_user, property_obj):
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Insufficient permissions")
    try:
        presigned = storage_service.create_presigned_upload(
            org.id, property_id, payload.content_type
        )
    except UnsupportedMediaTypeError as exc:
        raise HTTPException(
            status_code=status.HTTP_415_UNSUPPORTED_MEDIA_TYPE,
            detail=f"Unsupported image type: {payload.content_type}",
        ) from exc
    except StorageNotConfiguredError as exc:
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail="Media storage is not configured on this backend",
        ) from exc
    return ImageUploadResponse(**presigned.__dict__)


@router.put("/{property_id}/images", response_model=PropertyRead)
def set_property_images(
    property_id: str,
    payload: PropertyImagesUpdate,
    db: DbSession,
    org: CurrentOrg,
    current_user: Annotated[User, Depends(get_current_user)],
    _: Annotated[object, Depends(require_scope("properties:write"))],
) -> PropertyRead:
    """Replace a property's ordered image list (images[0] is the cover photo)."""
    repo = PropertyRepository(db)
    property_obj = repo.get(property_id, org.id)
    if not property_obj:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Property not found")
    if not _can_edit(current_user, property_obj):
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Insufficient permissions")
    property_obj.images = payload.images
    db.commit()
    db.refresh(property_obj)
    return PropertyRead.model_validate(property_obj)


@router.delete("/{property_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_property(
    property_id: str,
    db: DbSession,
    org: CurrentOrg,
    request: Request,
    current_user: Annotated[User, Depends(get_current_user)],
) -> None:
    repo = PropertyRepository(db)
    property_obj = repo.get(property_id, org.id)
    if not property_obj:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Property not found")
    allowed = (
        current_user.is_superuser
        or current_user.org_role.value in {"owner", "admin"}
        or current_user.id in {property_obj.seller_id, property_obj.agent_id}
    )
    if not allowed:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Insufficient permissions")
    AuditRepository(db).record(
        action="property.deleted",
        organization_id=org.id,
        actor_id=current_user.id,
        actor_label=current_user.email,
        resource_type="property",
        resource_id=property_id,
        ip_address=client_ip(request),
        request_id=getattr(request.state, "request_id", None),
    )
    repo.delete(property_obj)
