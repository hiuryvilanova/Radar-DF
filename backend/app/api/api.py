from fastapi import APIRouter

from app.api.endpoints import (
    auth,
    users,
    cities,
    themes,
    demands,
    meetings,
    attendances,
    actions,
    imports,
    dashboard,
    reports,
    settings,
    audit
)

api_router = APIRouter()

api_router.include_router(auth.router, prefix="/auth", tags=["auth"])
api_router.include_router(users.router, prefix="/users", tags=["users"])
api_router.include_router(cities.router, prefix="/cities", tags=["cities"])
api_router.include_router(themes.router, prefix="/themes", tags=["themes"])
api_router.include_router(demands.router, prefix="/demands", tags=["demands"])
api_router.include_router(meetings.router, prefix="/meetings", tags=["meetings"])
api_router.include_router(attendances.router, prefix="/attendances", tags=["attendances"])
api_router.include_router(actions.router, prefix="/actions", tags=["actions"])
api_router.include_router(imports.router, prefix="/imports", tags=["imports"])
api_router.include_router(dashboard.router, prefix="/dashboard", tags=["dashboard"])
api_router.include_router(reports.router, prefix="/reports", tags=["reports"])
api_router.include_router(settings.router, prefix="/settings", tags=["settings"])
api_router.include_router(audit.router, prefix="/audit", tags=["audit"])
