from celery import Celery
from ..core.config import settings

celery_app = Celery(
    "forensic_worker",
    broker=settings.CELERY_BROKER_URL,
    backend=settings.CELERY_RESULT_BACKEND,
    include=["app.workers.tasks"],  # Explicitly include task modules
)

celery_app.conf.update(
    task_serializer="json",
    accept_content=["json"],
    result_serializer="json",
    timezone="UTC",
    enable_utc=True,
    task_track_started=True,
    task_time_limit=600,  # 10 minutes max per task
    worker_prefetch_multiplier=1,  # Process one task at a time
    task_acks_late=True,  # Acknowledge after task completion
)

# Task routing - use default celery queue for simplicity
celery_app.conf.task_routes = {
    "app.workers.tasks.process_fingerprint_task": {"queue": "celery"},
    "app.workers.tasks.batch_process_task": {"queue": "celery"},
}
