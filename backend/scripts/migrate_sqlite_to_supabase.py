"""Copy all data from the local SQLite database into the target (Supabase) Postgres database.

Prerequisites
-------------
1. Create the schema on the target FIRST so the tables exist:
       # with DATABASE_URL pointed at Supabase (see below)
       alembic upgrade head
2. Then run this script. By default it reads the local SQLite file and writes to
   whatever ``DATABASE_URL`` (the Supabase connection string) is configured in .env.

Usage
-----
    # Uses .env DATABASE_URL as the target (must be Postgres/Supabase):
    python -m scripts.migrate_sqlite_to_supabase

    # Or be explicit about both ends:
    python -m scripts.migrate_sqlite_to_supabase \
        --source "sqlite:///./real_estate_matchmaker.db" \
        --target "postgresql+psycopg://postgres:<password>@db.<ref>.supabase.co:5432/postgres"

Tables are copied in foreign-key dependency order (parents before children), so
referential integrity is preserved. Re-running is safe only against an empty
target; pass --wipe to truncate target tables before copying.
"""

from __future__ import annotations

import argparse

from sqlalchemy import create_engine, delete, insert, select

from app.core.config import settings
from app.db import base  # noqa: F401  -- registers every model on Base.metadata
from app.db.session import Base


def main() -> None:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument(
        "--source",
        default="sqlite:///./real_estate_matchmaker.db",
        help="Source SQLAlchemy URL (default: local SQLite file).",
    )
    parser.add_argument(
        "--target",
        default=settings.database_url,
        help="Target SQLAlchemy URL (default: DATABASE_URL from .env).",
    )
    parser.add_argument(
        "--wipe",
        action="store_true",
        help="Delete existing rows from target tables before copying.",
    )
    args = parser.parse_args()

    if args.target.startswith("sqlite"):
        raise SystemExit(
            "Target is still SQLite. Point DATABASE_URL at Supabase or pass --target "
            "with the Supabase connection string."
        )

    source_engine = create_engine(args.source)
    target_engine = create_engine(args.target)

    tables = list(Base.metadata.sorted_tables)  # FK-dependency order: parents first
    print(f"Copying {len(tables)} tables from\n  {args.source}\nto\n  {args.target}\n")

    total = 0
    with source_engine.connect() as src, target_engine.begin() as dst:
        if args.wipe:
            # Reverse order so children are cleared before parents.
            for table in reversed(tables):
                dst.execute(delete(table))
            print("Wiped existing target rows.\n")

        for table in tables:
            rows = [dict(row._mapping) for row in src.execute(select(table))]
            if not rows:
                print(f"  {table.name:<28} 0 rows")
                continue
            dst.execute(insert(table), rows)
            total += len(rows)
            print(f"  {table.name:<28} {len(rows)} rows copied")

    print(f"\nDone. {total} rows migrated.")


if __name__ == "__main__":
    main()
