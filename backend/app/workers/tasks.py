import asyncio
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker, Session
from typing import List, Optional

from .celery_app import celery_app
from ..core.config import settings
from ..models.fingerprint import Fingerprint, ProcessingStatus
from ..models.audit import AuditLog, AuditAction

# Create sync engine for Celery workers
sync_engine = create_engine(settings.DATABASE_SYNC_URL)
SyncSession = sessionmaker(bind=sync_engine)


def run_async(coro):
    """Helper to run async code in sync context"""
    loop = asyncio.new_event_loop()
    asyncio.set_event_loop(loop)
    try:
        return loop.run_until_complete(coro)
    finally:
        loop.close()


@celery_app.task(bind=True, max_retries=3, default_retry_delay=60)
def process_fingerprint_task(
    self,
    fingerprint_id: str,
    enhancement_preset: str = "rolled_plain",
    generate_variants: bool = True,
    user_id: Optional[str] = None,
    force_process: bool = False,
):
    """Celery task to process a fingerprint"""
    from sqlalchemy.ext.asyncio import AsyncSession, create_async_engine, async_sessionmaker
    from ..services.fingerprint_processor import FingerprintProcessorService

    async def _process():
        async_engine = create_async_engine(settings.DATABASE_URL)
        async_session_maker = async_sessionmaker(
            async_engine, class_=AsyncSession, expire_on_commit=False
        )

        async with async_session_maker() as session:
            try:
                processor = FingerprintProcessorService(session)
                result = await processor.process(
                    fingerprint_id=fingerprint_id,
                    enhancement_preset=enhancement_preset,
                    generate_variants=generate_variants,
                    user_id=user_id,
                    force_process=force_process,
                )
                return {
                    "status": "success",
                    "fingerprint_id": fingerprint_id,
                    "pattern_type": result.pattern_type.value if result.pattern_type else None,
                    "quality_score": result.quality_score,
                }
            except Exception as e:
                # Log the error
                return {
                    "status": "error",
                    "fingerprint_id": fingerprint_id,
                    "error": str(e),
                }
            finally:
                await async_engine.dispose()

    return run_async(_process())


@celery_app.task(bind=True)
def batch_process_task(
    self,
    fingerprint_ids: List[str],
    enhancement_preset: str = "rolled_plain",
    user_id: Optional[str] = None,
):
    """Celery task to batch process fingerprints"""
    results = []

    for fp_id in fingerprint_ids:
        try:
            result = process_fingerprint_task.delay(
                fingerprint_id=fp_id,
                enhancement_preset=enhancement_preset,
                generate_variants=False,  # Skip variants for batch
                user_id=user_id,
            )
            results.append({
                "fingerprint_id": fp_id,
                "task_id": result.id,
                "status": "queued",
            })
        except Exception as e:
            results.append({
                "fingerprint_id": fp_id,
                "status": "error",
                "error": str(e),
            })

    return {
        "batch_size": len(fingerprint_ids),
        "results": results,
    }


@celery_app.task
def cleanup_failed_tasks():
    """Periodic task to clean up stuck processing jobs"""
    from datetime import datetime, timedelta

    with SyncSession() as session:
        # Find fingerprints stuck in processing for more than 30 minutes
        cutoff = datetime.utcnow() - timedelta(minutes=30)

        stuck_fingerprints = session.query(Fingerprint).filter(
            Fingerprint.status == ProcessingStatus.PROCESSING,
            Fingerprint.updated_at < cutoff,
        ).all()

        for fp in stuck_fingerprints:
            fp.status = ProcessingStatus.FAILED
            fp.processing_error = "Processing timeout - task may have failed"

        session.commit()

        return {"cleaned_up": len(stuck_fingerprints)}
