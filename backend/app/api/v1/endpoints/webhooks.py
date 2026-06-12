import secrets
from typing import Annotated

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy import select

from app.api.deps import CurrentOrg, DbSession, require_org_roles
from app.models.user import User
from app.models.webhook import WebhookEndpoint
from app.schemas.common import APIMessage
from app.schemas.webhook import WEBHOOK_EVENTS, WebhookCreate, WebhookCreated, WebhookRead

router = APIRouter()


@router.get("", response_model=list[WebhookRead])
def list_webhooks(
    db: DbSession,
    org: CurrentOrg,
    _: Annotated[User, Depends(require_org_roles("owner", "admin"))],
) -> list[WebhookRead]:
    rows = db.scalars(
        select(WebhookEndpoint).where(WebhookEndpoint.organization_id == org.id)
    ).all()
    return [WebhookRead.model_validate(row) for row in rows]


@router.post("", response_model=WebhookCreated, status_code=status.HTTP_201_CREATED)
def create_webhook(
    payload: WebhookCreate,
    db: DbSession,
    org: CurrentOrg,
    _: Annotated[User, Depends(require_org_roles("owner", "admin"))],
) -> WebhookCreated:
    invalid = set(payload.events) - set(WEBHOOK_EVENTS)
    if invalid:
        raise HTTPException(
            status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
            detail=f"Unknown events: {', '.join(sorted(invalid))}",
        )
    secret = f"whsec_{secrets.token_urlsafe(32)}"
    endpoint = WebhookEndpoint(
        organization_id=org.id, url=str(payload.url), secret=secret, events=payload.events
    )
    db.add(endpoint)
    db.commit()
    db.refresh(endpoint)
    data = WebhookRead.model_validate(endpoint).model_dump()
    return WebhookCreated(**data, secret=secret)


@router.delete("/{webhook_id}", response_model=APIMessage)
def delete_webhook(
    webhook_id: str,
    db: DbSession,
    org: CurrentOrg,
    _: Annotated[User, Depends(require_org_roles("owner", "admin"))],
) -> APIMessage:
    endpoint = db.get(WebhookEndpoint, webhook_id)
    if endpoint is None or endpoint.organization_id != org.id:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Webhook not found")
    db.delete(endpoint)
    db.commit()
    return APIMessage(message="Webhook deleted")
