import os
import aiofiles
from typing import Optional
from datetime import datetime
import uuid

from ..core.config import settings


class StorageService:
    """Handles file storage operations (local or S3)"""

    def __init__(self):
        self.use_local = settings.USE_LOCAL_STORAGE
        self.local_path = settings.LOCAL_STORAGE_PATH

        if not self.use_local:
            import boto3
            self.s3_client = boto3.client(
                "s3",
                endpoint_url=settings.S3_ENDPOINT_URL,
                aws_access_key_id=settings.S3_ACCESS_KEY,
                aws_secret_access_key=settings.S3_SECRET_KEY,
                region_name=settings.S3_REGION,
            )

    async def store_original(
        self,
        content: bytes,
        filename: str,
        exhibit_id: str,
        file_hash: str,
    ) -> str:
        """Store original fingerprint image (immutable)"""
        # Generate storage path
        timestamp = datetime.utcnow().strftime("%Y/%m/%d")
        unique_id = str(uuid.uuid4())[:8]
        ext = filename.rsplit(".", 1)[-1] if "." in filename else "png"
        storage_path = f"originals/{timestamp}/{exhibit_id}/{file_hash[:16]}_{unique_id}.{ext}"

        if self.use_local:
            full_path = os.path.join(self.local_path, storage_path)
            os.makedirs(os.path.dirname(full_path), exist_ok=True)

            async with aiofiles.open(full_path, "wb") as f:
                await f.write(content)
        else:
            self.s3_client.put_object(
                Bucket=settings.S3_BUCKET_ORIGINALS,
                Key=storage_path,
                Body=content,
                ContentType=f"image/{ext}",
            )

        return storage_path

    async def store_enhanced(
        self,
        content: bytes,
        fingerprint_id: str,
        preset: str,
        suffix: str = "",
    ) -> str:
        """Store enhanced fingerprint image"""
        timestamp = datetime.utcnow().strftime("%Y/%m/%d")
        unique_id = str(uuid.uuid4())[:8]
        storage_path = f"enhanced/{timestamp}/{fingerprint_id}/{preset}_{unique_id}{suffix}.png"

        if self.use_local:
            full_path = os.path.join(self.local_path, storage_path)
            os.makedirs(os.path.dirname(full_path), exist_ok=True)

            async with aiofiles.open(full_path, "wb") as f:
                await f.write(content)
        else:
            self.s3_client.put_object(
                Bucket=settings.S3_BUCKET_ENHANCED,
                Key=storage_path,
                Body=content,
                ContentType="image/png",
            )

        return storage_path

    async def store_overlay(
        self,
        content: bytes,
        fingerprint_id: str,
        overlay_type: str,  # "ridge_orientation" or "rationale"
    ) -> str:
        """Store overlay images"""
        timestamp = datetime.utcnow().strftime("%Y/%m/%d")
        unique_id = str(uuid.uuid4())[:8]
        storage_path = f"overlays/{timestamp}/{fingerprint_id}/{overlay_type}_{unique_id}.png"

        if self.use_local:
            full_path = os.path.join(self.local_path, storage_path)
            os.makedirs(os.path.dirname(full_path), exist_ok=True)

            async with aiofiles.open(full_path, "wb") as f:
                await f.write(content)
        else:
            self.s3_client.put_object(
                Bucket=settings.S3_BUCKET_ENHANCED,
                Key=storage_path,
                Body=content,
                ContentType="image/png",
            )

        return storage_path

    async def get_file(self, storage_path: str) -> bytes:
        """Retrieve file content"""
        if self.use_local:
            full_path = os.path.join(self.local_path, storage_path)
            async with aiofiles.open(full_path, "rb") as f:
                return await f.read()
        else:
            # Determine bucket based on path
            bucket = (
                settings.S3_BUCKET_ORIGINALS
                if storage_path.startswith("originals/")
                else settings.S3_BUCKET_ENHANCED
            )
            response = self.s3_client.get_object(Bucket=bucket, Key=storage_path)
            return response["Body"].read()

    async def get_presigned_url(
        self,
        storage_path: str,
        expiration: int = 3600,
    ) -> Optional[str]:
        """Generate presigned URL for file access"""
        if self.use_local:
            # For local storage, return a relative path that the API serves
            return f"/api/v1/storage/{storage_path}"
        else:
            bucket = (
                settings.S3_BUCKET_ORIGINALS
                if storage_path.startswith("originals/")
                else settings.S3_BUCKET_ENHANCED
            )
            return self.s3_client.generate_presigned_url(
                "get_object",
                Params={"Bucket": bucket, "Key": storage_path},
                ExpiresIn=expiration,
            )

    async def file_exists(self, storage_path: str) -> bool:
        """Check if file exists"""
        if self.use_local:
            full_path = os.path.join(self.local_path, storage_path)
            return os.path.exists(full_path)
        else:
            bucket = (
                settings.S3_BUCKET_ORIGINALS
                if storage_path.startswith("originals/")
                else settings.S3_BUCKET_ENHANCED
            )
            try:
                self.s3_client.head_object(Bucket=bucket, Key=storage_path)
                return True
            except Exception:
                return False
