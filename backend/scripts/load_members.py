"""Bulk-load members to demonstrate / validate database capacity.

Usage:
    python scripts/load_members.py            # loads 1000 members
    python scripts/load_members.py 5000       # loads 5000 members

Creates (or reuses) a "Capacity Test Org" and inserts N buyer accounts with
securely hashed passwords. PostgreSQL handles this volume (and millions more)
comfortably; this script makes the 1,000+ requirement concrete and repeatable.
"""

import sys
import time

from app.core.security import hash_password
from app.db.session import SessionLocal, create_db_and_tables
from app.models.organization import OrganizationStatus
from app.models.user import OrgRole, User, UserRole
from app.repositories.organizations import OrganizationRepository
from app.repositories.users import UserRepository


def load(count: int = 1000) -> None:
    create_db_and_tables()
    db = SessionLocal()
    try:
        orgs = OrganizationRepository(db)
        org = orgs.get_by_slug("capacity-test-org") or orgs.create(
            "Capacity Test Org", plan_code="enterprise", status=OrganizationStatus.active
        )

        # Hash once and reuse: this is a capacity test for the DB, not the hasher.
        shared_hash = hash_password("Password123!")
        existing = UserRepository(db).count_for_org(org.id)

        start = time.perf_counter()
        batch: list[User] = []
        created = 0
        for i in range(existing, existing + count):
            batch.append(
                User(
                    organization_id=org.id,
                    email=f"member{i:06d}@capacity.test",
                    hashed_password=shared_hash,
                    first_name="Member",
                    last_name=f"{i:06d}",
                    role=UserRole.buyer,
                    org_role=OrgRole.member,
                    auth_provider="local",
                )
            )
            created += 1
            if len(batch) >= 500:
                db.add_all(batch)
                db.commit()
                batch.clear()
        if batch:
            db.add_all(batch)
            db.commit()

        total = UserRepository(db).count_for_org(org.id)
        elapsed = time.perf_counter() - start
        print(f"Inserted {created} members in {elapsed:.2f}s.")
        print(f"'{org.name}' now stores {total} members.")
    finally:
        db.close()


if __name__ == "__main__":
    n = int(sys.argv[1]) if len(sys.argv) > 1 else 1000
    load(n)
