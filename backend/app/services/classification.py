import base64
import hashlib
import json
from dataclasses import dataclass
from typing import Any, Dict, List, Optional

import cv2
import numpy as np
from google import genai
from google.genai import types

from ..core.config import settings


@dataclass
class SingularPoint:
    """Represents a core or delta position"""

    x: int
    y: int
    point_type: str = ""  # For cores: "loop", "whorl", "spiral"


@dataclass
class MinutiaeDetails:
    """Breakdown of minutiae by type"""

    ridge_endings: int = 0
    bifurcations: int = 0
    short_ridges: int = 0
    dots: int = 0
    islands: int = 0
    other: int = 0


@dataclass
class ClassificationResult:
    # Core classification
    is_fingerprint: bool
    evidence_type: str  # latent, patent, plastic, unknown
    pattern_type: str  # arch, loop, whorl, unknown, partial
    pattern_subtype: str
    confidence: float
    detail_level: str  # level_1, level_2, level_3
    rationale: str
    alternative_patterns: List[Dict[str, Any]]
    core_detected: bool
    delta_detected: bool

    # Detailed forensic data
    ncic_code: str
    henry_value: Optional[int]
    ridge_count: Optional[int]
    core_count: int
    delta_count: int
    core_positions: List[Dict[str, Any]]
    delta_positions: List[Dict[str, Any]]
    minutiae_count: Optional[int]
    minutiae_details: Optional[Dict[str, int]]
    ridge_flow_direction: str
    ridge_density: Optional[float]

    raw_response: Dict[str, Any]
    prompt_version: str
    prompt_hash: str


class FingerprintClassifier:
    """Gemini VLM-based fingerprint pattern classification with FBI/NCIC standards"""

    PROMPT_VERSION = (
        "3.2.0"  # Emphasized delta count as primary classifier to reduce whorl bias
    )

    CLASSIFICATION_PROMPT = """You are a certified forensic fingerprint examiner analyzing a friction ridge impression according to FBI and NCIC standards.

## 1. EVIDENCE TYPE ASSESSMENT
Determine how this print was deposited:
- latent: Invisible/barely visible impression from perspiration/oils (most common in casework)
- patent: Visible print in contrasting substance (blood, ink, grease, dirt, paint)
- plastic: 3D impression in soft material (wax, putty, clay, soap)

## 2. PRIMARY PATTERN CLASSIFICATION (Henry System - Level 1)

**CRITICAL: Classification is determined by DELTA COUNT, not visual appearance!**

Count the deltas FIRST, then classify:
- 0 deltas → ARCH (ridges flow side to side without recurving)
- 1 delta → LOOP (ridges recurve around a core, exit same side they entered)
- 2+ deltas → WHORL (circular/spiral patterns)

Pattern definitions:
- arch: NO delta (0). Ridges enter one side and exit the other WITHOUT recurving.
- loop: ONE delta (1). Ridges recurve around ONE core and exit the SAME side.
- whorl: TWO or more deltas (2+). Circular/spiral formations. MUST have at least 2 deltas.
- unknown: Cannot determine with forensic confidence.
- partial: Insufficient ridge area visible for classification.

**WARNING: Do NOT classify as whorl unless you can identify TWO distinct delta formations!**
A single spiral or circular pattern with only ONE delta is a LOOP (central pocket loop), not a whorl.

## 3. PATTERN SUBTYPE (FBI Extended Classification)

ARCHES (no delta, no core):
- plain_arch: Smooth wave-like ridges
- tented_arch: Sharp upward thrust/spike, may have angular formation (ONE delta possible)

LOOPS (ONE core, ONE delta):
- ulnar_loop: Opens toward ulnar bone (little finger side) - most common
- radial_loop: Opens toward radial bone (thumb side)
- central_pocket_loop: Loop with whorl-like core area
- double_loop: Two separate loop formations
- nutant_loop: Core bent strongly to one side

WHORLS (TWO or more deltas):
- plain_whorl: Concentric circles or smooth spirals
- central_pocket_whorl: Loop formation with obstruction creating second delta
- double_loop_whorl: Two loop formations creating "S" or "Z" pattern, two deltas
- accidental_whorl: Irregular combination that doesn't fit other categories
- composite_whorl: Mixed pattern elements

SPECIAL:
- scarred: Permanent scarring affecting pattern
- amputated: Finger missing or partially missing
- unknown: Cannot determine

## 4. NCIC FINGERPRINT CLASSIFICATION (FPC) CODE
- AA: Plain arch
- TT: Tented arch
- Loops (by ridge count from delta to core): PI/PM/PO (ulnar), II/IM/IO (radial)
  - I=Inner (1-9 ridges), M=Middle (10-13), O=Outer (14+)
- Whorls (by tracing): WI (inner), WM (meeting), WO (outer)
- XX: Scarred
- SR: Amputated
- UP: Unknown pattern

## 5. SINGULAR POINTS ANALYSIS (Level 1)
- Cores: Count (0, 1, or 2), positions (as % from top-left), type (loop/whorl/spiral/tented)
- Deltas: Count (0, 1, 2+), positions

## 6. MINUTIAE ANALYSIS (Level 2) - Estimate counts if visible:
- Ridge endings: Where ridges abruptly terminate
- Bifurcations: Where ridges split into two
- Short ridges: Significantly shorter than neighbors
- Dots: Isolated ridge units
- Islands/enclosures: Ridges that bifurcate and rejoin

## 7. DETAIL LEVEL ASSESSMENT
Based on image quality, indicate highest analysis level achievable:
- level_1: Only overall pattern classification possible
- level_2: Minutiae visible and countable
- level_3: Fine detail (pores, ridge edges) visible

IMPORTANT: This is for forensic court testimony. Be conservative and document uncertainty.

Respond ONLY with valid JSON:
{
    "is_fingerprint": true/false,
    "evidence_type": "latent|patent|plastic|unknown",
    "pattern_type": "arch|loop|whorl|unknown|partial",
    "pattern_subtype": "plain_arch|tented_arch|ulnar_loop|radial_loop|central_pocket_loop|double_loop|nutant_loop|plain_whorl|central_pocket_whorl|double_loop_whorl|accidental_whorl|composite_whorl|scarred|unknown",
    "confidence": 0.0 to 1.0,
    "detail_level": "level_1|level_2|level_3",
    "ncic_code": "AA|TT|PI|PM|PO|II|IM|IO|WI|WM|WO|XX|SR|UP",
    "henry_value": null or integer,
    "rationale": "Detailed explanation referencing specific ridge formations observed",
    "alternative_patterns": [{"pattern": "type", "subtype": "subtype", "confidence": 0.0-1.0}],
    "core_count": 0, 1, or 2,
    "delta_count": 0, 1, 2, or 3,
    "core_positions": [{"x": 0-100, "y": 0-100, "type": "loop|whorl|spiral|tented"}],
    "delta_positions": [{"x": 0-100, "y": 0-100}],
    "ridge_count": null or integer (count between delta and core for loops),
    "ridge_flow_direction": "left_slant|right_slant|vertical|circular|mixed",
    "ridge_density": null or float (ridges per mm, typical: 0.3-0.5),
    "minutiae_count": estimated total count or null,
    "minutiae_details": {
        "ridge_endings": count,
        "bifurcations": count,
        "short_ridges": count,
        "dots": count,
        "islands": count,
        "other": count
    },
    "quality_observations": "Factors affecting analysis (smudging, pressure, clarity, completeness)"
}

CONFIDENCE GUIDELINES:
- Below 0.5: Insufficient for forensic conclusion, use "unknown"
- 0.5-0.7: Tentative classification, note limitations
- 0.7-0.85: Confident classification with minor uncertainty
- Above 0.85: High confidence, all expected features clearly visible"""

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

    def _validate_pattern_consistency(
        self,
        pattern_type: str,
        pattern_subtype: str,
        delta_count: int,
        core_count: int,
        confidence: float,
    ) -> tuple:
        """
        Validate that pattern_type is consistent with delta/core counts.

        The FBI/NCIC classification is determined by delta count:
        - 0 deltas → ARCH
        - 1 delta → LOOP
        - 2+ deltas → WHORL

        If VLM's reported pattern_type doesn't match delta_count, we correct it.

        Returns:
            Tuple of (pattern_type, pattern_subtype, confidence, correction_reason)
        """
        correction_reason = None
        original_pattern = pattern_type

        # WHORL requires 2+ deltas
        if pattern_type == "whorl" and delta_count < 2:
            if delta_count == 1:
                pattern_type = "loop"
                # Central pocket loop looks whorl-like but has only 1 delta
                pattern_subtype = "central_pocket_loop"
                correction_reason = f"Corrected whorl→loop: only {delta_count} delta detected (whorls require 2+)"
            else:  # delta_count == 0
                pattern_type = "arch"
                # Tented arch can look somewhat spiral-like
                pattern_subtype = "tented_arch"
                correction_reason = f"Corrected whorl→arch: no deltas detected (whorls require 2+)"
            confidence *= 0.6  # Reduce confidence for corrected classification

        # ARCH cannot have deltas (by definition)
        elif pattern_type == "arch" and delta_count > 0:
            if delta_count == 1:
                pattern_type = "loop"
                pattern_subtype = "ulnar_loop"
                correction_reason = f"Corrected arch→loop: {delta_count} delta detected (arches have 0)"
            else:  # delta_count >= 2
                pattern_type = "whorl"
                pattern_subtype = "plain_whorl"
                correction_reason = f"Corrected arch→whorl: {delta_count} deltas detected (arches have 0)"
            confidence *= 0.6

        # LOOP should have exactly 1 delta
        elif pattern_type == "loop" and delta_count != 1:
            if delta_count == 0:
                pattern_type = "arch"
                pattern_subtype = "plain_arch"
                correction_reason = f"Corrected loop→arch: no deltas detected (loops have exactly 1)"
            elif delta_count >= 2:
                pattern_type = "whorl"
                pattern_subtype = "double_loop_whorl"
                correction_reason = f"Corrected loop→whorl: {delta_count} deltas detected (loops have exactly 1)"
            confidence *= 0.6

        return pattern_type, pattern_subtype, confidence, correction_reason

    def pre_classify_image(self, image: np.ndarray) -> tuple:
        """
        Pre-classification to determine if image contains a genuine fingerprint.

        This is a separate VLM call that asks a simple yes/no question before
        attempting detailed pattern classification. This helps catch cases where
        the VLM would otherwise hallucinate fingerprint patterns on non-fingerprint images.

        Returns:
            Tuple of (is_genuine_fingerprint: bool, image_type: str, reason: str)
        """
        PRE_CHECK_PROMPT = """Examine this image carefully. Determine if this shows a fingerprint pattern.

Answer with JSON ONLY:
{
    "is_genuine_fingerprint": true or false,
    "image_type": "fingerprint|latent|partial|smudged|decorative_on_object|icon|back_of_hand|document|noise|other",
    "reason": "one sentence explanation"
}

Answer TRUE for any of these:
- Inked fingerprints (rolled or plain impressions)
- Scanned or digital fingerprint images
- Latent prints (crime scene, developed, lifted)
- Partial, smudged, blurred, or degraded fingerprints
- High-contrast or processed fingerprint images
- Forensic fingerprint photos

Answer FALSE only for these specific cases:
- "decorative_on_object" = Fingerprint pattern physically printed ON gloves, clothing, fabric, or products
- "icon" = Small fingerprint icons, logos, or UI elements
- "back_of_hand" = Photo showing the BACK (dorsal) side of a hand with NO actual fingerprint
- "document" = Text documents, forms without fingerprints
- "noise" = Blank, corrupted, or random pattern images

KEY DISTINCTION:
- A standalone fingerprint image (even if stylized/processed) = TRUE
- A fingerprint pattern printed ON an object (glove, shirt, product) = FALSE
- If you see a hand/glove WITH a fingerprint design on it = FALSE
- If you see JUST a fingerprint pattern (no hand/object visible) = TRUE"""

        if self.client is None:
            # No VLM available, assume it could be a fingerprint
            return (True, "unknown", "VLM not available for pre-classification")

        # Prepare image for API
        if len(image.shape) == 3:
            gray = cv2.cvtColor(image, cv2.COLOR_BGR2GRAY)
        else:
            gray = image.copy()

        # Encode image
        _, buffer = cv2.imencode(".png", gray)

        try:
            # Build content with image and text
            contents = [
                types.Content(
                    role="user",
                    parts=[
                        types.Part.from_bytes(
                            data=buffer.tobytes(),
                            mime_type="image/png",
                        ),
                        types.Part.from_text(text=PRE_CHECK_PROMPT),
                    ],
                ),
            ]

            # Call Gemini API
            response = self.client.models.generate_content(
                model=self.model,
                contents=contents,
            )

            print("\n\n\n\n\nGEMINI RESPONSE")
            print(response)
            print("GEMINI RESPONSE\n\n\n\n\n")
            if not response.text:
                # Empty response - allow through since presence detector already validated
                return (
                    True,
                    "empty_response",
                    "VLM returned empty response - allowing through based on presence detection",
                )

            # Parse response
            response_text = response.text.strip()

            # Extract JSON from response
            if "```json" in response_text:
                response_text = response_text.split("```json")[1].split("```")[0]
            elif "```" in response_text:
                response_text = response_text.split("```")[1].split("```")[0]

            result = json.loads(response_text)
            print("\n\n\n\n\nGEMINI RESPONSE RESULT")
            print(result)
            print("GEMINI RESPONSE RESULT\n\n\n\n\n")

            is_genuine = result.get("is_genuine_fingerprint", False)
            image_type = result.get("image_type", "unknown")
            reason = result.get("reason", "No reason provided")

            return (bool(is_genuine), str(image_type), str(reason))

        except json.JSONDecodeError as e:
            # If we can't parse, allow through since presence detector already validated
            return (
                True,
                "parse_error",
                f"Failed to parse VLM response - allowing through: {e}",
            )
        except Exception as e:
            # On any error, allow through to maintain existing behavior
            return (True, "error", f"Pre-classification error: {e}")

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
                    pattern_subtype="unknown",
                    confidence=0.0,
                    rationale="VLM returned empty response. Using fallback classification.",
                    alternative_patterns=[],
                    core_detected=False,
                    delta_detected=False,
                    ncic_code="UP",
                    henry_value=None,
                    ridge_count=None,
                    core_count=0,
                    delta_count=0,
                    core_positions=[],
                    delta_positions=[],
                    minutiae_count=None,
                    minutiae_details=None,
                    ridge_flow_direction="mixed",
                    ridge_density=None,
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
            is_fingerprint = result_data.get("is_fingerprint", True)

            # Validate evidence type
            evidence_type = result_data.get("evidence_type", "unknown").lower()
            valid_evidence_types = ["latent", "patent", "plastic", "unknown"]
            if evidence_type not in valid_evidence_types:
                evidence_type = "unknown"

            # Validate pattern type (now uses simplified: arch, loop, whorl)
            pattern_type = result_data.get("pattern_type", "unknown").lower()
            valid_patterns = [
                "arch",
                "loop",
                "whorl",
                "unknown",
                "partial",
                "not_present",
            ]
            if pattern_type not in valid_patterns:
                pattern_type = "unknown"

            # Validate pattern subtype
            pattern_subtype = result_data.get("pattern_subtype", "unknown").lower()
            valid_subtypes = [
                "plain_arch",
                "tented_arch",
                "ulnar_loop",
                "radial_loop",
                "central_pocket_loop",
                "double_loop",
                "nutant_loop",
                "plain_whorl",
                "central_pocket_whorl",
                "double_loop_whorl",
                "accidental_whorl",
                "composite_whorl",
                "scarred",
                "amputated",
                "bandaged",
                "unknown",
                "not_present",
            ]
            if pattern_subtype not in valid_subtypes:
                pattern_subtype = "unknown"

            # Validate detail level
            detail_level = result_data.get("detail_level", "level_1").lower()
            valid_detail_levels = ["level_1", "level_2", "level_3"]
            if detail_level not in valid_detail_levels:
                detail_level = "level_1"

            confidence = float(result_data.get("confidence", 0.0))
            confidence = max(0.0, min(1.0, confidence))

            # Apply quality-based confidence adjustment
            if quality_score is not None and quality_score < 50:
                confidence *= quality_score / 50

            # Extract detailed forensic data
            core_count = int(result_data.get("core_count", 0))
            delta_count = int(result_data.get("delta_count", 0))
            core_positions = result_data.get("core_positions", [])
            delta_positions = result_data.get("delta_positions", [])

            # Derive core/delta detected from counts
            core_detected = core_count > 0
            delta_detected = delta_count > 0

            # CRITICAL: Validate pattern consistency with delta count
            # The FBI/NCIC classification is determined by delta count, not visual appearance
            rationale = result_data.get("rationale", "")
            (
                pattern_type,
                pattern_subtype,
                confidence,
                correction_reason,
            ) = self._validate_pattern_consistency(
                pattern_type=pattern_type,
                pattern_subtype=pattern_subtype,
                delta_count=delta_count,
                core_count=core_count,
                confidence=confidence,
            )
            if correction_reason:
                import logging
                logging.getLogger(__name__).warning(
                    f"Pattern consistency correction: {correction_reason}"
                )
                rationale = f"[CORRECTED: {correction_reason}] {rationale}"

            # NCIC code validation
            ncic_code = result_data.get("ncic_code", "UP").upper()
            valid_ncic = [
                "AA",
                "TT",
                "PI",
                "PM",
                "PO",
                "II",
                "IM",
                "IO",
                "WI",
                "WM",
                "WO",
                "XX",
                "SR",
                "UP",
            ]
            if ncic_code not in valid_ncic:
                ncic_code = "UP"

            # Ridge flow direction
            ridge_flow = result_data.get("ridge_flow_direction", "mixed").lower()
            valid_flows = ["left_slant", "right_slant", "vertical", "circular", "mixed"]
            if ridge_flow not in valid_flows:
                ridge_flow = "mixed"

            return ClassificationResult(
                is_fingerprint=is_fingerprint,
                evidence_type=evidence_type,
                pattern_type=pattern_type,
                pattern_subtype=pattern_subtype,
                confidence=confidence,
                detail_level=detail_level,
                rationale=result_data.get("rationale", ""),
                alternative_patterns=result_data.get("alternative_patterns", []),
                core_detected=core_detected,
                delta_detected=delta_detected,
                ncic_code=ncic_code,
                henry_value=result_data.get("henry_value"),
                ridge_count=result_data.get("ridge_count"),
                core_count=core_count,
                delta_count=delta_count,
                core_positions=core_positions,
                delta_positions=delta_positions,
                minutiae_count=result_data.get("minutiae_count"),
                minutiae_details=result_data.get("minutiae_details"),
                ridge_flow_direction=ridge_flow,
                ridge_density=result_data.get("ridge_density"),
                raw_response=result_data,
                prompt_version=self.PROMPT_VERSION,
                prompt_hash=self.prompt_hash,
            )

        except json.JSONDecodeError as e:
            # Handle parsing errors
            return ClassificationResult(
                is_fingerprint=False,
                evidence_type="unknown",
                pattern_type="unknown",
                pattern_subtype="unknown",
                confidence=0.0,
                detail_level="level_1",
                rationale=f"Failed to parse VLM response: {str(e)}",
                alternative_patterns=[],
                core_detected=False,
                delta_detected=False,
                ncic_code="UP",
                henry_value=None,
                ridge_count=None,
                core_count=0,
                delta_count=0,
                core_positions=[],
                delta_positions=[],
                minutiae_count=None,
                minutiae_details=None,
                ridge_flow_direction="mixed",
                ridge_density=None,
                raw_response={
                    "error": str(e),
                    "raw_text": response_text if "response_text" in locals() else "",
                },
                prompt_version=self.PROMPT_VERSION,
                prompt_hash=self.prompt_hash,
            )
        except Exception as e:
            # Handle API errors - fall back to OpenCV classification instead of rejecting
            # This prevents API failures from causing false "no fingerprint" results
            import logging

            logging.getLogger(__name__).warning(
                f"VLM API error, using fallback classification: {e}"
            )
            return self._fallback_classification(image)

    def _detect_singular_points_poincare(
        self, image: np.ndarray
    ) -> tuple[list, list]:
        """
        Detect singular points (cores and deltas) using Poincare index method.

        The Poincare index is computed by summing orientation changes around a point:
        - Core (loop center): Poincare index = +180° (or +π)
        - Delta (triangular point): Poincare index = -180° (or -π)
        - Regular ridge: Poincare index = 0°

        Returns:
            Tuple of (core_points, delta_points) where each is list of (x, y) tuples
        """
        if len(image.shape) == 3:
            gray = cv2.cvtColor(image, cv2.COLOR_BGR2GRAY)
        else:
            gray = image.copy()

        h, w = gray.shape

        # Compute gradient
        sobelx = cv2.Sobel(gray, cv2.CV_64F, 1, 0, ksize=3)
        sobely = cv2.Sobel(gray, cv2.CV_64F, 0, 1, ksize=3)

        # Compute orientation field (doubled angle to handle 180° ambiguity)
        orientation = np.arctan2(sobely, sobelx)

        # Block-based orientation for noise reduction
        block_size = 16
        h_blocks = h // block_size
        w_blocks = w // block_size

        if h_blocks < 3 or w_blocks < 3:
            # Image too small for reliable detection
            return [], []

        orientation_blocks = np.zeros((h_blocks, w_blocks))

        for i in range(h_blocks):
            for j in range(w_blocks):
                block = orientation[
                    i * block_size : (i + 1) * block_size,
                    j * block_size : (j + 1) * block_size,
                ]
                # Average orientation in block
                orientation_blocks[i, j] = np.arctan2(
                    np.mean(np.sin(2 * block)), np.mean(np.cos(2 * block))
                ) / 2

        cores = []
        deltas = []

        # Compute Poincare index for each internal block
        for i in range(1, h_blocks - 1):
            for j in range(1, w_blocks - 1):
                # Get 8-connected neighbors in clockwise order
                neighbors = [
                    orientation_blocks[i - 1, j - 1],  # top-left
                    orientation_blocks[i - 1, j],      # top
                    orientation_blocks[i - 1, j + 1],  # top-right
                    orientation_blocks[i, j + 1],      # right
                    orientation_blocks[i + 1, j + 1],  # bottom-right
                    orientation_blocks[i + 1, j],      # bottom
                    orientation_blocks[i + 1, j - 1],  # bottom-left
                    orientation_blocks[i, j - 1],      # left
                ]

                # Compute Poincare index (sum of orientation differences)
                poincare_sum = 0.0
                for k in range(8):
                    diff = neighbors[(k + 1) % 8] - neighbors[k]
                    # Normalize to [-π/2, π/2]
                    while diff > np.pi / 2:
                        diff -= np.pi
                    while diff < -np.pi / 2:
                        diff += np.pi
                    poincare_sum += diff

                # Convert to block center coordinates
                x = int((j + 0.5) * block_size)
                y = int((i + 0.5) * block_size)

                # Threshold for detection
                # Core: Poincare ≈ +π (180°)
                # Delta: Poincare ≈ -π (-180°)
                if poincare_sum > np.pi * 0.5:  # > 90° suggests core
                    cores.append((x, y))
                elif poincare_sum < -np.pi * 0.5:  # < -90° suggests delta
                    deltas.append((x, y))

        # Merge nearby detections (within 2 blocks)
        def merge_points(points: list, min_dist: int = 32) -> list:
            if not points:
                return []
            merged = []
            used = [False] * len(points)
            for i, p1 in enumerate(points):
                if used[i]:
                    continue
                cluster = [p1]
                used[i] = True
                for j, p2 in enumerate(points[i + 1:], i + 1):
                    if not used[j]:
                        dist = np.sqrt((p1[0] - p2[0])**2 + (p1[1] - p2[1])**2)
                        if dist < min_dist:
                            cluster.append(p2)
                            used[j] = True
                # Use centroid of cluster
                cx = int(np.mean([p[0] for p in cluster]))
                cy = int(np.mean([p[1] for p in cluster]))
                merged.append((cx, cy))
            return merged

        cores = merge_points(cores)
        deltas = merge_points(deltas)

        return cores, deltas

    def _fallback_classification(self, image: np.ndarray) -> ClassificationResult:
        """
        Fallback classification using OpenCV when VLM is unavailable.

        Uses Poincare index method for delta/core detection, then classifies
        based on FBI/NCIC delta count rules:
        - 0 deltas → ARCH
        - 1 delta → LOOP
        - 2+ deltas → WHORL
        """
        if len(image.shape) == 3:
            gray = cv2.cvtColor(image, cv2.COLOR_BGR2GRAY)
        else:
            gray = image.copy()

        # Detect singular points using Poincare index
        cores, deltas = self._detect_singular_points_poincare(image)

        core_count = len(cores)
        delta_count = len(deltas)
        core_detected = core_count > 0
        delta_detected = delta_count > 0

        # Ridge flow analysis for subtype and flow direction
        sobelx = cv2.Sobel(gray, cv2.CV_64F, 1, 0, ksize=3)
        sobely = cv2.Sobel(gray, cv2.CV_64F, 0, 1, ksize=3)
        orientation = 0.5 * np.arctan2(2 * sobelx * sobely, sobelx**2 - sobely**2)

        h, w = gray.shape
        center_region = orientation[h // 3 : 2 * h // 3, w // 3 : 2 * w // 3]
        hist, _ = np.histogram(
            center_region.flatten(), bins=18, range=(-np.pi / 2, np.pi / 2)
        )
        dominant_orientation = np.argmax(hist)
        orientation_variance = center_region.var()

        # Classify based on delta count (FBI/NCIC standard)
        if delta_count >= 2:
            pattern_type = "whorl"
            pattern_subtype = "plain_whorl"
            ncic_code = "WM"
            ridge_flow = "circular"
            confidence = 0.35 if delta_count == 2 else 0.30
        elif delta_count == 1:
            pattern_type = "loop"
            # Determine loop direction from ridge flow
            if dominant_orientation < 6:
                pattern_subtype = "radial_loop"
                ridge_flow = "left_slant"
            else:
                pattern_subtype = "ulnar_loop"
                ridge_flow = "right_slant"
            ncic_code = "PM"
            confidence = 0.35
        else:
            # delta_count == 0
            pattern_type = "arch"
            # Determine if tented based on orientation variance
            if orientation_variance > 0.2 and core_count > 0:
                pattern_subtype = "tented_arch"
                ncic_code = "TT"
                confidence = 0.30
            else:
                pattern_subtype = "plain_arch"
                ncic_code = "AA"
                confidence = 0.30
            ridge_flow = "vertical"

        # Convert core/delta positions to percentage format
        core_positions = [
            {"x": int(x * 100 / w), "y": int(y * 100 / h)} for x, y in cores
        ]
        delta_positions = [
            {"x": int(x * 100 / w), "y": int(y * 100 / h)} for x, y in deltas
        ]

        return ClassificationResult(
            is_fingerprint=True,
            evidence_type="unknown",
            pattern_type=pattern_type,
            pattern_subtype=pattern_subtype,
            confidence=confidence,
            detail_level="level_1",
            rationale=f"Fallback classification using Poincare index singular point detection (VLM unavailable). Detected {core_count} core(s) and {delta_count} delta(s). Classification based on FBI/NCIC delta count rules.",
            alternative_patterns=[
                {"pattern": "unknown", "subtype": "unknown", "confidence": 0.5}
            ],
            core_detected=core_detected,
            delta_detected=delta_detected,
            ncic_code=ncic_code,
            henry_value=None,
            ridge_count=None,
            core_count=core_count,
            delta_count=delta_count,
            core_positions=core_positions,
            delta_positions=delta_positions,
            minutiae_count=None,
            minutiae_details=None,
            ridge_flow_direction=ridge_flow,
            ridge_density=None,
            raw_response={
                "method": "fallback_opencv_poincare",
                "orientation_variance": float(orientation_variance),
                "detected_cores": core_count,
                "detected_deltas": delta_count,
            },
            prompt_version="fallback",
            prompt_hash="opencv_poincare_fallback",
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
            overlay,
            confidence_text,
            (20, 70),
            cv2.FONT_HERSHEY_SIMPLEX,
            0.6,
            (255, 255, 255),
            1,
        )

        # Add core/delta indicators
        if classification_result.core_detected:
            cv2.putText(
                overlay,
                "Core: Detected",
                (20, h - 50),
                cv2.FONT_HERSHEY_SIMPLEX,
                0.5,
                (0, 255, 255),
                1,
            )

        if classification_result.delta_detected:
            cv2.putText(
                overlay,
                "Delta: Detected",
                (20, h - 30),
                cv2.FONT_HERSHEY_SIMPLEX,
                0.5,
                (255, 255, 0),
                1,
            )

        # Draw approximate center region
        center_x, center_y = w // 2, h // 2
        cv2.circle(overlay, (center_x, center_y), 5, (0, 0, 255), -1)
        cv2.circle(overlay, (center_x, center_y), 30, (0, 0, 255), 1)

        return overlay
