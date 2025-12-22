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


@dataclass
class FingerprintPresenceResult:
    """Result of fingerprint presence detection"""
    fingerprint_present: bool  # True if at least a partial fingerprint is detected
    confidence: float  # 0-1 confidence score
    ridge_pattern_detected: bool  # True if friction ridge patterns found
    ridge_coverage: float  # Percentage of image with detectable ridges
    reason: str  # Explanation for the detection result
    metrics: Dict[str, float]  # Detection metrics for debugging


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


class FingerprintPresenceDetector:
    """
    Detects whether a fingerprint (or at least partial fingerprint) is present in an image.

    This is a lightweight pre-filter that runs BEFORE enhancement and classification
    to avoid wasting resources on images that don't contain fingerprints.
    """

    # Thresholds for detection (balanced - avoid both false positives and false negatives)
    MIN_RIDGE_COHERENCE = 0.32  # Minimum coherence to consider ridge-like patterns
    MIN_RIDGE_COVERAGE = 0.08  # Minimum percentage of image with ridge patterns (8%)
    MIN_GRADIENT_MAGNITUDE = 8.0  # Minimum gradient for ridge detection
    CONFIDENCE_THRESHOLD = 0.45  # Minimum confidence to declare fingerprint present

    def detect(self, image: np.ndarray) -> FingerprintPresenceResult:
        """
        Detect if a fingerprint is present in the image.

        Uses multiple heuristics:
        1. Ridge coherence analysis (oriented texture patterns)
        2. Gradient magnitude (edge strength typical of ridges)
        3. Local frequency analysis (ridge spacing patterns)
        4. Coverage area estimation

        Returns FingerprintPresenceResult with detection decision and confidence.
        """
        # Convert to grayscale if needed
        if len(image.shape) == 3:
            gray = cv2.cvtColor(image, cv2.COLOR_BGR2GRAY)
        else:
            gray = image.copy()

        metrics = {}

        # 1. Compute gradients
        sobelx = cv2.Sobel(gray, cv2.CV_64F, 1, 0, ksize=3)
        sobely = cv2.Sobel(gray, cv2.CV_64F, 0, 1, ksize=3)
        gradient_magnitude = np.sqrt(sobelx ** 2 + sobely ** 2)
        mean_gradient = gradient_magnitude.mean()
        metrics["mean_gradient"] = float(mean_gradient)

        # 2. Compute ridge coherence (oriented texture analysis)
        block_size = 16
        gxx = cv2.blur(sobelx ** 2, (block_size, block_size))
        gyy = cv2.blur(sobely ** 2, (block_size, block_size))
        gxy = cv2.blur(sobelx * sobely, (block_size, block_size))

        # Coherence measures how well-oriented the texture is
        coherence = np.sqrt((gxx - gyy) ** 2 + 4 * gxy ** 2) / (gxx + gyy + 1e-6)
        mean_coherence = float(coherence.mean())
        metrics["mean_coherence"] = mean_coherence

        # 3. Identify regions with ridge-like patterns (high coherence + gradient)
        ridge_mask = (coherence > self.MIN_RIDGE_COHERENCE) & (gradient_magnitude > self.MIN_GRADIENT_MAGNITUDE)
        ridge_coverage = float(ridge_mask.sum() / ridge_mask.size)
        metrics["ridge_coverage"] = ridge_coverage

        # 4. Check for consistent ridge spacing using Gabor filter responses
        gabor_score = self._compute_gabor_response(gray)
        metrics["gabor_score"] = gabor_score

        # 5. Check local variance pattern (fingerprints have structured variance)
        variance_score = self._compute_variance_pattern(gray)
        metrics["variance_score"] = variance_score

        # 6. Check for fingerprint-like ridge periodicity using FFT
        periodicity_score = self._validate_ridge_periodicity(gray)
        metrics["periodicity_score"] = periodicity_score

        # 7. Calculate overall confidence
        confidence = self._calculate_confidence(
            mean_coherence=mean_coherence,
            ridge_coverage=ridge_coverage,
            mean_gradient=mean_gradient,
            gabor_score=gabor_score,
            variance_score=variance_score,
            periodicity_score=periodicity_score,
        )
        metrics["confidence"] = confidence

        # 8. Make detection decision
        ridge_pattern_detected = (
            mean_coherence > self.MIN_RIDGE_COHERENCE and
            ridge_coverage > self.MIN_RIDGE_COVERAGE
        )

        fingerprint_present = confidence >= self.CONFIDENCE_THRESHOLD

        # Generate reason
        reason = self._generate_reason(
            fingerprint_present=fingerprint_present,
            confidence=confidence,
            mean_coherence=mean_coherence,
            ridge_coverage=ridge_coverage,
            mean_gradient=mean_gradient,
            gabor_score=gabor_score,
        )

        return FingerprintPresenceResult(
            fingerprint_present=fingerprint_present,
            confidence=round(confidence, 3),
            ridge_pattern_detected=ridge_pattern_detected,
            ridge_coverage=round(ridge_coverage, 3),
            reason=reason,
            metrics={k: round(v, 4) for k, v in metrics.items()},
        )

    def _compute_gabor_response(self, image: np.ndarray) -> float:
        """
        Compute Gabor filter response to detect ridge-like patterns.

        Fingerprints have characteristic ridge frequencies (~0.1-0.15 cycles/pixel).
        """
        responses = []

        # Test multiple orientations
        for theta in np.arange(0, np.pi, np.pi / 8):
            # Gabor kernel parameters typical for fingerprint ridges
            kernel = cv2.getGaborKernel(
                ksize=(21, 21),
                sigma=4.0,
                theta=theta,
                lambd=10.0,  # Wavelength ~10 pixels (typical ridge spacing)
                gamma=0.5,
                psi=0,
            )
            filtered = cv2.filter2D(image, cv2.CV_64F, kernel)
            responses.append(np.abs(filtered).mean())

        # High response variance across orientations suggests oriented texture
        max_response = max(responses)
        mean_response = np.mean(responses)

        # Normalize score (fingerprints typically have strong directional response)
        gabor_score = max_response / (mean_response + 1e-6)

        return float(min(gabor_score / 3.0, 1.0))  # Normalize to 0-1

    def _compute_variance_pattern(self, image: np.ndarray) -> float:
        """
        Analyze local variance pattern to detect fingerprint-like texture.

        Fingerprints have moderate, structured local variance (not too uniform, not too noisy).
        """
        # Compute local variance
        block_size = 16
        local_mean = cv2.blur(image.astype(float), (block_size, block_size))
        local_sq_mean = cv2.blur(image.astype(float) ** 2, (block_size, block_size))
        local_var = local_sq_mean - local_mean ** 2

        mean_var = local_var.mean()
        var_of_var = local_var.var()

        # Fingerprints have moderate variance with some spatial structure
        # Too low = uniform/blank, too high = noise
        if mean_var < 100:
            variance_score = mean_var / 100
        elif mean_var > 2000:
            variance_score = max(0, 1 - (mean_var - 2000) / 3000)
        else:
            variance_score = 1.0

        # Some spatial structure in variance is expected
        structure_score = min(var_of_var / (mean_var ** 2 + 1e-6) * 100, 1.0)

        return float((variance_score + structure_score) / 2)

    def _validate_ridge_periodicity(self, image: np.ndarray) -> float:
        """
        Validate fingerprint-like ridge spacing using FFT analysis.

        Fingerprints have characteristic ridge spacing of 8-15 pixels at 500 DPI.
        Random textures lack this periodic structure.

        Returns:
            float: 0-1 score (1 = strong fingerprint-like periodicity)
        """
        # Apply window function to reduce edge artifacts
        h, w = image.shape
        window = np.outer(np.hanning(h), np.hanning(w))
        windowed = image.astype(float) * window

        # Compute 2D FFT
        fft = np.fft.fft2(windowed)
        fft_shift = np.fft.fftshift(fft)
        magnitude = np.abs(fft_shift)

        # Analyze radial frequency distribution
        center_y, center_x = h // 2, w // 2

        # Create radial frequency bins (fingerprint ridges: ~0.067-0.125 cycles/pixel)
        # At 500 DPI, ridge spacing is 8-15 pixels → frequencies 0.067-0.125
        y_coords, x_coords = np.ogrid[:h, :w]
        r = np.sqrt((x_coords - center_x)**2 + (y_coords - center_y)**2)

        # Normalize to cycles per pixel
        r_normalized = r / max(h, w)

        # Define fingerprint frequency band (ridge spacing 8-15 pixels)
        fp_freq_low = 1.0 / 15  # ~0.067
        fp_freq_high = 1.0 / 8  # 0.125

        # Calculate energy in fingerprint frequency band
        fp_band_mask = (r_normalized >= fp_freq_low) & (r_normalized <= fp_freq_high)
        fp_band_energy = magnitude[fp_band_mask].sum()

        # Calculate total energy (excluding DC component)
        dc_mask = r_normalized < 0.01
        total_energy = magnitude[~dc_mask].sum() + 1e-6

        # Ratio of fingerprint-band energy to total
        fp_ratio = fp_band_energy / total_energy

        # Normalize to 0-1 (typical fingerprints have ratio 0.15-0.35)
        score = min(fp_ratio / 0.25, 1.0)

        return float(score)

    def _calculate_confidence(
        self,
        mean_coherence: float,
        ridge_coverage: float,
        mean_gradient: float,
        gabor_score: float,
        variance_score: float,
        periodicity_score: float,
    ) -> float:
        """Calculate overall confidence that a fingerprint is present."""
        # Weighted combination of factors (rebalanced to include periodicity)
        weights = {
            "coherence": 0.25,      # Reduced from 0.30
            "coverage": 0.20,       # Reduced from 0.25
            "gradient": 0.10,       # Reduced from 0.15
            "gabor": 0.15,          # Reduced from 0.20
            "variance": 0.10,       # Keep same
            "periodicity": 0.20,    # NEW - FFT ridge spacing validation
        }

        # Normalize each factor to 0-1 (balanced normalization)
        coherence_norm = min(mean_coherence / 0.65, 1.0)  # Typical good fingerprint ~0.5-0.7
        coverage_norm = min(ridge_coverage / 0.35, 1.0)   # 35% coverage is good (was 30%)
        gradient_norm = min(mean_gradient / 30, 1.0)      # Typical fingerprint gradient ~20-40
        gabor_norm = gabor_score                          # Already 0-1
        variance_norm = variance_score                    # Already 0-1
        periodicity_norm = periodicity_score              # Already 0-1

        confidence = (
            weights["coherence"] * coherence_norm +
            weights["coverage"] * coverage_norm +
            weights["gradient"] * gradient_norm +
            weights["gabor"] * gabor_norm +
            weights["variance"] * variance_norm +
            weights["periodicity"] * periodicity_norm
        )

        return float(min(max(confidence, 0), 1))

    def _generate_reason(
        self,
        fingerprint_present: bool,
        confidence: float,
        mean_coherence: float,
        ridge_coverage: float,
        mean_gradient: float,
        gabor_score: float,
    ) -> str:
        """Generate human-readable explanation for detection result."""
        if fingerprint_present:
            if confidence > 0.7:
                return "Strong friction ridge patterns detected with high confidence."
            elif confidence > 0.5:
                return "Partial or faint friction ridge patterns detected."
            else:
                return "Minimal ridge patterns detected; may be partial or degraded fingerprint."
        else:
            issues = []
            if mean_coherence < self.MIN_RIDGE_COHERENCE:
                issues.append("no coherent ridge orientation patterns")
            if ridge_coverage < self.MIN_RIDGE_COVERAGE:
                issues.append("insufficient area with ridge-like texture")
            if mean_gradient < self.MIN_GRADIENT_MAGNITUDE:
                issues.append("weak edge/ridge contrast")
            if gabor_score < 0.2:
                issues.append("no characteristic ridge frequency patterns")

            if issues:
                return f"No fingerprint detected: {', '.join(issues)}."
            else:
                return "No fingerprint detected: image does not contain friction ridge patterns."
