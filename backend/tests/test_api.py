from app.core.security import verify_password
from app.db.session import SessionLocal
from app.models.user import OrgRole, User, UserRole
from app.repositories.users import UserRepository
from tests.conftest import SAMPLE_PROPERTY, auth_header, signup


def test_signup_creates_org_and_owner(client):
    body = signup(client)
    assert body["access_token"]
    assert body["refresh_token"]
    assert body["user"]["organization_id"]
    assert body["user"]["org_role"] == "owner"


def test_refresh_token_flow(client):
    body = signup(client)
    response = client.post("/api/v1/auth/refresh", json={"refresh_token": body["refresh_token"]})
    assert response.status_code == 200
    assert response.json()["access_token"]


def test_property_crud_and_listing_requires_auth(client):
    token = signup(client)["access_token"]

    # Listing without auth is rejected (tenant isolation).
    assert client.get("/api/v1/properties").status_code == 401

    created = client.post("/api/v1/properties", headers=auth_header(token), json=SAMPLE_PROPERTY)
    assert created.status_code == 201, created.text
    property_id = created.json()["id"]

    listed = client.get("/api/v1/properties?city=Austin", headers=auth_header(token))
    assert listed.status_code == 200
    assert listed.json()["total"] == 1

    fetched = client.get(f"/api/v1/properties/{property_id}", headers=auth_header(token))
    assert fetched.status_code == 200


def test_tenant_isolation_between_orgs(client):
    token_a = signup(client, email="a@example.com", org="Org A")["access_token"]
    token_b = signup(client, email="b@example.com", org="Org B")["access_token"]

    client.post("/api/v1/properties", headers=auth_header(token_a), json=SAMPLE_PROPERTY)

    # Org B must not see Org A's listings.
    listed_b = client.get("/api/v1/properties", headers=auth_header(token_b))
    assert listed_b.status_code == 200
    assert listed_b.json()["total"] == 0


def test_buyer_cannot_create_property(client):
    token = signup(client, email="buyer@example.com", role="buyer")["access_token"]
    response = client.post("/api/v1/properties", headers=auth_header(token), json=SAMPLE_PROPERTY)
    assert response.status_code == 403


def test_recommendations_and_feedback(client):
    token = signup(client)["access_token"]
    client.post("/api/v1/properties", headers=auth_header(token), json=SAMPLE_PROPERTY)

    recs = client.post(
        "/api/v1/recommendations",
        headers=auth_header(token),
        json={"budget": 800000, "preferred_cities": ["Austin"], "amenities": ["Garage"]},
    )
    assert recs.status_code == 200
    data = recs.json()
    assert len(data) == 1
    assert data[0]["reasons"]
    property_id = data[0]["property_id"]

    feedback = client.post(
        "/api/v1/recommendations/feedback",
        headers=auth_header(token),
        json={"property_id": property_id, "feedback": "relevant"},
    )
    assert feedback.status_code == 201


def test_favorites_roundtrip(client):
    token = signup(client)["access_token"]
    pid = client.post("/api/v1/properties", headers=auth_header(token), json=SAMPLE_PROPERTY).json()["id"]

    add = client.post("/api/v1/favorites", headers=auth_header(token), json={"property_id": pid})
    assert add.status_code == 201
    assert client.get("/api/v1/favorites", headers=auth_header(token)).json()[0]["property_id"] == pid
    assert client.delete(f"/api/v1/favorites/{pid}", headers=auth_header(token)).status_code == 200


def test_ai_price_prediction_and_explain(client):
    token = signup(client)["access_token"]
    payload = {
        "city": "Austin",
        "state": "TX",
        "country": "US",
        "property_type": "house",
        "listing_type": "sale",
        "bedrooms": 3,
        "bathrooms": 2,
        "sqft": 1800,
        "amenities": ["Garage"],
    }
    pred = client.post("/api/v1/ai/price-prediction", headers=auth_header(token), json=payload)
    assert pred.status_code == 200
    assert pred.json()["predicted_price"] > 0
    assert pred.json()["model_version"] == "price-heuristic-v0.1"

    explain = client.post(
        "/api/v1/ai/price-prediction/explain", headers=auth_header(token), json=payload
    )
    assert explain.status_code == 200
    body = explain.json()
    assert body["method"] == "shap-additive"
    assert body["attributions"]


def test_ai_requires_auth(client):
    response = client.post("/api/v1/ai/price-prediction", json={})
    assert response.status_code in (401, 422)


def test_api_key_auth_flow(client):
    token = signup(client)["access_token"]
    client.post("/api/v1/properties", headers=auth_header(token), json=SAMPLE_PROPERTY)

    created = client.post(
        "/api/v1/api-keys",
        headers=auth_header(token),
        json={"name": "Integration", "scopes": ["properties:read", "search:read"]},
    )
    assert created.status_code == 201
    raw_key = created.json()["api_key"]

    # Use the API key for a scoped read.
    listed = client.get("/api/v1/properties", headers={"X-API-Key": raw_key})
    assert listed.status_code == 200
    assert listed.json()["total"] == 1

    # API key without ai:invoke scope cannot call AI endpoints.
    blocked = client.post(
        "/api/v1/ai/price-prediction",
        headers={"X-API-Key": raw_key},
        json={
            "city": "Austin",
            "state": "TX",
            "property_type": "house",
            "listing_type": "sale",
            "bedrooms": 3,
            "bathrooms": 2,
            "sqft": 1800,
        },
    )
    assert blocked.status_code == 403


def test_seller_buyer_matching(client):
    token = signup(client, role="agent")["access_token"]
    pid = client.post("/api/v1/properties", headers=auth_header(token), json=SAMPLE_PROPERTY).json()["id"]

    response = client.post(
        "/api/v1/matches", headers=auth_header(token), json={"property_id": pid, "limit": 5}
    )
    assert response.status_code == 200
    assert response.json()["property_id"] == pid
    assert response.json()["model_version"]


def test_org_usage_and_plans(client):
    token = signup(client)["access_token"]
    usage = client.get("/api/v1/organizations/current/usage", headers=auth_header(token))
    assert usage.status_code == 200
    metrics = {q["metric"] for q in usage.json()["quotas"]}
    assert {"seats", "properties", "ai_calls", "api_keys"} <= metrics

    plans = client.get("/api/v1/organizations/plans")
    assert plans.status_code == 200
    assert any(p["code"] == "enterprise" for p in plans.json()["plans"])


def test_health_and_readiness(client):
    assert client.get("/health").json()["status"] == "ok"
    assert client.get("/health/ready").json()["status"] == "ready"
    assert client.get("/version").json()["version"]


def test_password_is_stored_hashed_not_plaintext(client):
    signup(client, email="secure@example.com")
    db = SessionLocal()
    try:
        user = UserRepository(db).get_by_email("secure@example.com")
        assert user is not None
        # The stored value must NOT be the plaintext password...
        assert user.hashed_password != "Password123!"
        # ...it must be a bcrypt hash ($2a/$2b/$2y$)...
        assert user.hashed_password.startswith("$2")
        # ...and it must verify against the original password.
        assert verify_password("Password123!", user.hashed_password)
        assert not verify_password("WrongPassword", user.hashed_password)
        assert user.auth_provider == "local"
    finally:
        db.close()


def test_database_stores_at_least_1000_members(client):
    body = signup(client, email="owner@bigco.example", org="BigCo")
    org_id = body["user"]["organization_id"]
    db = SessionLocal()
    try:
        shared_hash = UserRepository(db).get_by_email("owner@bigco.example").hashed_password
        members = [
            User(
                organization_id=org_id,
                email=f"member{i:05d}@bigco.example",
                hashed_password=shared_hash,
                first_name="Member",
                last_name=f"{i}",
                role=UserRole.buyer,
                org_role=OrgRole.member,
                auth_provider="local",
            )
            for i in range(1000)
        ]
        db.add_all(members)
        db.commit()
        total = UserRepository(db).count_for_org(org_id)
        assert total >= 1000
    finally:
        db.close()


def test_set_property_images(client):
    token = signup(client, role="agent")["access_token"]
    pid = client.post("/api/v1/properties", headers=auth_header(token), json=SAMPLE_PROPERTY).json()["id"]

    urls = [f"https://cdn.example.com/p/{i}.jpg" for i in range(3)]
    res = client.put(
        f"/api/v1/properties/{pid}/images",
        headers=auth_header(token),
        json={"images": urls},
    )
    assert res.status_code == 200
    assert res.json()["images"] == urls


def test_image_upload_url_requires_storage_config(client):
    token = signup(client, role="agent")["access_token"]
    pid = client.post("/api/v1/properties", headers=auth_header(token), json=SAMPLE_PROPERTY).json()["id"]

    res = client.post(
        f"/api/v1/properties/{pid}/images/upload-url",
        headers=auth_header(token),
        json={"filename": "photo.jpg", "content_type": "image/jpeg"},
    )
    # No S3 configured in tests -> reports 503 (not configured), API stays healthy.
    assert res.status_code == 503


SAMPLE_PROJECT = {
    "name": "Marina Skyline Residences",
    "developer": "Emaar",
    "city": "Dubai",
    "country": "AE",
    "status": "selling",
    "completion": "Q4 2027",
    "price_from": 1850000,
    "currency": "AED",
    "down_payment_pct": 20,
    "during_construction_pct": 40,
    "handover_pct": 40,
    "payment_plan_label": "60 / 40",
    "rental_yield": 7.2,
    "appreciation_5yr": 31.5,
    "unit_types": [{"type": "1 Bedroom", "size_sqft": 760, "price_from": 1850000, "available": 28}],
    "amenities": ["Pool", "Gym"],
    "images": [],
    "description": "Waterfront landmark with a 60/40 plan.",
    "location": {"lat": 25.08, "lng": 55.14, "nearby": ["Marina Mall"]},
}


def test_offplan_project_crud_and_payment_plan(client):
    token = signup(client, role="agent")["access_token"]
    created = client.post("/api/v1/projects", headers=auth_header(token), json=SAMPLE_PROJECT)
    assert created.status_code == 201, created.text
    pid = created.json()["id"]

    assert client.get("/api/v1/projects", headers=auth_header(token)).json()[0]["id"] == pid

    plan = client.post(
        f"/api/v1/projects/{pid}/payment-plan",
        headers=auth_header(token),
        json={"price": 2000000, "installments": 8},
    )
    assert plan.status_code == 200
    body = plan.json()
    assert body["booking"]["amount"] == 400000  # 20%
    assert body["during_construction"]["amount"] == 800000  # 40%
    assert body["handover"]["amount"] == 800000  # 40%
    assert body["per_installment"] == 100000  # 800000 / 8


def test_lead_distribution_modes(client):
    body = signup(client, role="agent")
    token = body["access_token"]
    me = body["user"]["id"]

    # Mode "me" -> assigned to creator.
    client.put("/api/v1/leads/distribution", headers=auth_header(token), json={"mode": "me"})
    lead = client.post(
        "/api/v1/leads",
        headers=auth_header(token),
        json={"name": "Sarah", "email": "sarah@example.com", "source": "Website"},
    )
    assert lead.status_code == 201
    assert lead.json()["assigned_to"] == me

    # Mode "all" -> shared pool (unassigned).
    client.put("/api/v1/leads/distribution", headers=auth_header(token), json={"mode": "all"})
    pooled = client.post(
        "/api/v1/leads",
        headers=auth_header(token),
        json={"name": "Mike", "email": "mike@example.com", "source": "Bayut"},
    )
    assert pooled.json()["assigned_to"] is None
    lid = pooled.json()["id"]

    # Claim + move stage.
    assert client.post(f"/api/v1/leads/{lid}/claim", headers=auth_header(token)).json()["assigned_to"] == me
    moved = client.post(
        f"/api/v1/leads/{lid}/stage", headers=auth_header(token), json={"stage": "qualified"}
    )
    assert moved.json()["stage"] == "qualified"

    stats = client.get("/api/v1/leads/stats", headers=auth_header(token))
    assert stats.status_code == 200
    assert stats.json()["total"] == 2


def test_natural_language_search(client):
    token = signup(client, role="agent")["access_token"]
    client.post("/api/v1/properties", headers=auth_header(token), json=SAMPLE_PROPERTY)

    res = client.post(
        "/api/v1/search/natural",
        headers=auth_header(token),
        json={"query": "modern home in Austin under 900k with smart home"},
    )
    assert res.status_code == 200, res.text
    body = res.json()
    assert body["interpreted"]["filters"].get("max_price") == 900000
    assert body["interpreted"]["filters"].get("city") == "austin"
    assert "Smart Home" in body["interpreted"]["amenities"]
    assert body["total"] >= 1
    assert len(body["results"]) >= 1


def test_similar_properties(client):
    token = signup(client, role="agent")["access_token"]
    pid = client.post("/api/v1/properties", headers=auth_header(token), json=SAMPLE_PROPERTY).json()["id"]
    second = dict(SAMPLE_PROPERTY, title="Another Smart Home in Austin")
    client.post("/api/v1/properties", headers=auth_header(token), json=second)

    res = client.get(f"/api/v1/properties/{pid}/similar", headers=auth_header(token))
    assert res.status_code == 200
    assert res.json()["property_id"] == pid
    assert isinstance(res.json()["results"], list)


def test_deal_score(client):
    token = signup(client, role="agent")["access_token"]
    res = client.post(
        "/api/v1/ai/deal-score",
        headers=auth_header(token),
        json={
            "asking_price": 750000,
            "city": "Austin",
            "state": "TX",
            "property_type": "house",
            "listing_type": "sale",
            "bedrooms": 3,
            "bathrooms": 2,
            "sqft": 1800,
            "amenities": ["Garage"],
        },
    )
    assert res.status_code == 200, res.text
    body = res.json()
    assert 0 <= body["deal_score"] <= 100
    assert body["grade"] in {"A+", "A", "B", "C", "D"}
    assert body["verdict"] in {"underpriced", "fair", "overpriced"}
    assert len(body["factors"]) == 4


def test_ai_copywriter_and_assistant_fallback(client):
    token = signup(client)["access_token"]

    gen = client.post(
        "/api/v1/ai/generate-description",
        headers=auth_header(token),
        json={
            "city": "Austin",
            "property_type": "house",
            "listing_type": "sale",
            "bedrooms": 3,
            "bathrooms": 2,
            "sqft": 1800,
            "amenities": ["Garage", "Pool"],
        },
    )
    assert gen.status_code == 200, gen.text
    body = gen.json()
    assert body["headline"] and body["description"]
    # No ANTHROPIC_API_KEY in tests -> heuristic fallback.
    assert body["ai_generated"] is False

    chat = client.post(
        "/api/v1/ai/assistant",
        headers=auth_header(token),
        json={"question": "What does an off-plan payment plan mean?"},
    )
    assert chat.status_code == 200
    assert chat.json()["ai_generated"] is False


def test_ai_models_reports_provider(client):
    token = signup(client)["access_token"]
    res = client.get("/api/v1/ai/models", headers=auth_header(token))
    assert res.status_code == 200
    body = res.json()
    assert body["provider"] == "heuristic"
    assert body["llm_enabled"] is False
    assert isinstance(body["models"], list)


def test_auth_config_endpoint(client):
    response = client.get("/api/v1/auth/config")
    assert response.status_code == 200
    body = response.json()
    assert "password" in body["providers"]
    # No credentials in test env, so federated providers are reported as disabled.
    assert body["firebase_enabled"] is False
    assert body["supabase_enabled"] is False


def test_supabase_auth_reports_not_configured(client):
    response = client.post(
        "/api/v1/auth/supabase", json={"access_token": "not-a-real-token", "role": "buyer"}
    )
    assert response.status_code == 503


def test_login_requires_existing_account(client):
    # Logging in with credentials that were never registered must fail.
    response = client.post(
        "/api/v1/auth/login", json={"email": "ghost@example.com", "password": "Password123!"}
    )
    assert response.status_code == 401


def test_firebase_auth_reports_not_configured_without_credentials(client):
    response = client.post(
        "/api/v1/auth/firebase", json={"id_token": "not-a-real-token", "role": "buyer"}
    )
    assert response.status_code == 503
