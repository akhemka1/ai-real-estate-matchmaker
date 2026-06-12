# Next-Gen AI Real Estate Matchmaker — Backend

Production-grade, **multi-tenant B2B SaaS** API for the Next-Gen AI Real Estate
Matchmaker. Built with FastAPI to be sold to and operated by many real estate
companies (brokerages, agencies, marketplaces), each isolated as its own
organization (tenant) with its own users, listings, plan, quotas, and API keys.

> One deployment → thousands of customer organizations, each with isolated data.

---

## Highlights

| Capability | What it gives a customer |
|---|---|
| **Multi-tenancy** | Every record is scoped to an `organization_id`; tenants never see each other's data. |
| **Auth** | JWT access + refresh tokens (RS-style registered claims), optional Firebase federated login, and B2B **API keys** with scopes. |
| **RBAC** | Domain roles (buyer/renter/seller/agent/admin) + workspace roles (owner/admin/member) + platform superuser. |
| **Plans & quotas** | Trial / Starter / Growth / Enterprise with metered seats, listings, AI calls, and API keys. |
| **AI services** | Price prediction, appreciation forecast, image & description understanding, all versioned via a model registry. |
| **Explainable AI** | SHAP-style additive attributions for prices and rule-based attributions for recommendations. |
| **Recommendations** | Hybrid recommender (content-based + collaborative engagement signal). |
| **Lead matching** | Seller→buyer matching with confidence scores and reasons. |
| **Engagement** | Favorites and saved searches that feed the collaborative signal. |
| **Webhooks** | Signed (HMAC-SHA256) outbound events for `property.*`, `match.created`, etc. |
| **Security** | Rate limiting, security headers (OWASP), audit log, request correlation ids. |
| **Observability** | Prometheus `/metrics`, structured JSON logs, liveness/readiness probes. |
| **Ops** | Alembic migrations, multi-stage non-root Docker image, Docker Compose, GitHub Actions CI. |

---

## Architecture

```text
            React / Next.js UI            Partner servers (B2B)
                   │ Bearer JWT                   │ X-API-Key
                   ▼                              ▼
        ┌─────────────────────────────────────────────────┐
        │                 FastAPI API Gateway              │
        │  middleware: request-id → rate-limit → security  │
        │  deps: auth → tenant resolution → RBAC/scopes    │
        └───────────────┬──────────────────────────────────┘
                        │
     ┌──────────────────┼─────────────────────────────────┐
     ▼                  ▼                                  ▼
  Domain services   Repositories (tenant-scoped)     AI services
  (recs, matching,  ──► PostgreSQL (SQLAlchemy)       (price, vision,
   usage, signals)  ──► Redis (cache, rate limit)      nlp, explain)
                    ──► MongoDB (docs, model artifacts)
```

- **API layer** (`app/api`) — routers + dependencies (auth, tenancy, RBAC, scopes, quota).
- **Services** (`app/services`) — recommendations, lead matching, usage/quota, signals, AI, webhooks.
- **Repositories** (`app/repositories`) — all data access, **always scoped by organization**.
- **Models** (`app/models`) — SQLAlchemy 2.0 ORM, every domain table carries `organization_id`.
- **Core** (`app/core`) — config, security, plans, logging, rate limiting, middleware.

---

## Folder structure

```text
backend/
├── app/
│   ├── api/
│   │   ├── deps.py                 # auth, tenancy, RBAC, scopes, quota deps
│   │   └── v1/
│   │       ├── router.py
│   │       └── endpoints/          # auth, organizations, users, api_keys,
│   │                               # properties, search, saved_searches,
│   │                               # favorites, recommendations, matches,
│   │                               # ai, webhooks, admin
│   ├── core/                       # config, security, plans, logging,
│   │                               # rate_limit, middleware
│   ├── db/                         # session, base, mixins, redis, mongo
│   ├── models/                     # organization, user, property, api_key,
│   │                               # engagement, match, usage, audit, webhook
│   ├── repositories/               # tenant-scoped data access
│   ├── schemas/                    # Pydantic request/response models
│   ├── services/                   # business + AI logic
│   └── main.py                     # app factory, middleware, health, metrics
├── alembic/                        # migrations (baseline included)
├── scripts/seed.py                 # demo tenant + users + listings + signals
├── tests/                          # pytest suite (14 tests)
├── Dockerfile                      # multi-stage, non-root, gunicorn+uvicorn
├── docker-compose.yml              # api + postgres + mongo + redis
└── pyproject.toml
```

---

## Run locally (SQLite, zero external services)

```powershell
cd backend
Copy-Item .env.example .env
pip install -e ".[dev]"
python scripts/seed.py
uvicorn app.main:app --reload
```

- API docs (Swagger): http://localhost:8000/docs
- ReDoc: http://localhost:8000/redoc
- Health: http://localhost:8000/health  • Readiness: http://localhost:8000/health/ready
- Metrics: http://localhost:8000/metrics

Seeded logins (password `Password123!`):
- `agent@example.com` — org owner of **Skyline Realty**
- `admin@matchmaker.ai` — platform superuser

## Run with Docker (Postgres + Mongo + Redis)

```powershell
cd backend
Copy-Item .env.example .env
docker compose up --build
```

## Tests & lint

```powershell
pytest
ruff check app
```

---

## Authentication

Two schemes, unified behind one tenant-aware principal:

1. **Bearer JWT** — interactive users.
   ```http
   Authorization: Bearer <access_token>
   ```
   Get tokens via `POST /api/v1/auth/signup` (provisions an org + owner) or
   `POST /api/v1/auth/login`. Refresh with `POST /api/v1/auth/refresh`.

2. **API key** — server-to-server integrations.
   ```http
   X-API-Key: resk_live_xxxx.xxxxxxxx
   ```
   Create scoped keys at `POST /api/v1/api-keys` (owner/admin only). The raw key
   is returned **once**; only a SHA-256 hash is stored.

3. **Google Firebase** — federated sign-in (Google account, etc.). See below.

### Google Firebase login

The frontend signs the user in with the Firebase SDK, then exchanges the Firebase
ID token for our internal JWT:

```text
Frontend (Firebase SDK) ──ID token──► POST /api/v1/auth/firebase
  └─ backend verifies the token with Firebase Admin (check_revoked=True)
  └─ creates/links the local user (auth_provider="firebase") + an organization
  └─ returns the same access/refresh TokenResponse as password login
```

Enable it by setting **either** credential source in `.env`:

```bash
FIREBASE_PROJECT_ID=your-project-id
# Option A: inline JSON (good for secret managers)
FIREBASE_CREDENTIALS_JSON={"type":"service_account", ...}
# Option B: path to a service-account file
FIREBASE_SERVICE_ACCOUNT_PATH=/run/secrets/firebase.json
```

The frontend can call `GET /api/v1/auth/config` (public) to learn whether
Firebase is enabled and should render the Google button.

### Supabase (stores user logins & credentials)

Two ways to use Supabase, independently or together:

1. **Database** — store every user + credential in Supabase Postgres by pointing
   `DATABASE_URL` at the Supabase connection string, then `alembic upgrade head`:
   ```bash
   DATABASE_URL=postgresql+psycopg://postgres:<password>@db.<ref>.supabase.co:5432/postgres
   ```
   No code change — the ORM is standard PostgreSQL.

2. **Supabase Auth** — let Supabase manage credentials and exchange its access
   token for the backend JWT. Set `SUPABASE_JWT_SECRET` (Project Settings → API →
   JWT Secret); the frontend then posts the Supabase access token to
   `POST /api/v1/auth/supabase`, which links/creates the local tenant user
   (`auth_provider="supabase"`, `supabase_uid`).

## Passwords & data storage

- **Passwords are stored hashed, never in plaintext.** On signup/login we persist
  a **salted bcrypt hash** in `users.hashed_password` (per-password random salt +
  tunable work factor — the OWASP-recommended scheme). The plaintext is never
  written to disk or logs. Firebase users carry no usable password.
- **Database of choice: PostgreSQL.** User, organization, and listing data is
  relational with strict integrity requirements (foreign keys, uniqueness,
  transactions), so PostgreSQL is the production datastore. It comfortably stores
  far more than 1,000 members — millions of rows per table — with indexing on
  every tenant/email/foreign-key column.
  - MongoDB is used for unstructured AI artifacts (image metadata, model
    explanations); Redis for caching and rate limiting.
  - SQLite is the **local-only** zero-setup fallback; the app warns if it is used
    in a production environment.
- **Prove the capacity:** load 1,000+ members and verify the count:
  ```powershell
  python scripts/load_members.py 1000     # -> "stores 1000 members"
  ```
  A test (`test_database_stores_at_least_1000_members`) asserts this in CI.

---

## Endpoint summary

**Auth** — `GET /auth/config` · `POST /auth/signup` · `POST /auth/login` · `POST /auth/refresh` · `POST /auth/firebase` · `POST /auth/supabase`
**Organizations** — `GET /organizations/plans` · `GET|PATCH /organizations/current` · `POST /organizations/current/plan` · `GET /organizations/current/usage`
**Users** — `GET|PATCH /users/me` · `GET|POST /users/members`
**API keys** — `GET|POST /api-keys` · `DELETE /api-keys/{id}`
**Properties** — `GET|POST /properties` · `GET|PATCH|DELETE /properties/{id}` · `GET /properties/{id}/similar` (semantic "more like this")
**Search** — `GET /search` · `POST /search/natural` (natural-language understanding + semantic ranking)
**Saved searches** — `GET|POST /saved-searches` · `DELETE /saved-searches/{id}`
**Favorites** — `GET|POST /favorites` · `DELETE /favorites/{property_id}`
**Recommendations** — `POST /recommendations` · `POST /recommendations/feedback`
**Lead matching** — `POST /matches` · `GET /matches/property/{id}`
**AI** — `GET /ai/models` · `POST /ai/price-prediction` · `POST /ai/price-prediction/explain` · `POST /ai/appreciation` · `POST /ai/deal-score` (DealScore™ investment intelligence) · `POST /ai/generate-description` (AI copywriter) · `POST /ai/assistant` (AI chat) · `POST /ai/images/analyze` (vision) · `POST /ai/descriptions/analyze`
**Webhooks** — `GET|POST /webhooks` · `DELETE /webhooks/{id}`
**Admin** — `GET /admin/audit-logs` · `GET /admin/organizations` · `POST /admin/organizations/{id}/suspend|activate`

---

## AI intelligence (Claude)

Real LLM inference via the official **Anthropic** SDK, behind a graceful
fallback so the app runs with or without a key:

- Set `ANTHROPIC_API_KEY` to enable Claude. `ANTHROPIC_MODEL` defaults to
  `claude-opus-4-8`; set `claude-haiku-4-5` (cheapest) or `claude-sonnet-4-6`
  (balanced) for high-volume/cost-sensitive workloads.
- **Without** a key, every AI endpoint falls back to deterministic heuristics —
  nothing breaks, and responses flag `ai_generated: false`.

| Capability | With Claude | Fallback |
|---|---|---|
| `POST /ai/descriptions/analyze` | structured NLP (keywords/sentiment/condition) via forced tool use | keyword heuristic |
| `POST /ai/generate-description` | listing copywriter (headline + body) | template |
| `POST /ai/assistant` | grounded conversational assistant | "configure AI" notice |
| `POST /ai/images/analyze` | **vision** photo tagging | static tags |
| `POST /search/natural` | LLM query → structured filters | regex parser |

All AI calls are plan-quota-metered (`ai_calls`) like the rest of the platform.
Check the active provider/model at `GET /ai/models`.

## Plans & quotas

| Plan | Seats | Listings | AI calls/mo | API keys |
|---|---|---|---|---|
| Trial | 3 | 50 | 500 | 1 |
| Starter | 10 | 1,000 | 10,000 | 3 |
| Growth | 50 | 25,000 | 150,000 | 15 |
| Enterprise | ∞ | ∞ | ∞ | ∞ |

Quotas are enforced on create (`402 Payment Required` when exceeded) and AI usage
is metered per month. See live consumption at `GET /organizations/current/usage`.

---

## Mapping to the master-prompt phases

- **P4 Database design** — `app/models/*`, ER via `organization_id` foreign keys, Alembic baseline.
- **P5 ML design / P9 Explainable AI** — `app/services/{ai,recommendations,matching,signals}.py`, model registry, SHAP/LIME-style attribution schemas.
- **P10 Backend** — FastAPI, JWT auth, user/property/search/recommendation/AI APIs (this service).
- **P12 DevOps/MLOps** — Docker, Compose, GitHub Actions CI, Alembic (model-registry hooks ready).
- **P14 Monitoring** — Prometheus `/metrics`, structured logs, readiness probe.
- **P15 Security** — JWT, RBAC, API keys, rate limiting, OWASP headers, audit log.
- **P16 Scalability** — stateless API (horizontal scale), Redis cache/limit, connection pooling, tenant sharding-ready keys.
- **P17 Testing** — pytest suite covering auth, isolation, RBAC, quotas, AI, API keys, matching.

---

## Production checklist

- [ ] Set a strong `JWT_SECRET_KEY` (`python -c "import secrets;print(secrets.token_urlsafe(64))"`).
- [ ] Point `DATABASE_URL` at managed PostgreSQL (PITR backups, read replicas).
- [ ] Set `ENVIRONMENT=prod`, restrict `ALLOWED_HOSTS` and `BACKEND_CORS_ORIGINS`.
- [ ] Run `alembic upgrade head` on deploy (do not rely on `create_all`).
- [ ] Provide Redis for shared rate limiting across replicas.
- [ ] Configure Firebase (`FIREBASE_*`) only if using federated login.
- [ ] Front with a load balancer / API gateway terminating TLS.
- [ ] Swap heuristic AI services for trained models served from the registry.
