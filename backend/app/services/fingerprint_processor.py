import hashlib
from datetime import datetime
from typing import Optional, Dict, Any
import cv2
import numpy as np

from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select

from ..models.fingerprint import Fingerprint, FingerprintProcessingResult, ProcessingStatus, PatternType
from ..models.pipeline import PipelineConfig
from ..core.config import settings
from .enhancement import FingerprintEnhancer, image_to_bytes, bytes_to_image
from .quality import FingerprintQualityAssessor
from .classification import FingerprintClassifier
from .storage import StorageService


class FingerprintProcessorService:
    """Orchestrates the fingerprint processing pipeline"""

    PIPELINE_VERSION = "1.0.0"

    def __init__(self, db: AsyncSession):
        self.db = db
        self.storage = StorageService()
        self.quality_assessor = FingerprintQualityAssessor()
        self.classifier = FingerprintClassifier()

    async def process(
        self,
        fingerprint_id: str,
        enhancement_preset: str = "rolled_plain",
        generate_variants: bool = True,
        user_id: Optional[str] = None,
    ) -> Fingerprint:
        """Process a fingerprint through the full pipeline"""
        # Get fingerprint record
        result = await self.db.execute(
            select(Fingerprint).where(Fingerprint.id == fingerprint_id)
        )
        fingerprint = result.scalar_one_or_none()

        if not fingerprint:
            raise ValueError(f"Fingerprint not found: {fingerprint_id}")

        # Update status
        fingerprint.status = ProcessingStatus.PROCESSING
        await self.db.commit()

        try:
            # Load original image
            original_bytes = await self.storage.get_file(fingerprint.original_storage_path)
            original_image = bytes_to_image(original_bytes)

            # Step 1: Quality assessment
            quality_result = self.quality_assessor.assess(original_image)
            fingerprint.quality_score = quality_result.score
            fingerprint.quality_issues = [
                {
                    "code": issue.code,
                    "severity": issue.severity,
                    "description": issue.description,
                }
                for issue in quality_result.issues
            ]
            await self.db.commit()

            # Step 2: Get enhancement config
            config = await self._get_pipeline_config(enhancement_preset)

            # Step 3: Enhancement
            enhancer = FingerprintEnhancer(config)
            enhancement_result = enhancer.enhance(original_image)

            # Step 4: Store enhanced image
            enhanced_bytes = image_to_bytes(enhancement_result.enhanced_image)
            enhanced_hash = hashlib.sha256(enhanced_bytes).hexdigest()

            enhanced_path = await self.storage.store_enhanced(
                content=enhanced_bytes,
                fingerprint_id=fingerprint_id,
                preset=enhancement_preset,
            )

            # Step 5: Store ridge orientation map
            ridge_orientation_path = None
            if enhancement_result.ridge_orientation_map is not None:
                ridge_map_bytes = image_to_bytes(enhancement_result.ridge_orientation_map)
                ridge_orientation_path = await self.storage.store_overlay(
                    content=ridge_map_bytes,
                    fingerprint_id=fingerprint_id,
                    overlay_type="ridge_orientation",
                )

            # Step 6: Classification
            classification_result = self.classifier.classify(
                enhancement_result.enhanced_image,
                quality_score=quality_result.score,
            )

            # Step 7: Generate rationale overlay
            rationale_overlay = self.classifier.generate_rationale_overlay(
                enhancement_result.enhanced_image,
                classification_result,
            )
            rationale_bytes = image_to_bytes(rationale_overlay)
            rationale_path = await self.storage.store_overlay(
                content=rationale_bytes,
                fingerprint_id=fingerprint_id,
                overlay_type="rationale",
            )

            # Step 8: Create processing result record
            processing_result = FingerprintProcessingResult(
                fingerprint_id=fingerprint_id,
                enhanced_storage_path=enhanced_path,
                enhanced_hash_sha256=enhanced_hash,
                pipeline_version=self.PIPELINE_VERSION,
                pipeline_config=config,
                enhancement_preset=enhancement_preset,
                model_name=self.classifier.model.__class__.__name__ if self.classifier.model else "fallback",
                model_version=settings.GEMINI_MODEL if self.classifier.model else "opencv",
                prompt_version=classification_result.prompt_version,
                prompt_hash=classification_result.prompt_hash,
                quality_score_before=enhancement_result.quality_score_before,
                quality_score_after=enhancement_result.quality_score_after,
                quality_improvement=enhancement_result.quality_improvement,
                processing_time_ms=0,  # TODO: Add timing
                artifact_risk_level=enhancement_result.artifact_risk_level,
                artifact_warnings=enhancement_result.artifact_warnings,
                ridge_orientation_map_path=ridge_orientation_path,
                rationale_overlay_path=rationale_path,
                is_primary=True,
            )

            # Mark any existing primary results as non-primary
            existing_results = await self.db.execute(
                select(FingerprintProcessingResult).where(
                    FingerprintProcessingResult.fingerprint_id == fingerprint_id,
                    FingerprintProcessingResult.is_primary == True,
                )
            )
            for existing in existing_results.scalars().all():
                existing.is_primary = False

            self.db.add(processing_result)

            # Update fingerprint with classification results
            pattern_map = {
                "arch": PatternType.ARCH,
                "tented_arch": PatternType.TENTED_ARCH,
                "left_loop": PatternType.LEFT_LOOP,
                "right_loop": PatternType.RIGHT_LOOP,
                "whorl": PatternType.WHORL,
                "unknown": PatternType.UNKNOWN,
                "partial": PatternType.PARTIAL,
            }
            fingerprint.pattern_type = pattern_map.get(
                classification_result.pattern_type, PatternType.UNKNOWN
            )
            fingerprint.pattern_confidence = classification_result.confidence
            fingerprint.classification_rationale = classification_result.rationale
            fingerprint.status = ProcessingStatus.COMPLETED
            fingerprint.processed_at = datetime.utcnow()

            await self.db.commit()

            # Step 9: Generate variants if requested
            if generate_variants:
                await self._generate_variants(
                    fingerprint_id, original_image, enhancement_preset
                )

            return fingerprint

        except Exception as e:
            fingerprint.status = ProcessingStatus.FAILED
            fingerprint.processing_error = str(e)
            await self.db.commit()
            raise

    async def _get_pipeline_config(self, preset: str) -> Dict[str, Any]:
        """Get pipeline configuration for preset"""
        result = await self.db.execute(
            select(PipelineConfig).where(PipelineConfig.name == preset)
        )
        config = result.scalar_one_or_none()

        if config:
            return config.config

        # Return default config if preset not found in database
        from ..models.pipeline import DEFAULT_PIPELINE_CONFIGS

        for default_config in DEFAULT_PIPELINE_CONFIGS:
            if default_config["name"] == preset:
                return default_config["config"]

        # Fallback to rolled_plain
        for default_config in DEFAULT_PIPELINE_CONFIGS:
            if default_config["name"] == "rolled_plain":
                return default_config["config"]

        return {}

    async def _generate_variants(
        self,
        fingerprint_id: str,
        original_image: np.ndarray,
        primary_preset: str,
    ):
        """Generate enhancement variants with different presets"""
        from ..models.pipeline import DEFAULT_PIPELINE_CONFIGS

        variant_presets = [
            config["name"]
            for config in DEFAULT_PIPELINE_CONFIGS
            if config["name"] != primary_preset
        ]

        for preset in variant_presets[:2]:  # Generate up to 2 variants
            try:
                config = await self._get_pipeline_config(preset)
                enhancer = FingerprintEnhancer(config)
                enhancement_result = enhancer.enhance(original_image)

                enhanced_bytes = image_to_bytes(enhancement_result.enhanced_image)
                enhanced_hash = hashlib.sha256(enhanced_bytes).hexdigest()

                enhanced_path = await self.storage.store_enhanced(
                    content=enhanced_bytes,
                    fingerprint_id=fingerprint_id,
                    preset=preset,
                    suffix="_variant",
                )

                processing_result = FingerprintProcessingResult(
                    fingerprint_id=fingerprint_id,
                    enhanced_storage_path=enhanced_path,
                    enhanced_hash_sha256=enhanced_hash,
                    pipeline_version=self.PIPELINE_VERSION,
                    pipeline_config=config,
                    enhancement_preset=preset,
                    quality_score_before=enhancement_result.quality_score_before,
                    quality_score_after=enhancement_result.quality_score_after,
                    quality_improvement=enhancement_result.quality_improvement,
                    artifact_risk_level=enhancement_result.artifact_risk_level,
                    artifact_warnings=enhancement_result.artifact_warnings,
                    is_primary=False,
                )

                self.db.add(processing_result)

            except Exception as e:
                # Log but don't fail on variant generation
                print(f"Failed to generate variant {preset}: {e}")

        await self.db.commit()
