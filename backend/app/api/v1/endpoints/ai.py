from typing import Annotated

from fastapi import APIRouter, Depends, HTTPException, status

from app.api.deps import CurrentOrg, DbSession, get_current_org, require_scope
from app.core.config import settings
from app.models.organization import Organization
from app.schemas.ai import (
    AppreciationRequest,
    AppreciationResponse,
    AssistantRequest,
    AssistantResponse,
    DescriptionAnalysisRequest,
    DescriptionAnalysisResponse,
    GenerateDescriptionRequest,
    GenerateDescriptionResponse,
    ImageAnalysisRequest,
    ImageAnalysisResponse,
    PricePredictionRequest,
    PricePredictionResponse,
)
from app.schemas.explain import ExplanationResponse
from app.schemas.intelligence import DealScoreRequest, DealScoreResponse
from app.services.ai import MODEL_REGISTRY, AIService
from app.services.deal_score import compute_deal_score
from app.services.usage import QuotaExceededError, UsageService

router = APIRouter()
service = AIService()


def meter_ai_call(
    db: DbSession,
    org: Annotated[Organization, Depends(get_current_org)],
    _: Annotated[object, Depends(require_scope("ai:invoke"))],
) -> Organization:
    """Enforce the per-plan monthly AI-call quota and record consumption."""
    try:
        UsageService(db).consume_ai_call(org)
    except QuotaExceededError as exc:
        raise HTTPException(
            status_code=status.HTTP_402_PAYMENT_REQUIRED,
            detail="Monthly AI quota reached for your plan. Upgrade to continue.",
        ) from exc
    return org


MeteredOrg = Annotated[Organization, Depends(meter_ai_call)]


@router.get("/status", summary="Public AI status (no auth, no inference)")
def ai_status() -> dict:
    """Lightweight public check used by the frontend AI badge. No model call."""
    return {
        "llm_enabled": settings.ai_enabled,
        "provider": settings.active_ai_provider,
        "model": settings.active_ai_model,
    }


@router.get("/models", summary="List served AI models and versions")
def list_models(_: CurrentOrg) -> dict:
    return {
        "provider": "anthropic" if settings.ai_enabled else "heuristic",
        "llm_enabled": settings.ai_enabled,
        "llm_model": settings.anthropic_model if settings.ai_enabled else None,
        "models": MODEL_REGISTRY,
    }


@router.post("/price-prediction", response_model=PricePredictionResponse)
def predict_price(payload: PricePredictionRequest, _: MeteredOrg) -> PricePredictionResponse:
    return service.predict_price(payload)


@router.post("/price-prediction/explain", response_model=ExplanationResponse)
def explain_price(payload: PricePredictionRequest, _: MeteredOrg) -> ExplanationResponse:
    """SHAP-style additive explanation of the price prediction."""
    return service.explain_price(payload)


@router.post("/appreciation", response_model=AppreciationResponse)
def forecast_appreciation(payload: AppreciationRequest, _: MeteredOrg) -> AppreciationResponse:
    return service.forecast_appreciation(payload)


@router.post("/deal-score", response_model=DealScoreResponse, summary="DealScore investment intelligence")
def deal_score(payload: DealScoreRequest, _: MeteredOrg) -> DealScoreResponse:
    """Blend value, appreciation, yield, and liquidity into one explainable 0–100 grade."""
    return compute_deal_score(payload)


@router.post("/images/analyze", response_model=ImageAnalysisResponse)
def analyze_images(payload: ImageAnalysisRequest, _: MeteredOrg) -> ImageAnalysisResponse:
    return service.analyze_images(payload)


@router.post("/descriptions/analyze", response_model=DescriptionAnalysisResponse)
def analyze_description(payload: DescriptionAnalysisRequest, _: MeteredOrg) -> DescriptionAnalysisResponse:
    return service.analyze_description(payload)


@router.post("/generate-description", response_model=GenerateDescriptionResponse, summary="AI listing copywriter")
def generate_description(payload: GenerateDescriptionRequest, _: MeteredOrg) -> GenerateDescriptionResponse:
    """Generate a polished, accurate listing headline + description from features."""
    return service.generate_description(payload)


@router.post("/assistant", response_model=AssistantResponse, summary="AI property assistant")
def assistant(payload: AssistantRequest, _: MeteredOrg) -> AssistantResponse:
    """Conversational real-estate assistant grounded in optional listing context."""
    return service.assistant(payload)
