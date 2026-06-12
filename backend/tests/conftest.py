import os

# Force a shared in-memory database for deterministic, isolated tests (no file
# locking from background tasks). Overrides any DATABASE_URL in the environment.
os.environ["DATABASE_URL"] = "sqlite://"
# Force AI off so tests are deterministic and never make real Claude calls.
os.environ["ANTHROPIC_API_KEY"] = ""
os.environ.setdefault("JWT_SECRET_KEY", "test-secret-key-for-ci-only")
os.environ.setdefault("ENVIRONMENT", "local")
os.environ.setdefault("RATE_LIMIT_ENABLED", "false")
os.environ.setdefault("LOG_JSON", "false")

import pytest
from fastapi.testclient import TestClient

import app.db.base  # noqa: F401  (register models)
from app.db.session import Base, engine
from app.main import app


@pytest.fixture(autouse=True)
def reset_database():
    Base.metadata.drop_all(bind=engine)
    Base.metadata.create_all(bind=engine)
    yield
    Base.metadata.drop_all(bind=engine)


@pytest.fixture
def client() -> TestClient:
    return TestClient(app)


# --- Helpers -----------------------------------------------------------------
def signup(client, *, email="agent@example.com", role="agent", org="Acme Realty"):
    response = client.post(
        "/api/v1/auth/signup",
        json={
            "email": email,
            "password": "Password123!",
            "first_name": "Jordan",
            "last_name": "Lee",
            "role": role,
            "organization_name": org,
        },
    )
    assert response.status_code == 201, response.text
    return response.json()


def auth_header(token: str) -> dict:
    return {"Authorization": f"Bearer {token}"}


SAMPLE_PROPERTY = {
    "title": "Test Smart Home",
    "description": "Modern home with smart upgrades and excellent walkability.",
    "price": 750000,
    "bedrooms": 3,
    "bathrooms": 2,
    "sqft": 1800,
    "property_type": "house",
    "listing_type": "sale",
    "address": {
        "street": "1 Main St",
        "city": "Austin",
        "state": "TX",
        "zip_code": "78701",
        "country": "US",
        "lat": 30.2672,
        "lng": -97.7431,
    },
    "images": [],
    "amenities": ["Smart Home", "Garage"],
}
