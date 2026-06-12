"""HTTP middleware: correlation ids, access logs, security headers, rate limiting."""

import time
import uuid

import structlog
from starlette.middleware.base import BaseHTTPMiddleware
from starlette.requests import Request
from starlette.responses import JSONResponse, Response

from app.core.config import settings
from app.core.logging import get_logger
from app.core.rate_limit import rate_limiter

logger = get_logger("http")

REQUEST_ID_HEADER = "X-Request-ID"


class RequestContextMiddleware(BaseHTTPMiddleware):
    """Attach a request id, bind it to the log context, and log each request."""

    async def dispatch(self, request: Request, call_next):
        request_id = request.headers.get(REQUEST_ID_HEADER) or uuid.uuid4().hex
        request.state.request_id = request_id
        structlog.contextvars.clear_contextvars()
        structlog.contextvars.bind_contextvars(
            request_id=request_id,
            method=request.method,
            path=request.url.path,
            client=request.client.host if request.client else None,
        )
        start = time.perf_counter()
        try:
            response = await call_next(request)
        except Exception:
            duration_ms = round((time.perf_counter() - start) * 1000, 2)
            logger.exception("request_failed", duration_ms=duration_ms)
            raise
        duration_ms = round((time.perf_counter() - start) * 1000, 2)
        response.headers[REQUEST_ID_HEADER] = request_id
        logger.info("request_completed", status_code=response.status_code, duration_ms=duration_ms)
        return response


class SecurityHeadersMiddleware(BaseHTTPMiddleware):
    """Defense-in-depth response headers (OWASP secure headers)."""

    async def dispatch(self, request: Request, call_next):
        response: Response = await call_next(request)
        response.headers.setdefault("X-Content-Type-Options", "nosniff")
        response.headers.setdefault("X-Frame-Options", "DENY")
        response.headers.setdefault("Referrer-Policy", "strict-origin-when-cross-origin")
        response.headers.setdefault(
            "Permissions-Policy", "geolocation=(), microphone=(), camera=()"
        )
        if settings.is_production:
            response.headers.setdefault(
                "Strict-Transport-Security", "max-age=63072000; includeSubDomains; preload"
            )
        return response


class RateLimitMiddleware(BaseHTTPMiddleware):
    """Global per-client fixed-window rate limit.

    Keyed by authenticated principal when available (Bearer/API key), otherwise
    by client IP. Health and metrics probes are exempt.
    """

    EXEMPT_PATHS = {"/health", "/health/ready", "/health/live", "/metrics"}

    async def dispatch(self, request: Request, call_next):
        if not settings.rate_limit_enabled or request.url.path in self.EXEMPT_PATHS:
            return await call_next(request)

        identity = self._identity(request)
        allowed, count = rate_limiter.hit(
            f"rl:{identity}", settings.rate_limit_per_minute, window_seconds=60
        )
        if not allowed:
            logger.warning("rate_limit_exceeded", identity=identity, count=count)
            return JSONResponse(
                status_code=429,
                content={"detail": "Rate limit exceeded. Please retry shortly."},
                headers={"Retry-After": "60"},
            )
        return await call_next(request)

    @staticmethod
    def _identity(request: Request) -> str:
        auth = request.headers.get("Authorization", "")
        api_key = request.headers.get("X-API-Key", "")
        if api_key:
            return f"key:{api_key[:24]}"
        if auth:
            return f"tok:{hash(auth) & 0xFFFFFFFF:x}"
        return f"ip:{request.client.host if request.client else 'unknown'}"
