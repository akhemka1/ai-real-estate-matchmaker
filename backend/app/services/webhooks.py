"""Best-effort outbound webhook delivery with HMAC-SHA256 signatures.

Receivers verify authenticity by recomputing
``HMAC_SHA256(secret, raw_body)`` and comparing it to the ``X-Signature`` header.
Delivery runs on a background task and never blocks the API response.
"""

import hashlib
import hmac
import json

import httpx
from sqlalchemy import select
from sqlalchemy.orm import Session

from app.core.logging import get_logger
from app.db.session import SessionLocal
from app.models.webhook import WebhookEndpoint

logger = get_logger("webhooks")


def sign_payload(secret: str, body: bytes) -> str:
    return hmac.new(secret.encode("utf-8"), body, hashlib.sha256).hexdigest()


def dispatch_event(organization_id: str, event: str, data: dict) -> None:
    """Synchronous worker body — intended to be run via BackgroundTasks.

    Opens its own DB session because the request-scoped session is already
    closed by the time the background task runs.
    """
    db: Session = SessionLocal()
    try:
        endpoints = list(
            db.scalars(
                select(WebhookEndpoint).where(
                    WebhookEndpoint.organization_id == organization_id,
                    WebhookEndpoint.is_active.is_(True),
                )
            ).all()
        )
        if not endpoints:
            return
        payload = {"event": event, "organization_id": organization_id, "data": data}
        body = json.dumps(payload, default=str).encode("utf-8")
        for endpoint in endpoints:
            if event not in (endpoint.events or []):
                continue
            try:
                signature = sign_payload(endpoint.secret, body)
                httpx.post(
                    endpoint.url,
                    content=body,
                    headers={
                        "Content-Type": "application/json",
                        "X-Event": event,
                        "X-Signature": signature,
                    },
                    timeout=5.0,
                )
            except Exception as exc:  # noqa: BLE001 - never let delivery break the app
                logger.warning("webhook_delivery_failed", url=endpoint.url, error=str(exc))
    finally:
        db.close()
