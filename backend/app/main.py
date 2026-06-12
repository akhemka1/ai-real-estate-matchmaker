from contextlib import asynccontextmanager

from fastapi import FastAPI, Request, status
from fastapi.exceptions import RequestValidationError
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from prometheus_fastapi_instrumentator import Instrumentator
from sqlalchemy import text
from starlette.middleware.trustedhost import TrustedHostMiddleware

from app.api.v1.router import api_router
from app.core.config import settings
from app.core.logging import configure_logging, get_logger
from app.core.middleware import (
    RateLimitMiddleware,
    RequestContextMiddleware,
    SecurityHeadersMiddleware,
)
from app.db.session import create_db_and_tables, engine

configure_logging()
logger = get_logger("app")

API_DESCRIPTION = """
Multi-tenant B2B API powering the **Next-Gen AI Real Estate Matchmaker**.

* **Authentication** — Bearer JWT (interactive users) or `X-API-Key` (server-to-server).
* **Tenancy** — every request is isolated to the caller's organization.
* **AI** — price prediction, appreciation, image & description understanding,
  hybrid recommendations, seller↔buyer matching, all with explainable outputs.

Plans, quotas, and usage metering are exposed under `/organizations`.
""".strip()


@asynccontextmanager
async def lifespan(app: FastAPI):
    if settings.environment == "local":
        create_db_and_tables()
    # PostgreSQL is the supported production database. SQLite is only for local
    # zero-setup development; warn loudly if it slips into a deployed env.
    if settings.is_production and settings.is_sqlite:
        logger.warning(
            "sqlite_in_production",
            message="SQLite is not supported in production. Set DATABASE_URL to PostgreSQL.",
        )
    logger.info(
        "api_started",
        environment=settings.environment,
        version=settings.app_version,
        database="postgresql" if not settings.is_sqlite else "sqlite",
        firebase_enabled=bool(
            settings.firebase_credentials_json or settings.firebase_service_account_path
        ),
    )
    yield
    logger.info("api_stopped")


app = FastAPI(
    title=settings.app_name,
    version=settings.app_version,
    description=API_DESCRIPTION,
    openapi_url=f"{settings.api_v1_prefix}/openapi.json",
    docs_url="/docs",
    redoc_url="/redoc",
    lifespan=lifespan,
)

# Middleware order matters: the last added runs first (outermost).
app.add_middleware(SecurityHeadersMiddleware)
app.add_middleware(RateLimitMiddleware)
app.add_middleware(RequestContextMiddleware)
app.add_middleware(
    CORSMiddleware,
    # Pydantic URL types serialize with a trailing slash ("http://localhost:3000/")
    # which never matches the browser's Origin header — strip it so CORS works.
    allow_origins=[str(origin).rstrip("/") for origin in settings.backend_cors_origins],
    # Allow any *.vercel.app deployment (production + preview/deployment-specific
    # URLs) and any localhost port, in addition to the explicit origins above.
    allow_origin_regex=r"https://[a-z0-9-]+\.vercel\.app|http://(localhost|127\.0\.0\.1):\d+",
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
    expose_headers=["X-Request-ID"],
)
if settings.allowed_hosts != ["*"]:
    app.add_middleware(TrustedHostMiddleware, allowed_hosts=settings.allowed_hosts)

app.include_router(api_router, prefix=settings.api_v1_prefix)
Instrumentator().instrument(app).expose(app, endpoint="/metrics", include_in_schema=False)


@app.exception_handler(RequestValidationError)
async def validation_exception_handler(request: Request, exc: RequestValidationError):
    return JSONResponse(
        status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
        content={"detail": exc.errors(), "request_id": getattr(request.state, "request_id", None)},
    )


@app.exception_handler(Exception)
async def unhandled_exception_handler(request: Request, exc: Exception):
    logger.exception("unhandled_exception")
    return JSONResponse(
        status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
        content={
            "detail": "Internal server error",
            "request_id": getattr(request.state, "request_id", None),
        },
    )


@app.get("/health", tags=["health"], summary="Liveness probe")
def health_check() -> dict[str, str]:
    return {"status": "ok", "service": settings.app_name, "version": settings.app_version}


@app.get("/health/live", tags=["health"], summary="Kubernetes liveness probe")
def liveness() -> dict[str, str]:
    return {"status": "alive"}


@app.get("/health/ready", tags=["health"], summary="Kubernetes readiness probe")
def readiness() -> JSONResponse:
    checks: dict[str, str] = {}
    healthy = True
    try:
        with engine.connect() as conn:
            conn.execute(text("SELECT 1"))
        checks["database"] = "ok"
    except Exception as exc:  # noqa: BLE001
        checks["database"] = f"error: {exc}"
        healthy = False
    code = status.HTTP_200_OK if healthy else status.HTTP_503_SERVICE_UNAVAILABLE
    return JSONResponse(status_code=code, content={"status": "ready" if healthy else "degraded", "checks": checks})


@app.get("/version", tags=["health"], summary="Build/version info")
def version() -> dict[str, str]:
    return {
        "name": settings.app_name,
        "version": settings.app_version,
        "environment": settings.environment,
    }
