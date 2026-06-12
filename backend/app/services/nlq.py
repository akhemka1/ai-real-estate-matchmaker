"""Natural-language query understanding.

Turns a phrase like *"modern 3-bed condo under $900k in Austin with a pool"* into
structured search filters plus a free-text remainder used for semantic ranking.
Deterministic, dependency-free, and fully explainable — every extraction is
surfaced back to the client so the UI can show how the query was interpreted.
"""

import re
from dataclasses import dataclass, field

_PROPERTY_TYPES = ["townhouse", "apartment", "house", "condo", "land"]
_AMENITY_KEYWORDS = {
    "pool": "Pool",
    "garage": "Garage",
    "garden": "Garden",
    "gym": "Gym",
    "balcony": "Balcony",
    "parking": "Parking",
    "fireplace": "Fireplace",
    "smart home": "Smart Home",
    "waterfront": "Waterfront",
    "rooftop": "Rooftop",
    "concierge": "Concierge",
    "view": "View",
    "terrace": "Terrace",
}
_UNIT = {"k": 1_000, "m": 1_000_000, "cr": 10_000_000, "lakh": 100_000, "l": 100_000}


@dataclass
class ParsedQuery:
    filters: dict = field(default_factory=dict)
    amenities: list[str] = field(default_factory=list)
    free_text: str = ""
    interpreted: list[str] = field(default_factory=list)


def _to_number(raw: str, unit: str | None) -> float:
    value = float(raw.replace(",", ""))
    if unit:
        value *= _UNIT.get(unit.lower(), 1)
    return value


def parse_natural_query(text: str) -> ParsedQuery:
    t = f" {text.lower()} "
    parsed = ParsedQuery()

    def grab(match: re.Match | None, label: str) -> None:
        if match:
            parsed.interpreted.append(label)

    # Max price: "under 900k", "below $1.2m", "up to 500000"
    m = re.search(r"(?:under|below|max|less than|up\s?to|upto|cheaper than)\s*\$?\s*([\d.,]+)\s*(k|m|cr|lakh|l)?", t)
    if m:
        parsed.filters["max_price"] = _to_number(m.group(1), m.group(2))
        grab(m, f"max price ≤ {int(parsed.filters['max_price']):,}")

    # Min price: "over 500k", "at least 1m"
    m = re.search(r"(?:over|above|min|at least|starting|from)\s*\$?\s*([\d.,]+)\s*(k|m|cr|lakh|l)?", t)
    if m:
        parsed.filters["min_price"] = _to_number(m.group(1), m.group(2))
        grab(m, f"min price ≥ {int(parsed.filters['min_price']):,}")

    # Bedrooms: "3 bed", "3+ bedroom", "2 bhk", "studio"
    m = re.search(r"(\d+)\s*\+?\s*(?:bed(?:room)?s?|bhk|br)\b", t)
    if m:
        parsed.filters["bedrooms"] = float(m.group(1))
        grab(m, f"{m.group(1)}+ bedrooms")
    elif " studio " in t:
        parsed.filters["bedrooms"] = 0.0
        parsed.interpreted.append("studio")

    # Bathrooms
    m = re.search(r"(\d+)\s*\+?\s*(?:bath(?:room)?s?|ba)\b", t)
    if m:
        parsed.filters["bathrooms"] = float(m.group(1))
        grab(m, f"{m.group(1)}+ bathrooms")

    # Listing type
    if re.search(r"\b(rent|rental|lease|renting)\b", t):
        parsed.filters["listing_type"] = "rent"
        parsed.interpreted.append("for rent")
    elif re.search(r"\b(buy|sale|purchase|own|investment)\b", t):
        parsed.filters["listing_type"] = "sale"
        parsed.interpreted.append("for sale")

    # Property type
    for pt in _PROPERTY_TYPES:
        m = re.search(rf"\b{pt}s?\b", t)
        if m:
            parsed.filters["property_type"] = pt
            grab(m, f"type: {pt}")
            break

    # City: "in <City>" up to a delimiter keyword
    m = re.search(r"\bin\s+([a-z][a-z\s]+?)(?=\s+(?:under|over|with|for|near|that|which|and|$))", t)
    if m:
        city = m.group(1).strip()
        if 1 < len(city) <= 40:
            parsed.filters["city"] = city
            grab(m, f"city: {city.title()}")

    # Amenities
    for keyword, label in _AMENITY_KEYWORDS.items():
        if keyword in t:
            parsed.amenities.append(label)
    if parsed.amenities:
        parsed.interpreted.append("amenities: " + ", ".join(parsed.amenities))

    # Free text = original minus the recognised structural keywords; the
    # descriptive remainder ("modern", "bright", "walkable") drives semantic rank.
    cleaned = re.sub(
        r"\b(under|below|max|over|above|min|in|with|for|rent|rental|sale|buy|bed|bedroom|bedrooms|"
        r"bath|bathroom|bhk|br|\$?\d[\d.,]*\s*(?:k|m|cr|lakh|l)?)\b",
        " ",
        text.lower(),
    )
    parsed.free_text = re.sub(r"\s+", " ", cleaned).strip()
    return parsed


_FILTER_KEYS = ("min_price", "max_price", "bedrooms", "bathrooms", "property_type", "listing_type", "city")


def _parse_with_llm(text: str) -> ParsedQuery:
    """Use Claude to extract structured search filters from free text."""
    from app.services.llm import llm_service

    data = llm_service.extract_json(
        system=(
            "You parse a real estate search query into structured filters. Only include a field "
            "if the user clearly expressed it. Put descriptive lifestyle words (modern, bright, "
            "walkable, etc.) into free_text for semantic ranking."
        ),
        prompt=text,
        tool_name="parse_search_query",
        tool_description="Record the structured filters extracted from the query.",
        input_schema={
            "type": "object",
            "properties": {
                "city": {"type": "string"},
                "min_price": {"type": "number"},
                "max_price": {"type": "number"},
                "bedrooms": {"type": "number"},
                "bathrooms": {"type": "number"},
                "property_type": {
                    "type": "string",
                    "enum": ["house", "condo", "apartment", "townhouse", "land"],
                },
                "listing_type": {"type": "string", "enum": ["sale", "rent"]},
                "amenities": {"type": "array", "items": {"type": "string"}},
                "free_text": {"type": "string"},
            },
        },
    )
    filters = {k: data[k] for k in _FILTER_KEYS if data.get(k) not in (None, "")}
    if isinstance(filters.get("city"), str):
        filters["city"] = filters["city"].strip().lower()
    interpreted = [f"{k}: {v}" for k, v in filters.items()]
    amenities = [str(a) for a in data.get("amenities", [])]
    if amenities:
        interpreted.append("amenities: " + ", ".join(amenities))
    return ParsedQuery(
        filters=filters,
        amenities=amenities,
        free_text=str(data.get("free_text", "")),
        interpreted=interpreted,
    )


def smart_parse_query(text: str) -> ParsedQuery:
    """Parse with Claude when configured; otherwise use the deterministic regex parser."""
    from app.services.llm import llm_service

    if llm_service.is_configured():
        try:
            return _parse_with_llm(text)
        except Exception:  # noqa: BLE001 - degrade gracefully to the regex parser
            pass
    return parse_natural_query(text)
