import hashlib
import logging
from datetime import datetime
from typing import Optional, Dict, Any
import cv2
import numpy as np

from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select

from ..models.fingerprint import Fingerprint, FingerprintProcessingResult, ProcessingStatus, PatternType, PatternSubtype, EvidenceType, DetailLevel
from ..models.pipeline import PipelineConfig
from ..core.config import settings
from .enhancement import FingerprintEnhancer, EnhancementResult, image_to_bytes, bytes_to_image
from .quality import FingerprintQualityAssessor
from .classification import FingerprintClassifier
from .storage import StorageService
from .gemini_enhancement import get_gemini_enhancer, GeminiEnhancementResult

logger = logging.getLogger(__name__)


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

            # Step 3: Enhancement (try Gemini first, then fall back to OpenCV)
            enhancement_result = await self._enhance_image(
                original_image,
                config,
                fingerprint_id=fingerprint_id,
            )

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
            evidence_type_map = {
                "latent": EvidenceType.LATENT,
                "patent": EvidenceType.PATENT,
                "plastic": EvidenceType.PLASTIC,
                "unknown": EvidenceType.UNKNOWN,
            }
            pattern_map = {
                "arch": PatternType.ARCH,
                "loop": PatternType.LOOP,
                "whorl": PatternType.WHORL,
                "unknown": PatternType.UNKNOWN,
                "partial": PatternType.PARTIAL,
            }
            subtype_map = {
                "plain_arch": PatternSubtype.PLAIN_ARCH,
                "tented_arch": PatternSubtype.TENTED_ARCH,
                "ulnar_loop": PatternSubtype.ULNAR_LOOP,
                "radial_loop": PatternSubtype.RADIAL_LOOP,
                "central_pocket_loop": PatternSubtype.CENTRAL_POCKET_LOOP,
                "double_loop": PatternSubtype.DOUBLE_LOOP,
                "nutant_loop": PatternSubtype.NUTANT_LOOP,
                "plain_whorl": PatternSubtype.PLAIN_WHORL,
                "central_pocket_whorl": PatternSubtype.CENTRAL_POCKET_WHORL,
                "double_loop_whorl": PatternSubtype.DOUBLE_LOOP_WHORL,
                "accidental_whorl": PatternSubtype.ACCIDENTAL_WHORL,
                "composite_whorl": PatternSubtype.COMPOSITE_WHORL,
                "scarred": PatternSubtype.SCARRED,
                "amputated": PatternSubtype.AMPUTATED,
                "bandaged": PatternSubtype.BANDAGED,
                "unknown": PatternSubtype.UNKNOWN,
            }
            detail_level_map = {
                "level_1": DetailLevel.LEVEL_1,
                "level_2": DetailLevel.LEVEL_2,
                "level_3": DetailLevel.LEVEL_3,
            }

            # Evidence type and detail level
            fingerprint.evidence_type = evidence_type_map.get(
                classification_result.evidence_type, EvidenceType.UNKNOWN
            )
            fingerprint.detail_level = detail_level_map.get(
                classification_result.detail_level, DetailLevel.LEVEL_1
            )

            # Primary pattern classification
            fingerprint.pattern_type = pattern_map.get(
                classification_result.pattern_type, PatternType.UNKNOWN
            )
            fingerprint.pattern_subtype = subtype_map.get(
                classification_result.pattern_subtype, PatternSubtype.UNKNOWN
            )
            fingerprint.pattern_confidence = classification_result.confidence
            fingerprint.classification_rationale = classification_result.rationale

            # FBI/NCIC classification codes
            fingerprint.ncic_code = classification_result.ncic_code
            fingerprint.henry_value = classification_result.henry_value
            fingerprint.ridge_count = classification_result.ridge_count

            # Singular points
            fingerprint.core_count = classification_result.core_count
            fingerprint.delta_count = classification_result.delta_count
            fingerprint.core_positions = classification_result.core_positions
            fingerprint.delta_positions = classification_result.delta_positions

            # Minutiae data
            fingerprint.minutiae_count = classification_result.minutiae_count
            fingerprint.minutiae_details = classification_result.minutiae_details

            # Ridge characteristics
            fingerprint.ridge_flow_direction = classification_result.ridge_flow_direction
            fingerprint.ridge_density = classification_result.ridge_density

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

    async def _enhance_image(
        self,
        image: np.ndarray,
        config: Dict[str, Any],
        fingerprint_id: str,
    ) -> EnhancementResult:
        """
        Enhance fingerprint image using Gemini or OpenCV fallback.

        First attempts Gemini-based AI enhancement for superior results.
        Falls back to OpenCV pipeline if Gemini fails or is disabled.
        """
        gemini_used = False
        gemini_success = False

        # Try Gemini enhancement first
        if settings.USE_GEMINI_ENHANCEMENT and settings.GEMINI_API_KEY:
            try:
                logger.info(f"Attempting Gemini enhancement for fingerprint {fingerprint_id}")
                gemini_enhancer = get_gemini_enhancer()
                gemini_result = await gemini_enhancer.enhance_async(image)

                if gemini_result.success:
                    logger.info(f"Gemini enhancement successful for fingerprint {fingerprint_id}")
                    gemini_used = True
                    gemini_success = True

                    # Calculate quality scores
                    quality_before = self._calculate_quality_score(gemini_result.original_image)
                    quality_after = self._calculate_quality_score(gemini_result.enhanced_image)

                    return EnhancementResult(
                        enhanced_image=gemini_result.enhanced_image,
                        quality_score_before=quality_before,
                        quality_score_after=quality_after,
                        quality_improvement=quality_after - quality_before,
                        artifact_risk_level="low",  # Gemini is trained to preserve authenticity
                        artifact_warnings=[],
                        processing_steps=["gemini_enhancement"],
                        ridge_orientation_map=None,
                    )
                else:
                    logger.warning(
                        f"Gemini enhancement failed for {fingerprint_id}: {gemini_result.error_message}"
                    )
                    if not settings.GEMINI_ENHANCEMENT_FALLBACK:
                        raise Exception(f"Gemini enhancement failed: {gemini_result.error_message}")

            except Exception as e:
                logger.error(f"Gemini enhancement error for {fingerprint_id}: {e}")
                if not settings.GEMINI_ENHANCEMENT_FALLBACK:
                    raise

        # Fallback to OpenCV enhancement
        if not gemini_success:
            logger.info(f"Using OpenCV enhancement for fingerprint {fingerprint_id}")
            enhancer = FingerprintEnhancer(config)
            return enhancer.enhance(image)

    def _calculate_quality_score(self, image: np.ndarray) -> float:
        """Calculate fingerprint quality score (0-100)"""
        # Ensure grayscale
        if len(image.shape) == 3:
            gray = cv2.cvtColor(image, cv2.COLOR_BGR2GRAY)
        else:
            gray = image

        scores = []

        # 1. Contrast score
        contrast = gray.std()
        contrast_score = min(contrast / 60 * 100, 100)
        scores.append(contrast_score)

        # 2. Ridge clarity (using gradient magnitude)
        sobelx = cv2.Sobel(gray, cv2.CV_64F, 1, 0, ksize=3)
        sobely = cv2.Sobel(gray, cv2.CV_64F, 0, 1, ksize=3)
        gradient_mag = np.sqrt(sobelx ** 2 + sobely ** 2)
        clarity_score = min(gradient_mag.mean() / 30 * 100, 100)
        scores.append(clarity_score)

        # 3. Noise level (inverse)
        laplacian = cv2.Laplacian(gray, cv2.CV_64F)
        noise_level = laplacian.var()
        noise_score = max(0, 100 - noise_level / 10)
        scores.append(noise_score)

        # Weighted average
        weights = [0.35, 0.40, 0.25]
        quality_score = sum(s * w for s, w in zip(scores, weights))

        return min(max(quality_score, 0), 100)

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
