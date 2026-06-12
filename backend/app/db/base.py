"""Import every model so Base.metadata is fully populated.

Used by Alembic autogenerate and by ``create_db_and_tables`` in local mode.
"""

from app.models.activity import UserActivity
from app.models.api_key import ApiKey
from app.models.audit import AuditLog
from app.models.engagement import Favorite, SavedSearch
from app.models.lead import Lead
from app.models.match import LeadMatch, RecommendationFeedback
from app.models.organization import Organization
from app.models.project import OffPlanProject
from app.models.property import Property
from app.models.usage import UsageRecord
from app.models.user import User
from app.models.webhook import WebhookEndpoint

__all__ = [
    "ApiKey",
    "AuditLog",
    "Favorite",
    "Lead",
    "LeadMatch",
    "OffPlanProject",
    "Organization",
    "Property",
    "RecommendationFeedback",
    "SavedSearch",
    "UsageRecord",
    "User",
    "UserActivity",
    "WebhookEndpoint",
]
