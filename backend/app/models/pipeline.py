from sqlalchemy import Column, String, DateTime, JSON, Boolean, Text, Integer
from datetime import datetime
import uuid

from ..core.database import Base


class PipelineConfig(Base):
    """Stores enhancement pipeline configurations/presets"""
    __tablename__ = "pipeline_configs"

    id = Column(String, primary_key=True, default=lambda: str(uuid.uuid4()))
    name = Column(String, unique=True, nullable=False)  # e.g., "latent", "rolled_plain", "aggressive"
    display_name = Column(String, nullable=False)
    description = Column(Text, nullable=True)

    # Configuration
    config = Column(JSON, nullable=False)  # Full pipeline parameters

    # Metadata
    is_default = Column(Boolean, default=False)
    is_active = Column(Boolean, default=True)
    artifact_risk_level = Column(String, default="low")  # "low", "medium", "high"

    # Versioning
    version = Column(String, nullable=False, default="1.0.0")

    # Timestamps
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)


class PipelineVersion(Base):
    """Tracks pipeline code versions for reproducibility"""
    __tablename__ = "pipeline_versions"

    id = Column(String, primary_key=True, default=lambda: str(uuid.uuid4()))
    version = Column(String, unique=True, nullable=False)  # Semantic versioning
    description = Column(Text, nullable=True)

    # Code reference
    git_commit_hash = Column(String, nullable=True)

    # Processing steps included
    steps = Column(JSON, nullable=False)  # List of step names and order

    # Model references
    gemini_model = Column(String, nullable=True)
    prompt_template_hash = Column(String(64), nullable=True)

    # Status
    is_current = Column(Boolean, default=False)
    is_deprecated = Column(Boolean, default=False)

    # Timestamps
    created_at = Column(DateTime, default=datetime.utcnow)
    deprecated_at = Column(DateTime, nullable=True)


# Default pipeline configurations
DEFAULT_PIPELINE_CONFIGS = [
    {
        "name": "latent",
        "display_name": "Latent Print",
        "description": "Optimized for latent prints from crime scenes with aggressive noise reduction and contrast enhancement",
        "artifact_risk_level": "medium",
        "config": {
            "denoise": {
                "enabled": True,
                "method": "bilateral",
                "d": 9,
                "sigma_color": 75,
                "sigma_space": 75
            },
            "contrast": {
                "enabled": True,
                "method": "clahe",
                "clip_limit": 3.0,
                "tile_grid_size": [8, 8]
            },
            "gabor_filter": {
                "enabled": True,
                "ksize": 31,
                "sigma": 4.0,
                "theta_count": 16,
                "lambd": 10.0,
                "gamma": 0.5
            },
            "sharpening": {
                "enabled": True,
                "kernel_size": 3,
                "strength": 1.5
            },
            "background_suppression": {
                "enabled": True,
                "method": "adaptive_threshold",
                "block_size": 11,
                "c": 2
            }
        }
    },
    {
        "name": "rolled_plain",
        "display_name": "Rolled/Plain Print",
        "description": "Standard enhancement for high-quality rolled or plain prints",
        "artifact_risk_level": "low",
        "config": {
            "denoise": {
                "enabled": True,
                "method": "bilateral",
                "d": 5,
                "sigma_color": 50,
                "sigma_space": 50
            },
            "contrast": {
                "enabled": True,
                "method": "clahe",
                "clip_limit": 2.0,
                "tile_grid_size": [8, 8]
            },
            "gabor_filter": {
                "enabled": True,
                "ksize": 21,
                "sigma": 3.0,
                "theta_count": 8,
                "lambd": 8.0,
                "gamma": 0.5
            },
            "sharpening": {
                "enabled": True,
                "kernel_size": 3,
                "strength": 1.0
            },
            "background_suppression": {
                "enabled": False
            }
        }
    },
    {
        "name": "aggressive",
        "display_name": "Aggressive Enhancement",
        "description": "Maximum enhancement for very poor quality prints. WARNING: May introduce artifacts",
        "artifact_risk_level": "high",
        "config": {
            "denoise": {
                "enabled": True,
                "method": "nlmeans",
                "h": 12,
                "template_window_size": 7,
                "search_window_size": 21
            },
            "contrast": {
                "enabled": True,
                "method": "clahe",
                "clip_limit": 4.0,
                "tile_grid_size": [4, 4]
            },
            "gabor_filter": {
                "enabled": True,
                "ksize": 41,
                "sigma": 5.0,
                "theta_count": 24,
                "lambd": 12.0,
                "gamma": 0.4
            },
            "sharpening": {
                "enabled": True,
                "kernel_size": 5,
                "strength": 2.0
            },
            "background_suppression": {
                "enabled": True,
                "method": "adaptive_threshold",
                "block_size": 15,
                "c": 3
            },
            "morphological": {
                "enabled": True,
                "operation": "close",
                "kernel_size": 3
            }
        }
    }
]
