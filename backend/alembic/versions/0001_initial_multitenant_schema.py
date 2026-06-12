"""Initial multi-tenant schema baseline.

This baseline creates the full schema directly from the SQLAlchemy model
metadata so it stays in lock-step with the ORM definitions and is portable
across SQLite (local/dev) and PostgreSQL (production). Subsequent schema
changes should be produced with ``alembic revision --autogenerate``.

Revision ID: 0001_initial
Revises:
Create Date: 2026-06-10
"""

from alembic import op

from app.db.base import *  # noqa: F401,F403  (register all models on Base.metadata)
from app.db.session import Base

# revision identifiers, used by Alembic.
revision = "0001_initial"
down_revision = None
branch_labels = None
depends_on = None


def upgrade() -> None:
    Base.metadata.create_all(bind=op.get_bind())


def downgrade() -> None:
    Base.metadata.drop_all(bind=op.get_bind())
