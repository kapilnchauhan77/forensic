from fastapi import APIRouter
from .routes import auth, users, cases, exhibits, fingerprints, pipeline, export

api_router = APIRouter()

api_router.include_router(auth.router, prefix="/auth", tags=["Authentication"])
api_router.include_router(users.router, prefix="/users", tags=["Users"])
api_router.include_router(cases.router, prefix="/cases", tags=["Cases"])
api_router.include_router(exhibits.router, prefix="/exhibits", tags=["Exhibits"])
api_router.include_router(fingerprints.router, prefix="/fingerprints", tags=["Fingerprints"])
api_router.include_router(pipeline.router, prefix="/pipeline", tags=["Pipeline"])
api_router.include_router(export.router, prefix="/export", tags=["Export"])
