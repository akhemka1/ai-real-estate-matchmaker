"""Lead distribution: routes a new lead to a team member per the org's mode.

* ``me``       -> the creating user
* ``rotation`` -> fair round-robin across active members (index stored on the org)
* ``all`` / ``first`` -> left in the shared pool (unassigned / claimable)
"""

from sqlalchemy import select
from sqlalchemy.orm import Session

from app.models.organization import Organization
from app.models.user import User


class LeadDistributionService:
    def __init__(self, db: Session):
        self.db = db

    def _members(self, organization_id: str) -> list[User]:
        return list(
            self.db.scalars(
                select(User)
                .where(User.organization_id == organization_id, User.is_active.is_(True))
                .order_by(User.created_at.asc())
            ).all()
        )

    def assign(self, org: Organization, creator_user_id: str) -> str | None:
        mode = org.lead_distribution_mode
        if mode == "me":
            return creator_user_id
        if mode == "rotation":
            members = self._members(org.id)
            if not members:
                return None
            index = org.lead_rotation_index % len(members)
            assignee = members[index].id
            org.lead_rotation_index = (org.lead_rotation_index + 1) % len(members)
            self.db.commit()
            return assignee
        # "all" / "first" -> shared pool
        return None
