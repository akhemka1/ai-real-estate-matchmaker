from typing import Annotated

from fastapi import APIRouter, BackgroundTasks, Depends, HTTPException, status

from app.api.deps import CurrentOrg, DbSession, get_current_user, require_scope
from app.models.user import User
from app.repositories.matches import MatchRepository
from app.repositories.properties import PropertyRepository
from app.repositories.users import UserRepository
from app.schemas.match import (
    GenerateMatchesRequest,
    GenerateMatchesResponse,
    LeadMatchRead,
)
from app.services.matching import MODEL_VERSION, LeadMatchingService
from app.services.webhooks import dispatch_event

router = APIRouter()


@router.post("", response_model=GenerateMatchesResponse)
def generate_matches(
    payload: GenerateMatchesRequest,
    db: DbSession,
    org: CurrentOrg,
    background: BackgroundTasks,
    current_user: Annotated[User, Depends(get_current_user)],
    _: Annotated[object, Depends(require_scope("matches:read"))],
) -> GenerateMatchesResponse:
    """Find the buyers/renters most likely to want one of this org's listings."""
    property_obj = PropertyRepository(db).get(payload.property_id, org.id)
    if not property_obj:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Property not found")

    buyers = UserRepository(db).buyers_for_org(org.id)
    matches = LeadMatchingService(db).match_buyers(org.id, property_obj, buyers, payload.limit)

    if payload.persist and matches:
        repo = MatchRepository(db)
        seller_id = property_obj.seller_id or property_obj.agent_id or current_user.id
        for match in matches:
            repo.create(
                organization_id=org.id,
                seller_id=seller_id,
                buyer_id=match.buyer_id,
                property_id=property_obj.id,
                match_score=match.match_score,
                confidence=match.confidence,
                reasons=[r.model_dump() for r in match.reasons],
            )
        background.add_task(
            dispatch_event,
            org.id,
            "match.created",
            {"property_id": property_obj.id, "match_count": len(matches)},
        )

    return GenerateMatchesResponse(
        property_id=property_obj.id, model_version=MODEL_VERSION, matches=matches
    )


@router.get("/property/{property_id}", response_model=list[LeadMatchRead])
def list_property_matches(
    property_id: str,
    db: DbSession,
    org: CurrentOrg,
    _: Annotated[User, Depends(get_current_user)],
) -> list[LeadMatchRead]:
    if not PropertyRepository(db).get(property_id, org.id):
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Property not found")
    return [
        LeadMatchRead.model_validate(m)
        for m in MatchRepository(db).list_for_property(org.id, property_id)
    ]
