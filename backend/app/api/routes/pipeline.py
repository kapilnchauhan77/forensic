from fastapi import APIRouter, Depends, HTTPException, status, Request
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from typing import List

from ...core.database import get_db
from ...core.security import get_current_user_id, require_admin, require_authenticated
from ...models.pipeline import PipelineConfig, PipelineVersion
from ...schemas.pipeline import (
    PipelineConfigCreate,
    PipelineConfigUpdate,
    PipelineConfigResponse,
    PipelineVersionResponse,
)
from ...services.audit import AuditService

router = APIRouter()


@router.get("/configs", response_model=List[PipelineConfigResponse])
async def list_pipeline_configs(
    active_only: bool = True,
    db: AsyncSession = Depends(get_db),
    _: bool = Depends(require_authenticated),
):
    """List all pipeline configurations"""
    query = select(PipelineConfig)
    if active_only:
        query = query.where(PipelineConfig.is_active == True)
    query = query.order_by(PipelineConfig.name)

    result = await db.execute(query)
    configs = result.scalars().all()
    return configs


@router.get("/configs/{config_id}", response_model=PipelineConfigResponse)
async def get_pipeline_config(
    config_id: str,
    db: AsyncSession = Depends(get_db),
    _: bool = Depends(require_authenticated),
):
    """Get pipeline configuration by ID"""
    result = await db.execute(select(PipelineConfig).where(PipelineConfig.id == config_id))
    config = result.scalar_one_or_none()

    if not config:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Pipeline configuration not found",
        )
    return config


@router.post("/configs", response_model=PipelineConfigResponse, status_code=status.HTTP_201_CREATED)
async def create_pipeline_config(
    config_data: PipelineConfigCreate,
    request: Request,
    db: AsyncSession = Depends(get_db),
    current_user_id: str = Depends(get_current_user_id),
    _: bool = Depends(require_admin),
):
    """Create a new pipeline configuration (admin only)"""
    # Check for duplicate name
    result = await db.execute(
        select(PipelineConfig).where(PipelineConfig.name == config_data.name)
    )
    if result.scalar_one_or_none():
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Pipeline configuration with this name already exists",
        )

    config = PipelineConfig(
        name=config_data.name,
        display_name=config_data.display_name,
        description=config_data.description,
        config=config_data.config,
        artifact_risk_level=config_data.artifact_risk_level,
    )
    db.add(config)
    await db.commit()
    await db.refresh(config)

    await AuditService.log(
        db=db,
        action="pipeline_config_update",
        user_id=current_user_id,
        resource_type="pipeline_config",
        resource_id=config.id,
        details={"action": "create", "name": config.name},
        ip_address=request.client.host if request.client else None,
    )

    return config


@router.patch("/configs/{config_id}", response_model=PipelineConfigResponse)
async def update_pipeline_config(
    config_id: str,
    config_data: PipelineConfigUpdate,
    request: Request,
    db: AsyncSession = Depends(get_db),
    current_user_id: str = Depends(get_current_user_id),
    _: bool = Depends(require_admin),
):
    """Update pipeline configuration (admin only)"""
    result = await db.execute(select(PipelineConfig).where(PipelineConfig.id == config_id))
    config = result.scalar_one_or_none()

    if not config:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Pipeline configuration not found",
        )

    old_config = config.config.copy() if config.config else {}

    update_data = config_data.model_dump(exclude_unset=True)
    for field, value in update_data.items():
        setattr(config, field, value)

    # Increment version if config changed
    if "config" in update_data:
        version_parts = config.version.split(".")
        version_parts[-1] = str(int(version_parts[-1]) + 1)
        config.version = ".".join(version_parts)

    await db.commit()
    await db.refresh(config)

    await AuditService.log(
        db=db,
        action="pipeline_config_update",
        user_id=current_user_id,
        resource_type="pipeline_config",
        resource_id=config.id,
        old_value={"config": old_config},
        new_value={"config": config.config},
        ip_address=request.client.host if request.client else None,
    )

    return config


@router.get("/versions", response_model=List[PipelineVersionResponse])
async def list_pipeline_versions(
    db: AsyncSession = Depends(get_db),
    _: bool = Depends(require_authenticated),
):
    """List all pipeline versions"""
    result = await db.execute(
        select(PipelineVersion).order_by(PipelineVersion.created_at.desc())
    )
    versions = result.scalars().all()
    return versions


@router.get("/versions/current", response_model=PipelineVersionResponse)
async def get_current_pipeline_version(
    db: AsyncSession = Depends(get_db),
    _: bool = Depends(require_authenticated),
):
    """Get current active pipeline version"""
    result = await db.execute(
        select(PipelineVersion).where(PipelineVersion.is_current == True)
    )
    version = result.scalar_one_or_none()

    if not version:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="No current pipeline version found",
        )
    return version
