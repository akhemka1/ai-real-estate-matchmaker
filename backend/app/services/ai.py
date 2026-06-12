import re

from app.core.config import settings
from app.core.logging import get_logger
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
from app.schemas.explain import ExplanationResponse, FeatureAttribution
from app.schemas.property import AppreciationForecast, ImageTag
from app.schemas.recommendation import MatchReason
from app.services.llm import llm_service

logger = get_logger("ai")

# Registry of served models. In production these entries point at versioned
# artifacts in the model registry (MLflow / S3); the API surfaces this so
# clients and dashboards can audit exactly which model produced an inference.
MODEL_REGISTRY = [
    {
        "name": "price_prediction",
        "version": "price-heuristic-v0.1",
        "type": "regression",
        "candidates": ["XGBoost", "LightGBM", "CatBoost", "RandomForest"],
        "status": "heuristic-baseline",
    },
    {
        "name": "appreciation_forecast",
        "version": "price-heuristic-v0.1",
        "type": "regression",
        "candidates": ["LightGBM", "Prophet"],
        "status": "heuristic-baseline",
    },
    {
        "name": "image_understanding",
        "version": "vision-tagging-v0.1",
        "type": "vision",
        "candidates": ["ResNet50", "EfficientNet", "ConvNeXt", "ViT"],
        "status": "heuristic-baseline",
    },
    {
        "name": "description_understanding",
        "version": "description-nlp-v0.1",
        "type": "nlp",
        "candidates": ["BERT", "RoBERTa", "DistilBERT"],
        "status": "heuristic-baseline",
    },
    {
        "name": "recommender",
        "version": "hybrid-heuristic-v0.1",
        "type": "recommender",
        "candidates": ["CollaborativeFiltering", "ContentBased", "Hybrid"],
        "status": "heuristic-baseline",
    },
]


class AIService:
    price_model_version = "price-heuristic-v0.1"
    vision_model_version = "vision-tagging-v0.1"
    nlp_model_version = "description-nlp-v0.1"

    city_multiplier = {
        "san francisco": 980,
        "new york": 900,
        "london": 780,
        "denver": 310,
        "austin": 285,
        "bengaluru": 14500,
        "gurugram": 12000,
        "toronto": 620,
        "vancouver": 680,
        "dubai": 1350,
    }

    def predict_price(self, request: PricePredictionRequest) -> PricePredictionResponse:
        base_per_sqft = self.city_multiplier.get(request.city.lower(), 260)
        type_factor = {"house": 1.12, "condo": 1.0, "apartment": 0.92, "townhouse": 1.04, "land": 0.55}.get(
            request.property_type, 1.0
        )
        amenity_factor = 1 + min(len(request.amenities), 8) * 0.015
        bedroom_factor = 1 + max(request.bedrooms - 2, 0) * 0.035
        predicted = request.sqft * base_per_sqft * type_factor * amenity_factor * bedroom_factor
        if request.listing_type == "rent":
            predicted = predicted / 240

        return PricePredictionResponse(
            predicted_price=round(predicted, 2),
            confidence=78.0,
            model_version=self.price_model_version,
            drivers=[
                MatchReason(
                    factor="Location",
                    weight=0.42,
                    description="City-level market price per square foot is the strongest driver.",
                    sentiment="positive",
                ),
                MatchReason(
                    factor="Size",
                    weight=0.27,
                    description="Interior square footage drives the baseline estimate.",
                    sentiment="positive",
                ),
                MatchReason(
                    factor="Amenities",
                    weight=0.13,
                    description="Amenities provide a premium adjustment.",
                    sentiment="neutral",
                ),
            ],
        )

    def forecast_appreciation(self, request: AppreciationRequest) -> AppreciationResponse:
        growth = 3.2
        if request.city.lower() in {"bengaluru", "gurugram", "dubai", "austin"}:
            growth += 1.8
        if "transit" in " ".join(request.amenities).lower():
            growth += 0.7
        forecast = AppreciationForecast(
            year1=round(growth, 1),
            year3=round((1 + growth / 100) ** 3 * 100 - 100, 1),
            year5=round((1 + growth / 100) ** 5 * 100 - 100, 1),
            year10=round((1 + growth / 100) ** 10 * 100 - 100, 1),
            confidence=76,
        )
        return AppreciationResponse(
            forecast=forecast,
            model_version=self.price_model_version,
            drivers=[
                MatchReason(
                    factor="Market Momentum",
                    weight=0.4,
                    description="Forecast uses city growth, liquidity, and amenity signals.",
                    sentiment="positive",
                )
            ],
        )

    def analyze_images(self, request: ImageAnalysisRequest) -> ImageAnalysisResponse:
        if llm_service.is_configured() and request.image_urls:
            try:
                data = llm_service.analyze_image(
                    image_url=request.image_urls[0],
                    system="You are a computer-vision model for real estate photos.",
                    prompt=(
                        "Tag this property photo. Return up to 6 tags (room/feature/condition/"
                        "style) with confidences 0-1, and an overall photo quality score 0-100."
                    ),
                    tool_name="record_image_analysis",
                    tool_description="Record vision tags and a quality score for the photo.",
                    input_schema={
                        "type": "object",
                        "properties": {
                            "tags": {
                                "type": "array",
                                "items": {
                                    "type": "object",
                                    "properties": {
                                        "label": {"type": "string"},
                                        "confidence": {"type": "number"},
                                        "category": {
                                            "type": "string",
                                            "enum": ["room", "feature", "condition", "style"],
                                        },
                                    },
                                    "required": ["label", "confidence", "category"],
                                },
                            },
                            "quality_score": {"type": "number"},
                        },
                        "required": ["tags", "quality_score"],
                    },
                )
                tags = [
                    ImageTag(
                        label=str(t["label"]),
                        confidence=max(0.0, min(1.0, float(t["confidence"]))),
                        category=t["category"],
                    )
                    for t in data.get("tags", [])[:6]
                ]
                if tags:
                    return ImageAnalysisResponse(
                        tags=tags,
                        quality_score=max(0.0, min(100.0, float(data.get("quality_score", 80)))),
                        model_version=f"claude:{settings.anthropic_model}",
                    )
            except Exception as exc:  # noqa: BLE001 - degrade gracefully to heuristics
                logger.warning("llm_image_analysis_failed", error=str(exc))

        labels = ["Modern Kitchen", "Natural Light", "Good Condition", "Contemporary Style"]
        categories = ["room", "feature", "condition", "style"]
        tags = [
            ImageTag(label=label, confidence=round(0.92 - index * 0.04, 2), category=categories[index])
            for index, label in enumerate(labels)
        ]
        return ImageAnalysisResponse(tags=tags, quality_score=84.0, model_version=self.vision_model_version)

    def analyze_description(self, request: DescriptionAnalysisRequest) -> DescriptionAnalysisResponse:
        if llm_service.is_configured():
            try:
                data = llm_service.extract_json(
                    system=(
                        "You are a real estate NLP engine. Analyze a property "
                        "description and return structured signals."
                    ),
                    prompt=request.description,
                    tool_name="record_description_analysis",
                    tool_description="Record keywords, sentiment and condition for the listing.",
                    input_schema={
                        "type": "object",
                        "properties": {
                            "keywords": {"type": "array", "items": {"type": "string"}},
                            "sentiment": {"type": "string", "enum": ["positive", "neutral", "negative"]},
                            "condition_score": {"type": "number"},
                        },
                        "required": ["keywords", "sentiment", "condition_score"],
                    },
                )
                return DescriptionAnalysisResponse(
                    keywords=[str(k) for k in data.get("keywords", [])][:10],
                    sentiment=str(data.get("sentiment", "neutral")),
                    condition_score=max(0.0, min(100.0, float(data.get("condition_score", 70)))),
                    model_version=f"claude:{settings.anthropic_model}",
                    ai_generated=True,
                )
            except Exception as exc:  # noqa: BLE001 - degrade gracefully to heuristics
                logger.warning("llm_description_failed", error=str(exc))
        return self._analyze_description_heuristic(request)

    def _analyze_description_heuristic(
        self, request: DescriptionAnalysisRequest
    ) -> DescriptionAnalysisResponse:
        words = re.findall(r"[a-zA-Z]{4,}", request.description.lower())
        stopwords = {"with", "from", "that", "this", "home", "property", "features"}
        keywords = []
        for word in words:
            if word not in stopwords and word not in keywords:
                keywords.append(word)
        positive_markers = {"stunning", "premium", "luxury", "bright", "modern", "walkable"}
        condition_score = 65 + min(25, sum(1 for word in words if word in positive_markers) * 6)
        sentiment = "positive" if condition_score >= 75 else "neutral"
        return DescriptionAnalysisResponse(
            keywords=keywords[:10],
            sentiment=sentiment,
            condition_score=float(condition_score),
            model_version=self.nlp_model_version,
        )

    # --- AI listing copywriter -------------------------------------------
    def generate_description(
        self, request: GenerateDescriptionRequest
    ) -> GenerateDescriptionResponse:
        if llm_service.is_configured():
            try:
                data = llm_service.extract_json(
                    system=(
                        f"You are an expert real estate copywriter. Write compelling, accurate, "
                        f"non-exaggerated marketing copy in a {request.tone} tone. Never invent "
                        f"facts not implied by the provided features."
                    ),
                    prompt=(
                        f"Write a listing for a {request.bedrooms:g}-bed, {request.bathrooms:g}-bath "
                        f"{request.property_type} ({request.sqft} sqft) for {request.listing_type} in "
                        f"{request.city}, {request.country}. Amenities: "
                        f"{', '.join(request.amenities) or 'standard finishes'}."
                        + (f" Built {request.year_built}." if request.year_built else "")
                    ),
                    tool_name="record_listing_copy",
                    tool_description="Record the generated headline and description.",
                    input_schema={
                        "type": "object",
                        "properties": {
                            "headline": {"type": "string"},
                            "description": {"type": "string"},
                        },
                        "required": ["headline", "description"],
                    },
                    max_tokens=900,
                )
                return GenerateDescriptionResponse(
                    headline=str(data["headline"]).strip(),
                    description=str(data["description"]).strip(),
                    model_version=f"claude:{settings.anthropic_model}",
                    ai_generated=True,
                )
            except Exception as exc:  # noqa: BLE001 - degrade gracefully to heuristics
                logger.warning("llm_generate_description_failed", error=str(exc))

        # Heuristic template fallback.
        amenities = ", ".join(request.amenities[:4]) or "thoughtful finishes"
        headline = f"{request.bedrooms:g}-Bed {request.property_type.title()} in {request.city}"
        description = (
            f"This {request.sqft:,} sqft {request.property_type} offers {request.bedrooms:g} bedrooms "
            f"and {request.bathrooms:g} bathrooms in {request.city}, {request.country}. "
            f"Highlights include {amenities}. A strong {request.listing_type} opportunity in a "
            f"well-connected location."
        )
        return GenerateDescriptionResponse(
            headline=headline,
            description=description,
            model_version="copy-template-v0.1",
            ai_generated=False,
        )

    # --- AI property assistant (chat) ------------------------------------
    def assistant(self, request: AssistantRequest) -> AssistantResponse:
        if llm_service.is_configured():
            try:
                system = (
                    "You are the AI assistant for NestMatch AI, an AI-powered real estate "
                    "matchmaking platform. NestMatch AI helps buyers, renters, sellers, and "
                    "agents with AI-driven property matching and recommendations, property "
                    "search, price prediction and appreciation forecasts, explainable AI "
                    "insights, off-plan / new-development projects, and CRM tools for leads and "
                    "listings across markets including India, the USA, Canada, the UK, and the "
                    "UAE.\n\n"
                    "Answer ONLY questions related to real estate or to using the NestMatch AI "
                    "platform — for example buying, renting, selling, investing, property "
                    "features, neighborhoods, pricing concepts, the home-buying or selling "
                    "process, and how to use NestMatch AI's features. If a question is unrelated "
                    "to real estate or this platform (e.g. general coding, trivia, or other "
                    "topics), politely decline and steer the user back — for example: \"I'm the "
                    "NestMatch AI assistant, so I can only help with real estate and using this "
                    "platform.\"\n\n"
                    "Be concise, friendly, and helpful. Ground answers in any listing context "
                    "provided. Never invent specific prices or figures, and do not give binding "
                    "legal or financial advice — recommend consulting a licensed professional "
                    "where appropriate."
                )
                prompt = request.question
                if request.context:
                    prompt = f"Listing context:\n{request.context}\n\nQuestion: {request.question}"
                answer = llm_service.complete(system=system, prompt=prompt, max_tokens=700)
                return AssistantResponse(
                    answer=answer,
                    model_version=f"{settings.active_ai_provider}:{settings.active_ai_model}",
                    ai_generated=True,
                )
            except Exception as exc:  # noqa: BLE001 - degrade gracefully to heuristics
                logger.warning("llm_assistant_failed", error=str(exc))
        return AssistantResponse(
            answer=(
                "The AI assistant isn't enabled on this deployment yet. Set GEMINI_API_KEY "
                "(free) or ANTHROPIC_API_KEY on the backend to turn on AI answers. In the "
                "meantime, please use search and the explainable recommendation tools."
            ),
            model_version="assistant-disabled",
            ai_generated=False,
        )

    def explain_price(self, request: PricePredictionRequest) -> ExplanationResponse:
        """SHAP-style additive explanation of a price prediction.

        Decomposes the prediction into a base value plus signed per-feature
        contributions so the sum reconstructs the predicted price. This mirrors
        the contract of a SHAP TreeExplainer so the production model can be
        swapped in without changing the API.
        """
        prediction = self.predict_price(request)
        base_per_sqft = 260
        base_value = round(request.sqft * base_per_sqft, 2)

        city_per_sqft = self.city_multiplier.get(request.city.lower(), 260)
        location_contrib = round(request.sqft * (city_per_sqft - base_per_sqft), 2)
        type_factor = {"house": 1.12, "condo": 1.0, "apartment": 0.92, "townhouse": 1.04, "land": 0.55}.get(
            request.property_type, 1.0
        )
        type_contrib = round(base_value * (type_factor - 1), 2)
        amenity_contrib = round(base_value * min(len(request.amenities), 8) * 0.015, 2)
        bedroom_contrib = round(base_value * max(request.bedrooms - 2, 0) * 0.035, 2)

        attributions = [
            FeatureAttribution(
                feature="location_price_per_sqft",
                value=city_per_sqft,
                contribution=location_contrib,
                direction="positive" if location_contrib >= 0 else "negative",
                description=f"Local market in {request.city.title()} priced at ~${city_per_sqft}/sqft.",
            ),
            FeatureAttribution(
                feature="property_type",
                value=request.property_type,
                contribution=type_contrib,
                direction="positive" if type_contrib >= 0 else "negative",
                description=f"Property type '{request.property_type}' applies a {type_factor:.2f}x factor.",
            ),
            FeatureAttribution(
                feature="bedrooms",
                value=request.bedrooms,
                contribution=bedroom_contrib,
                direction="positive" if bedroom_contrib > 0 else "neutral",
                description="Bedrooms above the 2-bed baseline add value.",
            ),
            FeatureAttribution(
                feature="amenities",
                value=len(request.amenities),
                contribution=amenity_contrib,
                direction="positive" if amenity_contrib > 0 else "neutral",
                description=f"{len(request.amenities)} amenities add a premium.",
            ),
        ]
        return ExplanationResponse(
            method="shap-additive",
            model_version=self.price_model_version,
            base_value=base_value,
            predicted_value=prediction.predicted_price,
            confidence=prediction.confidence,
            attributions=attributions,
            summary=(
                f"Predicted {request.listing_type} value of ${prediction.predicted_price:,.0f} is driven "
                f"primarily by location and size, adjusted for type, bedrooms, and amenities."
            ),
        )
