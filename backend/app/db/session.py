from collections.abc import Generator

from sqlalchemy import create_engine
from sqlalchemy.orm import DeclarativeBase, Session, sessionmaker

from app.core.config import settings


class Base(DeclarativeBase):
    pass


def _build_engine():
    if settings.is_sqlite:
        # SQLite needs check_same_thread off for the threaded test/dev server.
        connect_args = {"check_same_thread": False}
        # In-memory DBs (used by the test suite) must share one connection across
        # threads, otherwise each connection gets its own empty database.
        if ":memory:" in settings.database_url or settings.database_url in (
            "sqlite://",
            "sqlite:///:memory:",
        ):
            from sqlalchemy.pool import StaticPool

            return create_engine(
                settings.database_url, connect_args=connect_args, poolclass=StaticPool
            )
        return create_engine(
            settings.database_url, pool_pre_ping=True, connect_args=connect_args
        )
    return create_engine(
        settings.database_url,
        pool_pre_ping=True,
        pool_size=settings.db_pool_size,
        max_overflow=settings.db_max_overflow,
        pool_recycle=settings.db_pool_recycle_seconds,
    )


engine = _build_engine()
SessionLocal = sessionmaker(bind=engine, expire_on_commit=False, autoflush=False)


def get_db() -> Generator[Session, None, None]:
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()


def create_db_and_tables() -> None:
    from app.db import base  # noqa: F401

    Base.metadata.create_all(bind=engine)
