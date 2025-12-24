import os
from typing import Optional

from pydantic_settings import BaseSettings


class Settings(BaseSettings):
    # Application
    APP_NAME: str = "Clario"
    APP_VERSION: str = "1.0.0"
    DEBUG: bool = False
    SECRET_KEY: str = "your-secret-key-change-in-production"

    # API
    API_V1_PREFIX: str = "/api/v1"

    # Database
    DATABASE_URL: str = (
        "postgresql+asyncpg://postgres:postgres@localhost:5432/forensic_db"
    )
    DATABASE_SYNC_URL: str = "postgresql://postgres:postgres@localhost:5432/forensic_db"

    # Redis
    REDIS_URL: str = "redis://localhost:6379/0"

    # Celery
    CELERY_BROKER_URL: str = "redis://localhost:6379/0"
    CELERY_RESULT_BACKEND: str = "redis://localhost:6379/0"

    # Object Storage (S3-compatible)
    S3_ENDPOINT_URL: Optional[str] = None  # For MinIO or local S3
    S3_ACCESS_KEY: str = "minioadmin"
    S3_SECRET_KEY: str = "minioadmin"
    S3_BUCKET_ORIGINALS: str = "fingerprint-originals"
    S3_BUCKET_ENHANCED: str = "fingerprint-enhanced"
    S3_REGION: str = "us-east-1"

    # Local storage fallback
    LOCAL_STORAGE_PATH: str = "./storage"
    USE_LOCAL_STORAGE: bool = True  # Set to False for S3

    # Google Gemini
    GEMINI_API_KEY: str = "AIzaSyCz0RPdA-k0pl4vkVOyg762XMGXwj7l1hk"
    GEMINI_MODEL: str = "gemini-2.5-pro"
    GEMINI_IMAGE_MODEL: str = "gemini-3-pro-image-preview"

    # Google Cloud (for Vertex AI)
    GOOGLE_CLOUD_PROJECT: Optional[str] = None
    GOOGLE_CLOUD_LOCATION: str = "us-central1"

    # Enhancement settings
    USE_GEMINI_ENHANCEMENT: bool = True  # Use Gemini for image enhancement
    GEMINI_ENHANCEMENT_FALLBACK: bool = True  # Fall back to OpenCV if Gemini fails

    # Security
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 60 * 24  # 24 hours
    ALGORITHM: str = "HS256"

    # Processing
    MAX_UPLOAD_SIZE_MB: int = 50
    SUPPORTED_IMAGE_FORMATS: list = ["png", "jpg", "jpeg", "tiff", "tif", "bmp"]

    # Enhancement Pipeline
    DEFAULT_ENHANCEMENT_PRESET: str = "rolled_plain"

    class Config:
        env_file = ".env"
        case_sensitive = True


settings = Settings()


# Ensure storage directories exist
if settings.USE_LOCAL_STORAGE:
    os.makedirs(f"{settings.LOCAL_STORAGE_PATH}/originals", exist_ok=True)
    os.makedirs(f"{settings.LOCAL_STORAGE_PATH}/enhanced", exist_ok=True)
    os.makedirs(f"{settings.LOCAL_STORAGE_PATH}/temp", exist_ok=True)
