from pydantic import BaseModel
from typing import Optional, Dict, Any
from datetime import datetime


class PipelineConfigBase(BaseModel):
    name: str
    display_name: str
    description: Optional[str] = None
    config: Dict[str, Any]
    artifact_risk_level: str = "low"


class PipelineConfigCreate(PipelineConfigBase):
    pass


class PipelineConfigUpdate(BaseModel):
    display_name: Optional[str] = None
    description: Optional[str] = None
    config: Optional[Dict[str, Any]] = None
    artifact_risk_level: Optional[str] = None
    is_active: Optional[bool] = None


class PipelineConfigResponse(PipelineConfigBase):
    id: str
    is_default: bool
    is_active: bool
    version: str
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True


class PipelineVersionResponse(BaseModel):
    id: str
    version: str
    description: Optional[str] = None
    steps: list
    gemini_model: Optional[str] = None
    is_current: bool
    is_deprecated: bool
    created_at: datetime

    class Config:
        from_attributes = True
