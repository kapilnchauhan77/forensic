from google import genai
from google.genai import types
import json
import hashlib
import base64
from typing import Dict, Any, Optional, List
from dataclasses import dataclass
import cv2
import numpy as np

from ..core.config import settings


@dataclass
class ClassificationResult:
    pattern_type: str
    confidence: float
    rationale: str
    alternative_patterns: List[Dict[str, Any]]
    core_detected: bool
    delta_detected: bool
    raw_response: Dict[str, Any]
    prompt_version: str
    prompt_hash: str


class FingerprintClassifier:
    """Gemini VLM-based fingerprint pattern classification"""

    PROMPT_VERSION = "1.0.0"

    CLASSIFICATION_PROMPT = """You are a forensic fingerprint expert analyzing a fingerprint image.

Analyze this fingerprint image and classify its pattern type. Focus on:
1. Ridge flow direction and patterns
2. Presence and location of core(s) - the innermost recurving ridge
3. Presence and location of delta(s) - triangular ridge patterns

IMPORTANT: This is a forensic application. Be conservative and honest about uncertainty.

Classification options:
- arch: Ridges enter from one side, rise in center, exit other side. No delta or core.
- tented_arch: Similar to arch but with a sharp rise in center. Has one delta.
- left_loop: Ridges enter and exit from the left side. Core and one delta present.
- right_loop: Ridges enter and exit from the right side. Core and one delta present.
- whorl: Circular or spiral pattern. Has two or more deltas.
- unknown: Cannot determine pattern with confidence (partial print, poor quality, smudged).
- partial: Only a portion of the fingerprint is visible, insufficient for classification.

Respond ONLY with valid JSON in this exact format:
{
    "pattern_type": "one of: arch, tented_arch, left_loop, right_loop, whorl, unknown, partial",
    "confidence": 0.0 to 1.0,
    "rationale": "Brief explanation of classification decision, mentioning specific features observed",
    "alternative_patterns": [
        {"pattern": "alternative pattern type", "confidence": 0.0 to 1.0}
    ],
    "core_detected": true or false,
    "delta_detected": true or false,
    "quality_observations": "Any observations about image quality affecting classification"
}

Be conservative with confidence scores:
- Below 0.5: Very uncertain, likely should be "unknown" or "partial"
- 0.5-0.7: Some features visible but not definitive
- 0.7-0.85: Most features clearly visible
- Above 0.85: Very clear pattern with all expected features visible

If the image quality is too poor or the fingerprint is too partial, use "unknown" or "partial" with low confidence and explain why in the rationale."""

    def __init__(self):
        if settings.GEMINI_API_KEY:
            self.client = genai.Client(api_key=settings.GEMINI_API_KEY)
            self.model = settings.GEMINI_MODEL
        else:
            self.client = None
            self.model = None

        self.prompt_hash = hashlib.sha256(
            self.CLASSIFICATION_PROMPT.encode()
        ).hexdigest()[:16]

    def classify(
        self,
        image: np.ndarray,
        ridge_orientation_hints: Optional[np.ndarray] = None,
        quality_score: Optional[float] = None,
    ) -> ClassificationResult:
        """Classify fingerprint pattern using Gemini VLM"""
        if self.client is None:
            return self._fallback_classification(image)

        # Prepare image for API
        if len(image.shape) == 3:
            gray = cv2.cvtColor(image, cv2.COLOR_BGR2GRAY)
        else:
            gray = image.copy()

        # Encode image to base64
        _, buffer = cv2.imencode(".png", gray)
        image_b64 = base64.b64encode(buffer).decode("utf-8")

        # Build prompt with quality context
        prompt = self.CLASSIFICATION_PROMPT
        if quality_score is not None:
            prompt += f"\n\nImage quality score: {quality_score:.1f}/100"
            if quality_score < 40:
                prompt += " (Low quality - be conservative with classification)"

        try:
            # Build content with image and text using new SDK
            contents = [
                types.Content(
                    role="user",
                    parts=[
                        types.Part.from_bytes(
                            data=buffer.tobytes(),
                            mime_type="image/png",
                        ),
                        types.Part.from_text(text=prompt),
                    ],
                ),
            ]

            # Call Gemini API with new SDK
            # Note: Thinking models like gemini-3-pro-preview need higher token limits
            # because they use tokens for reasoning before generating output
            response = self.client.models.generate_content(
                model=self.model,
                contents=contents,
                config=types.GenerateContentConfig(
                    temperature=0.1,
                    max_output_tokens=8192,
                ),
            )

            # Check if response has text
            if not response.text:
                return ClassificationResult(
                    pattern_type="unknown",
                    confidence=0.0,
                    rationale="VLM returned empty response. Using fallback classification.",
                    alternative_patterns=[],
                    core_detected=False,
                    delta_detected=False,
                    raw_response={"error": "empty_response"},
                    prompt_version=self.PROMPT_VERSION,
                    prompt_hash=self.prompt_hash,
                )

            # Parse response
            response_text = response.text.strip()

            # Extract JSON from response (handle markdown code blocks)
            if "```json" in response_text:
                response_text = response_text.split("```json")[1].split("```")[0]
            elif "```" in response_text:
                response_text = response_text.split("```")[1].split("```")[0]

            result_data = json.loads(response_text)

            # Validate and sanitize response
            pattern_type = result_data.get("pattern_type", "unknown").lower()
            valid_patterns = [
                "arch",
                "tented_arch",
                "left_loop",
                "right_loop",
                "whorl",
                "unknown",
                "partial",
            ]
            if pattern_type not in valid_patterns:
                pattern_type = "unknown"

            confidence = float(result_data.get("confidence", 0.0))
            confidence = max(0.0, min(1.0, confidence))

            # Apply quality-based confidence adjustment
            if quality_score is not None and quality_score < 50:
                confidence *= quality_score / 50

            return ClassificationResult(
                pattern_type=pattern_type,
                confidence=confidence,
                rationale=result_data.get("rationale", ""),
                alternative_patterns=result_data.get("alternative_patterns", []),
                core_detected=result_data.get("core_detected", False),
                delta_detected=result_data.get("delta_detected", False),
                raw_response=result_data,
                prompt_version=self.PROMPT_VERSION,
                prompt_hash=self.prompt_hash,
            )

        except json.JSONDecodeError as e:
            # Handle parsing errors
            return ClassificationResult(
                pattern_type="unknown",
                confidence=0.0,
                rationale=f"Failed to parse VLM response: {str(e)}",
                alternative_patterns=[],
                core_detected=False,
                delta_detected=False,
                raw_response={"error": str(e), "raw_text": response_text if 'response_text' in locals() else ""},
                prompt_version=self.PROMPT_VERSION,
                prompt_hash=self.prompt_hash,
            )
        except Exception as e:
            # Handle API errors
            return ClassificationResult(
                pattern_type="unknown",
                confidence=0.0,
                rationale=f"VLM API error: {str(e)}",
                alternative_patterns=[],
                core_detected=False,
                delta_detected=False,
                raw_response={"error": str(e)},
                prompt_version=self.PROMPT_VERSION,
                prompt_hash=self.prompt_hash,
            )

    def _fallback_classification(self, image: np.ndarray) -> ClassificationResult:
        """Fallback classification using OpenCV when VLM is unavailable"""
        if len(image.shape) == 3:
            gray = cv2.cvtColor(image, cv2.COLOR_BGR2GRAY)
        else:
            gray = image.copy()

        # Basic ridge flow analysis
        sobelx = cv2.Sobel(gray, cv2.CV_64F, 1, 0, ksize=3)
        sobely = cv2.Sobel(gray, cv2.CV_64F, 0, 1, ksize=3)

        # Compute orientation
        orientation = 0.5 * np.arctan2(2 * sobelx * sobely, sobelx ** 2 - sobely ** 2)

        # Analyze flow patterns
        h, w = gray.shape
        center_region = orientation[h // 3 : 2 * h // 3, w // 3 : 2 * w // 3]

        # Compute orientation histogram
        hist, _ = np.histogram(center_region.flatten(), bins=18, range=(-np.pi / 2, np.pi / 2))
        dominant_orientation = np.argmax(hist)

        # Very basic heuristic classification
        orientation_variance = center_region.var()

        if orientation_variance > 0.3:
            pattern_type = "whorl"
            confidence = 0.3
        elif dominant_orientation < 6:
            pattern_type = "left_loop"
            confidence = 0.25
        elif dominant_orientation > 12:
            pattern_type = "right_loop"
            confidence = 0.25
        else:
            pattern_type = "arch"
            confidence = 0.2

        return ClassificationResult(
            pattern_type=pattern_type,
            confidence=confidence,
            rationale="Fallback classification using basic ridge flow analysis (VLM unavailable). This is a rough estimate only.",
            alternative_patterns=[
                {"pattern": "unknown", "confidence": 0.5}
            ],
            core_detected=False,
            delta_detected=False,
            raw_response={"method": "fallback_opencv", "orientation_variance": float(orientation_variance)},
            prompt_version="fallback",
            prompt_hash="opencv_fallback",
        )

    def generate_rationale_overlay(
        self,
        image: np.ndarray,
        classification_result: ClassificationResult,
    ) -> np.ndarray:
        """Generate visual overlay highlighting classification rationale"""
        if len(image.shape) == 2:
            overlay = cv2.cvtColor(image, cv2.COLOR_GRAY2BGR)
        else:
            overlay = image.copy()

        h, w = overlay.shape[:2]

        # Add classification label
        label = f"{classification_result.pattern_type.upper()}"
        confidence_text = f"Confidence: {classification_result.confidence:.1%}"

        cv2.rectangle(overlay, (10, 10), (300, 80), (0, 0, 0), -1)
        cv2.putText(
            overlay, label, (20, 40), cv2.FONT_HERSHEY_SIMPLEX, 1.0, (0, 255, 0), 2
        )
        cv2.putText(
            overlay, confidence_text, (20, 70), cv2.FONT_HERSHEY_SIMPLEX, 0.6, (255, 255, 255), 1
        )

        # Add core/delta indicators
        if classification_result.core_detected:
            cv2.putText(
                overlay, "Core: Detected", (20, h - 50), cv2.FONT_HERSHEY_SIMPLEX, 0.5, (0, 255, 255), 1
            )

        if classification_result.delta_detected:
            cv2.putText(
                overlay, "Delta: Detected", (20, h - 30), cv2.FONT_HERSHEY_SIMPLEX, 0.5, (255, 255, 0), 1
            )

        # Draw approximate center region
        center_x, center_y = w // 2, h // 2
        cv2.circle(overlay, (center_x, center_y), 5, (0, 0, 255), -1)
        cv2.circle(overlay, (center_x, center_y), 30, (0, 0, 255), 1)

        return overlay
