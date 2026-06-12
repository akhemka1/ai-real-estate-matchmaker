"""DealScore™ — a single, explainable 0–100 investment grade for a property.

Blends four independent signals into one number a buyer/agent can act on:

* **Value**        — AI-estimated fair value vs the asking price (under/over-priced)
* **Appreciation** — modelled 5-year capital growth
* **Yield**        — estimated gross rental yield
* **Liquidity**    — how quickly the market typically transacts (risk proxy)

Every factor is returned with its weighted contribution, so the score is fully
explainable — not a black box.
"""

from app.schemas.ai import AppreciationRequest, PricePredictionRequest
from app.schemas.intelligence import DealScoreFactor, DealScoreRequest, DealScoreResponse
from app.services.ai import AIService

MODEL_VERSION = "dealscore-v0.1"

# Relative market liquidity (0–100); higher = faster, lower-risk to exit.
_LIQUIDITY = {
    "dubai": 88, "new york": 86, "san francisco": 84, "london": 82, "toronto": 80,
    "vancouver": 78, "austin": 76, "bengaluru": 70, "gurugram": 66, "denver": 74,
}
_WEIGHTS = {"value": 0.35, "appreciation": 0.25, "yield": 0.25, "liquidity": 0.15}


def _clamp(value: float, low: float = 0.0, high: float = 100.0) -> float:
    return max(low, min(high, value))


def compute_deal_score(req: DealScoreRequest) -> DealScoreResponse:
    ai = AIService()

    # Always value against the *sale* model for an apples-to-apples comparison.
    valuation = ai.predict_price(
        PricePredictionRequest(
            city=req.city, state=req.state, country=req.country,
            property_type=req.property_type, listing_type="sale",
            bedrooms=req.bedrooms, bathrooms=req.bathrooms, sqft=req.sqft,
            year_built=req.year_built, amenities=req.amenities,
        )
    )
    predicted = valuation.predicted_price
    asking = req.asking_price
    value_ratio = predicted / asking if asking else 1.0

    # 1) Value: ratio 1.0 -> 70, every +1% fair-value headroom adds ~2 points.
    value_score = _clamp(70 + (value_ratio - 1) * 200)

    # 2) Appreciation (5-yr forecast %).
    appreciation = ai.forecast_appreciation(
        AppreciationRequest(
            city=req.city, state=req.state, country=req.country,
            property_type=req.property_type, listing_type="sale",
            bedrooms=req.bedrooms, bathrooms=req.bathrooms, sqft=req.sqft,
            year_built=req.year_built, amenities=req.amenities,
            current_price=asking,
        )
    )
    appr5 = appreciation.forecast.year5
    appreciation_score = _clamp(appr5 * 3.0)

    # 3) Gross rental yield: estimated annual rent / asking price.
    est_annual_rent = predicted / 20  # monthly ≈ value/240 -> annual = value/20
    gross_yield = (est_annual_rent / asking * 100) if asking else 0.0
    yield_score = _clamp((gross_yield - 2) * 16)

    # 4) Liquidity / risk.
    liquidity_score = float(_LIQUIDITY.get(req.city.lower(), 60))

    scores = {
        "value": value_score,
        "appreciation": appreciation_score,
        "yield": yield_score,
        "liquidity": liquidity_score,
    }
    overall = sum(_WEIGHTS[k] * scores[k] for k in _WEIGHTS)

    factors = [
        DealScoreFactor(
            name="Value vs market",
            score=round(value_score, 1),
            weight=_WEIGHTS["value"],
            contribution=round(_WEIGHTS["value"] * value_score, 1),
            description=f"AI fair value is {value_ratio:.0%} of the asking price.",
        ),
        DealScoreFactor(
            name="Appreciation outlook",
            score=round(appreciation_score, 1),
            weight=_WEIGHTS["appreciation"],
            contribution=round(_WEIGHTS["appreciation"] * appreciation_score, 1),
            description=f"Modelled 5-year growth of ~{appr5:.1f}%.",
        ),
        DealScoreFactor(
            name="Rental yield",
            score=round(yield_score, 1),
            weight=_WEIGHTS["yield"],
            contribution=round(_WEIGHTS["yield"] * yield_score, 1),
            description=f"Estimated gross yield of ~{gross_yield:.1f}%.",
        ),
        DealScoreFactor(
            name="Market liquidity",
            score=round(liquidity_score, 1),
            weight=_WEIGHTS["liquidity"],
            contribution=round(_WEIGHTS["liquidity"] * liquidity_score, 1),
            description="How quickly this market typically transacts (exit risk).",
        ),
    ]

    if overall >= 90:
        grade = "A+"
    elif overall >= 80:
        grade = "A"
    elif overall >= 70:
        grade = "B"
    elif overall >= 60:
        grade = "C"
    else:
        grade = "D"

    if value_ratio >= 1.07:
        verdict = "underpriced"
    elif value_ratio >= 0.95:
        verdict = "fair"
    else:
        verdict = "overpriced"

    return DealScoreResponse(
        deal_score=round(overall, 1),
        grade=grade,
        verdict=verdict,
        predicted_price=round(predicted, 2),
        asking_price=round(asking, 2),
        est_gross_yield=round(gross_yield, 2),
        appreciation_5yr=round(appr5, 1),
        factors=factors,
        summary=(
            f"DealScore {round(overall)} ({grade}) — this listing looks {verdict}. "
            f"AI fair value {value_ratio:.0%} of asking, ~{gross_yield:.1f}% gross yield, "
            f"~{appr5:.1f}% 5-year growth outlook."
        ),
        model_version=MODEL_VERSION,
    )
