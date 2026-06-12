from typing import Annotated

from fastapi import APIRouter, BackgroundTasks, Depends, HTTPException, status

from app.api.deps import CurrentOrg, DbSession, get_current_user, require_scope
from app.models.match import FeedbackValue, RecommendationFeedback
from app.models.user import User
from app.repositories.properties import PropertyRepository
from app.schemas.common import APIMessage
from app.schemas.property import SearchFilters
from app.schemas.recommendation import FeedbackCreate, RecommendationRead, RecommendationRequest
from app.services.recommendations import RecommendationService
from app.services.signals import SignalService
from app.services.webhooks import dispatch_event

router = APIRouter()


@router.post("", response_model=list[RecommendationRead])
def recommend_properties(
    payload: RecommendationRequest,
    db: DbSession,
    org: CurrentOrg,
    current_user: Annotated[User, Depends(get_current_user)],
    _: Annotated[object, Depends(require_scope("recommendations:read"))],
) -> list[RecommendationRead]:
    filters = SearchFilters(**payload.model_dump(include=set(SearchFilters.model_fields)))
    candidates = PropertyRepository(db).candidates(org.id, filters=filters)
    boosts = SignalService(db).collaborative_boosts(org.id)
    request = payload.model_copy(update={"user_id": payload.user_id or current_user.id})
    return RecommendationService().rank(candidates, request, collaborative_boost=boosts)


@router.post("/feedback", response_model=APIMessage, status_code=status.HTTP_201_CREATED)
def create_feedback(
    payload: FeedbackCreate,
    db: DbSession,
    org: CurrentOrg,
    background: BackgroundTasks,
    current_user: Annotated[User, Depends(get_current_user)],
) -> APIMessage:
    if not PropertyRepository(db).get(payload.property_id, org.id):
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Property not found")
    feedback = RecommendationFeedback(
        organization_id=org.id,
        user_id=current_user.id,
        property_id=payload.property_id,
        feedback=FeedbackValue(payload.feedback),
        score=payload.score,
    )
    db.add(feedback)
    db.commit()
    background.add_task(
        dispatch_event,
        org.id,
        "recommendation.feedback",
        {"property_id": payload.property_id, "feedback": payload.feedback},
    )
    return APIMessage(message="Feedback captured")
