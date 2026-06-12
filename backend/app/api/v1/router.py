from fastapi import APIRouter

from app.api.v1.endpoints import (
    admin,
    ai,
    api_keys,
    auth,
    favorites,
    leads,
    matches,
    organizations,
    projects,
    properties,
    recommendations,
    saved_searches,
    search,
    users,
    webhooks,
)

api_router = APIRouter()
api_router.include_router(auth.router, prefix="/auth", tags=["auth"])
api_router.include_router(organizations.router, prefix="/organizations", tags=["organizations"])
api_router.include_router(users.router, prefix="/users", tags=["users"])
api_router.include_router(api_keys.router, prefix="/api-keys", tags=["api-keys"])
api_router.include_router(properties.router, prefix="/properties", tags=["properties"])
api_router.include_router(projects.router, prefix="/projects", tags=["off-plan-projects"])
api_router.include_router(leads.router, prefix="/leads", tags=["crm-leads"])
api_router.include_router(search.router, prefix="/search", tags=["search"])
api_router.include_router(saved_searches.router, prefix="/saved-searches", tags=["saved-searches"])
api_router.include_router(favorites.router, prefix="/favorites", tags=["favorites"])
api_router.include_router(recommendations.router, prefix="/recommendations", tags=["recommendations"])
api_router.include_router(matches.router, prefix="/matches", tags=["matches"])
api_router.include_router(ai.router, prefix="/ai", tags=["ai"])
api_router.include_router(webhooks.router, prefix="/webhooks", tags=["webhooks"])
api_router.include_router(admin.router, prefix="/admin", tags=["admin"])
