import cv2
import numpy as np
from typing import Dict, List, Any, Tuple, Optional
from dataclasses import dataclass


@dataclass
class QualityIssue:
    code: str
    severity: str  # "low", "medium", "high"
    description: str


@dataclass
class QualityAssessmentResult:
    score: float  # 0-100
    issues: List[QualityIssue]
    metrics: Dict[str, float]
    is_processable: bool
    ridge_flow_confidence: float
    completeness: float


class FingerprintQualityAssessor:
    """Assess fingerprint image quality for forensic processing"""

    # Quality thresholds
    MIN_PROCESSABLE_SCORE = 20.0
    LOW_QUALITY_THRESHOLD = 40.0
    MEDIUM_QUALITY_THRESHOLD = 60.0
    HIGH_QUALITY_THRESHOLD = 80.0

    def assess(self, image: np.ndarray) -> QualityAssessmentResult:
        """Perform comprehensive quality assessment"""
        # Convert to grayscale if needed
        if len(image.shape) == 3:
            gray = cv2.cvtColor(image, cv2.COLOR_BGR2GRAY)
        else:
            gray = image.copy()

        issues = []
        metrics = {}

        # 1. Check image dimensions
        h, w = gray.shape
        if h < 100 or w < 100:
            issues.append(
                QualityIssue(
                    code="TOO_SMALL",
                    severity="high",
                    description=f"Image too small ({w}x{h}). Minimum 100x100 recommended.",
                )
            )

        # 2. Assess contrast
        contrast_score, contrast_issues = self._assess_contrast(gray)
        metrics["contrast"] = contrast_score
        issues.extend(contrast_issues)

        # 3. Assess blur/sharpness
        sharpness_score, sharpness_issues = self._assess_sharpness(gray)
        metrics["sharpness"] = sharpness_score
        issues.extend(sharpness_issues)

        # 4. Assess noise level
        noise_score, noise_issues = self._assess_noise(gray)
        metrics["noise"] = noise_score
        issues.extend(noise_issues)

        # 5. Assess ridge clarity
        ridge_score, ridge_issues, ridge_confidence = self._assess_ridge_clarity(gray)
        metrics["ridge_clarity"] = ridge_score
        issues.extend(ridge_issues)

        # 6. Assess completeness (segmentation)
        completeness_score, completeness_issues, completeness = self._assess_completeness(gray)
        metrics["completeness"] = completeness_score
        issues.extend(completeness_issues)

        # 7. Check for compression artifacts
        compression_score, compression_issues = self._assess_compression_artifacts(gray)
        metrics["compression"] = compression_score
        issues.extend(compression_issues)

        # 8. Check exposure
        exposure_score, exposure_issues = self._assess_exposure(gray)
        metrics["exposure"] = exposure_score
        issues.extend(exposure_issues)

        # Calculate overall quality score
        weights = {
            "contrast": 0.15,
            "sharpness": 0.20,
            "noise": 0.10,
            "ridge_clarity": 0.25,
            "completeness": 0.15,
            "compression": 0.05,
            "exposure": 0.10,
        }

        overall_score = sum(metrics[k] * weights[k] for k in weights)

        # Determine if processable
        is_processable = overall_score >= self.MIN_PROCESSABLE_SCORE

        if not is_processable:
            issues.append(
                QualityIssue(
                    code="NOT_PROCESSABLE",
                    severity="high",
                    description="Image quality too low for reliable processing.",
                )
            )

        return QualityAssessmentResult(
            score=round(overall_score, 2),
            issues=issues,
            metrics={k: round(v, 2) for k, v in metrics.items()},
            is_processable=is_processable,
            ridge_flow_confidence=ridge_confidence,
            completeness=completeness,
        )

    def _assess_contrast(
        self, image: np.ndarray
    ) -> Tuple[float, List[QualityIssue]]:
        """Assess image contrast"""
        issues = []
        std = image.std()

        if std < 20:
            issues.append(
                QualityIssue(
                    code="LOW_CONTRAST",
                    severity="high",
                    description="Very low contrast - ridges may not be distinguishable.",
                )
            )
            score = std / 20 * 30
        elif std < 40:
            issues.append(
                QualityIssue(
                    code="LOW_CONTRAST",
                    severity="medium",
                    description="Low contrast - enhancement recommended.",
                )
            )
            score = 30 + (std - 20) / 20 * 30
        elif std < 60:
            score = 60 + (std - 40) / 20 * 30
        else:
            score = min(90 + (std - 60) / 40 * 10, 100)

        return score, issues

    def _assess_sharpness(
        self, image: np.ndarray
    ) -> Tuple[float, List[QualityIssue]]:
        """Assess image sharpness using Laplacian variance"""
        issues = []
        laplacian = cv2.Laplacian(image, cv2.CV_64F)
        variance = laplacian.var()

        if variance < 50:
            issues.append(
                QualityIssue(
                    code="BLUR",
                    severity="high",
                    description="Image appears heavily blurred.",
                )
            )
            score = variance / 50 * 30
        elif variance < 100:
            issues.append(
                QualityIssue(
                    code="BLUR",
                    severity="medium",
                    description="Image appears slightly blurred.",
                )
            )
            score = 30 + (variance - 50) / 50 * 30
        elif variance < 200:
            score = 60 + (variance - 100) / 100 * 30
        else:
            score = min(90 + (variance - 200) / 200 * 10, 100)

        return score, issues

    def _assess_noise(
        self, image: np.ndarray
    ) -> Tuple[float, List[QualityIssue]]:
        """Assess noise level"""
        issues = []

        # Estimate noise using median absolute deviation
        median = np.median(image)
        mad = np.median(np.abs(image.astype(float) - median))
        noise_estimate = mad * 1.4826  # Scale factor for Gaussian noise

        if noise_estimate > 30:
            issues.append(
                QualityIssue(
                    code="HIGH_NOISE",
                    severity="high",
                    description="High noise level detected.",
                )
            )
            score = max(0, 30 - (noise_estimate - 30))
        elif noise_estimate > 20:
            issues.append(
                QualityIssue(
                    code="NOISE",
                    severity="medium",
                    description="Moderate noise level.",
                )
            )
            score = 30 + (30 - noise_estimate) / 10 * 30
        elif noise_estimate > 10:
            score = 60 + (20 - noise_estimate) / 10 * 30
        else:
            score = 90 + (10 - noise_estimate) / 10 * 10

        return score, issues

    def _assess_ridge_clarity(
        self, image: np.ndarray
    ) -> Tuple[float, List[QualityIssue], float]:
        """Assess ridge clarity and flow confidence"""
        issues = []

        # Compute gradients
        sobelx = cv2.Sobel(image, cv2.CV_64F, 1, 0, ksize=3)
        sobely = cv2.Sobel(image, cv2.CV_64F, 0, 1, ksize=3)

        # Gradient magnitude
        magnitude = np.sqrt(sobelx ** 2 + sobely ** 2)
        mean_mag = magnitude.mean()

        # Ridge flow coherence
        gxx = cv2.blur(sobelx ** 2, (16, 16))
        gyy = cv2.blur(sobely ** 2, (16, 16))
        gxy = cv2.blur(sobelx * sobely, (16, 16))

        coherence = np.sqrt((gxx - gyy) ** 2 + 4 * gxy ** 2) / (gxx + gyy + 1e-6)
        mean_coherence = coherence.mean()

        # Calculate confidence
        ridge_confidence = min(mean_coherence * 1.5, 1.0)

        # Determine score and issues
        if mean_mag < 10 or mean_coherence < 0.3:
            issues.append(
                QualityIssue(
                    code="LOW_RIDGE_CLARITY",
                    severity="high",
                    description="Ridge pattern not clearly visible.",
                )
            )
            score = max(mean_coherence * 100, mean_mag)
        elif mean_coherence < 0.5:
            issues.append(
                QualityIssue(
                    code="LOW_RIDGE_CLARITY",
                    severity="medium",
                    description="Ridge flow partially visible but unclear in areas.",
                )
            )
            score = 30 + mean_coherence * 60
        else:
            score = 60 + mean_coherence * 40

        return min(score, 100), issues, ridge_confidence

    def _assess_completeness(
        self, image: np.ndarray
    ) -> Tuple[float, List[QualityIssue], float]:
        """Assess fingerprint area completeness"""
        issues = []

        # Segment fingerprint region
        _, binary = cv2.threshold(
            image, 0, 255, cv2.THRESH_BINARY + cv2.THRESH_OTSU
        )

        # Find largest connected component (fingerprint)
        contours, _ = cv2.findContours(
            binary, cv2.RETR_EXTERNAL, cv2.CHAIN_APPROX_SIMPLE
        )

        if not contours:
            issues.append(
                QualityIssue(
                    code="NO_FINGERPRINT",
                    severity="high",
                    description="No fingerprint region detected.",
                )
            )
            return 0, issues, 0.0

        largest_contour = max(contours, key=cv2.contourArea)
        area = cv2.contourArea(largest_contour)
        total_area = image.shape[0] * image.shape[1]

        completeness = area / total_area

        if completeness < 0.1:
            issues.append(
                QualityIssue(
                    code="PARTIAL",
                    severity="high",
                    description="Only a small portion of fingerprint visible.",
                )
            )
            score = completeness * 300
        elif completeness < 0.3:
            issues.append(
                QualityIssue(
                    code="PARTIAL",
                    severity="medium",
                    description="Fingerprint appears partial or cropped.",
                )
            )
            score = 30 + (completeness - 0.1) / 0.2 * 30
        elif completeness < 0.5:
            score = 60 + (completeness - 0.3) / 0.2 * 20
        else:
            score = 80 + min((completeness - 0.5) / 0.3 * 20, 20)

        return score, issues, completeness

    def _assess_compression_artifacts(
        self, image: np.ndarray
    ) -> Tuple[float, List[QualityIssue]]:
        """Detect JPEG compression artifacts"""
        issues = []

        # Check for blocking artifacts (8x8 DCT blocks)
        h, w = image.shape
        block_size = 8

        # Calculate difference at block boundaries
        # Get slices and ensure they have the same shape
        h_left = image[:, block_size - 1 :: block_size].astype(float)
        h_right = image[:, block_size :: block_size].astype(float)
        # Trim to minimum common length
        h_min_len = min(h_left.shape[1], h_right.shape[1])
        h_diff = np.abs(h_left[:, :h_min_len] - h_right[:, :h_min_len])

        v_top = image[block_size - 1 :: block_size, :].astype(float)
        v_bottom = image[block_size :: block_size, :].astype(float)
        # Trim to minimum common length
        v_min_len = min(v_top.shape[0], v_bottom.shape[0])
        v_diff = np.abs(v_top[:v_min_len, :] - v_bottom[:v_min_len, :])

        block_artifact_score = (h_diff.mean() + v_diff.mean()) / 2

        if block_artifact_score > 15:
            issues.append(
                QualityIssue(
                    code="COMPRESSION_ARTIFACTS",
                    severity="high",
                    description="Significant JPEG compression artifacts detected.",
                )
            )
            score = max(0, 50 - block_artifact_score)
        elif block_artifact_score > 8:
            issues.append(
                QualityIssue(
                    code="COMPRESSION_ARTIFACTS",
                    severity="medium",
                    description="Some compression artifacts visible.",
                )
            )
            score = 50 + (15 - block_artifact_score) / 7 * 30
        else:
            score = 80 + (8 - block_artifact_score) / 8 * 20

        return score, issues

    def _assess_exposure(
        self, image: np.ndarray
    ) -> Tuple[float, List[QualityIssue]]:
        """Assess image exposure"""
        issues = []
        mean_intensity = image.mean()

        if mean_intensity < 50:
            issues.append(
                QualityIssue(
                    code="UNDEREXPOSED",
                    severity="high" if mean_intensity < 30 else "medium",
                    description="Image appears underexposed/too dark.",
                )
            )
            score = mean_intensity / 50 * 50
        elif mean_intensity > 200:
            issues.append(
                QualityIssue(
                    code="OVEREXPOSED",
                    severity="high" if mean_intensity > 220 else "medium",
                    description="Image appears overexposed/too bright.",
                )
            )
            score = max(0, 50 - (mean_intensity - 200) / 55 * 50)
        elif mean_intensity < 80 or mean_intensity > 180:
            score = 50 + min(
                abs(mean_intensity - 128) / 50 * 30,
                30
            )
            score = 80 - score + 50
        else:
            # Ideal range 80-180
            deviation = abs(mean_intensity - 128)
            score = 80 + (52 - deviation) / 52 * 20

        return score, issues


def segment_fingerprint(image: np.ndarray) -> Tuple[np.ndarray, np.ndarray]:
    """Segment fingerprint region from background"""
    if len(image.shape) == 3:
        gray = cv2.cvtColor(image, cv2.COLOR_BGR2GRAY)
    else:
        gray = image.copy()

    # Apply Gaussian blur
    blurred = cv2.GaussianBlur(gray, (5, 5), 0)

    # Compute local variance
    block_size = 16
    local_mean = cv2.blur(blurred.astype(float), (block_size, block_size))
    local_sq_mean = cv2.blur(
        blurred.astype(float) ** 2, (block_size, block_size)
    )
    local_var = local_sq_mean - local_mean ** 2

    # Threshold based on variance
    var_threshold = local_var.mean() * 0.5
    mask = (local_var > var_threshold).astype(np.uint8) * 255

    # Morphological operations to clean up mask
    kernel = cv2.getStructuringElement(cv2.MORPH_ELLIPSE, (15, 15))
    mask = cv2.morphologyEx(mask, cv2.MORPH_CLOSE, kernel)
    mask = cv2.morphologyEx(mask, cv2.MORPH_OPEN, kernel)

    return mask, gray
