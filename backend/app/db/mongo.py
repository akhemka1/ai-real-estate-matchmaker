from functools import lru_cache

from motor.motor_asyncio import AsyncIOMotorClient

from app.core.config import settings


@lru_cache
def get_mongo_client() -> AsyncIOMotorClient:
    return AsyncIOMotorClient(settings.mongodb_url)


def get_mongo_database():
    return get_mongo_client()[settings.mongodb_db]
