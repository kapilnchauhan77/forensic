from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from fastapi.responses import FileResponse
from contextlib import asynccontextmanager
import os

from .core.config import settings
from .core.database import init_db
from .api import api_router


@asynccontextmanager
async def lifespan(app: FastAPI):
    # Startup
    await init_db()
    await seed_default_data()
    yield
    # Shutdown


async def seed_default_data():
    """Seed default pipeline configurations and admin user"""
    from sqlalchemy.ext.asyncio import AsyncSession
    from sqlalchemy import select
    from .core.database import async_session_maker
    from .models.pipeline import PipelineConfig, PipelineVersion, DEFAULT_PIPELINE_CONFIGS
    from .models.user import User, UserRole
    from .core.security import get_password_hash

    async with async_session_maker() as session:
        # Seed pipeline configs
        for config_data in DEFAULT_PIPELINE_CONFIGS:
            result = await session.execute(
                select(PipelineConfig).where(PipelineConfig.name == config_data["name"])
            )
            if not result.scalar_one_or_none():
                config = PipelineConfig(
                    name=config_data["name"],
                    display_name=config_data["display_name"],
                    description=config_data["description"],
                    config=config_data["config"],
                    artifact_risk_level=config_data["artifact_risk_level"],
                    is_default=config_data["name"] == "rolled_plain",
                )
                session.add(config)

        # Seed current pipeline version
        result = await session.execute(
            select(PipelineVersion).where(PipelineVersion.is_current == True)
        )
        if not result.scalar_one_or_none():
            version = PipelineVersion(
                version="1.0.0",
                description="Initial pipeline version",
                steps=[
                    "denoise",
                    "contrast",
                    "gabor_filter",
                    "sharpening",
                    "background_suppression",
                ],
                gemini_model=settings.GEMINI_MODEL,
                is_current=True,
            )
            session.add(version)

        # Seed admin user if no users exist
        result = await session.execute(select(User))
        if not result.scalars().first():
            admin = User(
                email="admin@forensiclab.com",
                username="admin",
                hashed_password=get_password_hash("admin123"),
                full_name="System Administrator",
                role=UserRole.ADMIN,
                agency="System",
            )
            session.add(admin)

        await session.commit()


app = FastAPI(
    title=settings.APP_NAME,
    version=settings.APP_VERSION,
    description="Forensic-grade fingerprint classification and enhancement platform",
    lifespan=lifespan,
)

# CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000", "http://localhost:5173"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# API routes
app.include_router(api_router, prefix=settings.API_V1_PREFIX)


# Serve local storage files
@app.get("/api/v1/storage/{path:path}")
async def serve_storage_file(path: str):
    """Serve files from local storage"""
    if not settings.USE_LOCAL_STORAGE:
        return {"error": "Local storage not enabled"}

    file_path = os.path.join(settings.LOCAL_STORAGE_PATH, path)
    if not os.path.exists(file_path):
        return {"error": "File not found"}

    return FileResponse(file_path)


# Health check
@app.get("/health")
async def health_check():
    return {"status": "healthy", "version": settings.APP_VERSION}


# Root endpoint
@app.get("/")
async def root():
    return {
        "name": settings.APP_NAME,
        "version": settings.APP_VERSION,
        "docs": "/docs",
        "api": settings.API_V1_PREFIX,
    }
