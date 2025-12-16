import cv2
import numpy as np
from typing import Dict, Any, List, Tuple, Optional
from dataclasses import dataclass
import io


@dataclass
class EnhancementResult:
    """Result of fingerprint enhancement"""
    enhanced_image: np.ndarray
    quality_score_before: float
    quality_score_after: float
    quality_improvement: float
    artifact_risk_level: str
    artifact_warnings: List[str]
    processing_steps: List[str]
    ridge_orientation_map: Optional[np.ndarray] = None


class FingerprintEnhancer:
    """OpenCV-based fingerprint enhancement pipeline"""

    PIPELINE_VERSION = "1.0.0"

    def __init__(self, config: Dict[str, Any]):
        self.config = config
        self.artifact_warnings = []
        self.processing_steps = []

    def enhance(self, image: np.ndarray) -> EnhancementResult:
        """Run the full enhancement pipeline"""
        self.artifact_warnings = []
        self.processing_steps = []

        # Convert to grayscale if needed
        if len(image.shape) == 3:
            gray = cv2.cvtColor(image, cv2.COLOR_BGR2GRAY)
        else:
            gray = image.copy()

        # Calculate initial quality
        quality_before = self._calculate_quality_score(gray)

        # Store original for comparison
        original = gray.copy()

        # Apply enhancement steps based on config
        enhanced = gray.copy()

        # 1. Denoising
        if self.config.get("denoise", {}).get("enabled", False):
            enhanced = self._denoise(enhanced)
            self.processing_steps.append("denoise")

        # 2. Contrast enhancement
        if self.config.get("contrast", {}).get("enabled", False):
            enhanced = self._enhance_contrast(enhanced)
            self.processing_steps.append("contrast")

        # 3. Gabor filtering for ridge enhancement
        if self.config.get("gabor_filter", {}).get("enabled", False):
            enhanced, ridge_orientation = self._apply_gabor_filter(enhanced)
            self.processing_steps.append("gabor_filter")
        else:
            ridge_orientation = None

        # 4. Sharpening
        if self.config.get("sharpening", {}).get("enabled", False):
            enhanced = self._sharpen(enhanced)
            self.processing_steps.append("sharpening")

        # 5. Background suppression
        if self.config.get("background_suppression", {}).get("enabled", False):
            enhanced = self._suppress_background(enhanced)
            self.processing_steps.append("background_suppression")

        # 6. Morphological operations
        if self.config.get("morphological", {}).get("enabled", False):
            enhanced = self._morphological_operations(enhanced)
            self.processing_steps.append("morphological")

        # Calculate final quality
        quality_after = self._calculate_quality_score(enhanced)
        quality_improvement = quality_after - quality_before

        # Determine artifact risk level
        artifact_risk = self._assess_artifact_risk(original, enhanced)

        # Generate ridge orientation map visualization
        ridge_map_viz = None
        if ridge_orientation is not None:
            ridge_map_viz = self._visualize_ridge_orientation(enhanced, ridge_orientation)

        return EnhancementResult(
            enhanced_image=enhanced,
            quality_score_before=quality_before,
            quality_score_after=quality_after,
            quality_improvement=quality_improvement,
            artifact_risk_level=artifact_risk,
            artifact_warnings=self.artifact_warnings,
            processing_steps=self.processing_steps,
            ridge_orientation_map=ridge_map_viz,
        )

    def _denoise(self, image: np.ndarray) -> np.ndarray:
        """Apply denoising"""
        config = self.config.get("denoise", {})
        method = config.get("method", "bilateral")

        if method == "bilateral":
            d = config.get("d", 9)
            sigma_color = config.get("sigma_color", 75)
            sigma_space = config.get("sigma_space", 75)
            return cv2.bilateralFilter(image, d, sigma_color, sigma_space)

        elif method == "nlmeans":
            h = config.get("h", 10)
            template_window = config.get("template_window_size", 7)
            search_window = config.get("search_window_size", 21)
            return cv2.fastNlMeansDenoising(
                image, None, h, template_window, search_window
            )

        elif method == "gaussian":
            ksize = config.get("kernel_size", 5)
            return cv2.GaussianBlur(image, (ksize, ksize), 0)

        return image

    def _enhance_contrast(self, image: np.ndarray) -> np.ndarray:
        """Enhance contrast using CLAHE or histogram equalization"""
        config = self.config.get("contrast", {})
        method = config.get("method", "clahe")

        if method == "clahe":
            clip_limit = config.get("clip_limit", 2.0)
            tile_size = tuple(config.get("tile_grid_size", [8, 8]))
            clahe = cv2.createCLAHE(clipLimit=clip_limit, tileGridSize=tile_size)
            return clahe.apply(image)

        elif method == "histogram_equalization":
            return cv2.equalizeHist(image)

        elif method == "adaptive":
            # Adaptive contrast using local statistics
            kernel_size = config.get("kernel_size", 31)
            local_mean = cv2.blur(image.astype(float), (kernel_size, kernel_size))
            local_std = np.sqrt(
                cv2.blur(image.astype(float) ** 2, (kernel_size, kernel_size))
                - local_mean ** 2
            )
            local_std = np.maximum(local_std, 1)  # Avoid division by zero
            normalized = (image.astype(float) - local_mean) / local_std
            enhanced = np.clip(normalized * 40 + 128, 0, 255).astype(np.uint8)
            return enhanced

        return image

    def _apply_gabor_filter(
        self, image: np.ndarray
    ) -> Tuple[np.ndarray, np.ndarray]:
        """Apply Gabor filtering for ridge enhancement"""
        config = self.config.get("gabor_filter", {})
        ksize = config.get("ksize", 31)
        sigma = config.get("sigma", 4.0)
        theta_count = config.get("theta_count", 16)
        lambd = config.get("lambd", 10.0)
        gamma = config.get("gamma", 0.5)

        # Estimate local ridge orientation
        orientation = self._estimate_ridge_orientation(image)

        # Create Gabor responses for multiple orientations
        gabor_responses = []
        thetas = np.linspace(0, np.pi, theta_count, endpoint=False)

        for theta in thetas:
            kernel = cv2.getGaborKernel(
                (ksize, ksize), sigma, theta, lambd, gamma, 0, ktype=cv2.CV_32F
            )
            kernel /= kernel.sum()
            response = cv2.filter2D(image, cv2.CV_32F, kernel)
            gabor_responses.append(response)

        gabor_responses = np.array(gabor_responses)

        # Select best response based on orientation
        h, w = image.shape
        enhanced = np.zeros((h, w), dtype=np.float32)

        for i in range(h):
            for j in range(w):
                # Find closest orientation bin
                angle = orientation[i, j]
                bin_idx = int((angle / np.pi) * theta_count) % theta_count
                enhanced[i, j] = gabor_responses[bin_idx, i, j]

        # Normalize
        enhanced = cv2.normalize(enhanced, None, 0, 255, cv2.NORM_MINMAX).astype(
            np.uint8
        )

        return enhanced, orientation

    def _estimate_ridge_orientation(self, image: np.ndarray) -> np.ndarray:
        """Estimate local ridge orientation using gradient method"""
        # Compute gradients
        sobelx = cv2.Sobel(image, cv2.CV_64F, 1, 0, ksize=3)
        sobely = cv2.Sobel(image, cv2.CV_64F, 0, 1, ksize=3)

        # Compute gradient products
        gxx = sobelx * sobelx
        gyy = sobely * sobely
        gxy = sobelx * sobely

        # Smooth gradient products
        block_size = 16
        gxx = cv2.blur(gxx, (block_size, block_size))
        gyy = cv2.blur(gyy, (block_size, block_size))
        gxy = cv2.blur(gxy, (block_size, block_size))

        # Compute orientation
        orientation = 0.5 * np.arctan2(2 * gxy, gxx - gyy)

        return orientation

    def _sharpen(self, image: np.ndarray) -> np.ndarray:
        """Apply sharpening"""
        config = self.config.get("sharpening", {})
        kernel_size = config.get("kernel_size", 3)
        strength = config.get("strength", 1.0)

        # Create sharpening kernel
        if kernel_size == 3:
            kernel = np.array([[-1, -1, -1], [-1, 9, -1], [-1, -1, -1]]) * strength
            kernel[1, 1] = 1 + 8 * strength
        else:
            # Unsharp mask approach for larger kernels
            blurred = cv2.GaussianBlur(image, (kernel_size, kernel_size), 0)
            sharpened = cv2.addWeighted(
                image, 1 + strength, blurred, -strength, 0
            )
            return sharpened

        sharpened = cv2.filter2D(image, -1, kernel)
        sharpened = np.clip(sharpened, 0, 255).astype(np.uint8)

        if strength > 1.5:
            self.artifact_warnings.append(
                "High sharpening strength may introduce artifacts"
            )

        return sharpened

    def _suppress_background(self, image: np.ndarray) -> np.ndarray:
        """Suppress background and enhance foreground"""
        config = self.config.get("background_suppression", {})
        method = config.get("method", "adaptive_threshold")

        if method == "adaptive_threshold":
            block_size = config.get("block_size", 11)
            c = config.get("c", 2)

            # Create mask using adaptive thresholding
            mask = cv2.adaptiveThreshold(
                image,
                255,
                cv2.ADAPTIVE_THRESH_GAUSSIAN_C,
                cv2.THRESH_BINARY,
                block_size,
                c,
            )

            # Apply mask to enhance contrast in foreground
            result = cv2.bitwise_and(image, mask)
            return result

        elif method == "otsu":
            _, mask = cv2.threshold(
                image, 0, 255, cv2.THRESH_BINARY + cv2.THRESH_OTSU
            )
            return cv2.bitwise_and(image, mask)

        return image

    def _morphological_operations(self, image: np.ndarray) -> np.ndarray:
        """Apply morphological operations"""
        config = self.config.get("morphological", {})
        operation = config.get("operation", "close")
        kernel_size = config.get("kernel_size", 3)

        kernel = cv2.getStructuringElement(
            cv2.MORPH_ELLIPSE, (kernel_size, kernel_size)
        )

        if operation == "close":
            return cv2.morphologyEx(image, cv2.MORPH_CLOSE, kernel)
        elif operation == "open":
            return cv2.morphologyEx(image, cv2.MORPH_OPEN, kernel)
        elif operation == "dilate":
            return cv2.dilate(image, kernel)
        elif operation == "erode":
            return cv2.erode(image, kernel)

        self.artifact_warnings.append(
            "Morphological operations may alter ridge structure"
        )

        return image

    def _calculate_quality_score(self, image: np.ndarray) -> float:
        """Calculate fingerprint quality score (0-100)"""
        scores = []

        # 1. Contrast score
        contrast = image.std()
        contrast_score = min(contrast / 60 * 100, 100)
        scores.append(contrast_score)

        # 2. Ridge clarity (using gradient magnitude)
        sobelx = cv2.Sobel(image, cv2.CV_64F, 1, 0, ksize=3)
        sobely = cv2.Sobel(image, cv2.CV_64F, 0, 1, ksize=3)
        gradient_mag = np.sqrt(sobelx ** 2 + sobely ** 2)
        clarity_score = min(gradient_mag.mean() / 30 * 100, 100)
        scores.append(clarity_score)

        # 3. Local coherence (ridge orientation consistency)
        orientation = self._estimate_ridge_orientation(image)
        coherence = self._calculate_coherence(orientation)
        coherence_score = coherence * 100
        scores.append(coherence_score)

        # 4. Noise level (inverse)
        laplacian = cv2.Laplacian(image, cv2.CV_64F)
        noise_level = laplacian.var()
        noise_score = max(0, 100 - noise_level / 10)
        scores.append(noise_score)

        # Weighted average
        weights = [0.25, 0.30, 0.30, 0.15]
        quality_score = sum(s * w for s, w in zip(scores, weights))

        return min(max(quality_score, 0), 100)

    def _calculate_coherence(self, orientation: np.ndarray) -> float:
        """Calculate local orientation coherence"""
        h, w = orientation.shape
        block_size = 16
        coherence_values = []

        for i in range(0, h - block_size, block_size):
            for j in range(0, w - block_size, block_size):
                block = orientation[i : i + block_size, j : j + block_size]
                # Compute circular variance
                sin_sum = np.sin(2 * block).sum()
                cos_sum = np.cos(2 * block).sum()
                n = block_size * block_size
                r = np.sqrt(sin_sum ** 2 + cos_sum ** 2) / n
                coherence_values.append(r)

        return np.mean(coherence_values) if coherence_values else 0.5

    def _assess_artifact_risk(
        self, original: np.ndarray, enhanced: np.ndarray
    ) -> str:
        """Assess the risk of artifacts introduced by enhancement"""
        # Calculate structural similarity
        diff = cv2.absdiff(original, enhanced)
        change_ratio = np.mean(diff) / 255

        # Check for new high-frequency components
        original_laplacian = cv2.Laplacian(original, cv2.CV_64F)
        enhanced_laplacian = cv2.Laplacian(enhanced, cv2.CV_64F)
        hf_increase = (enhanced_laplacian.var() - original_laplacian.var()) / max(
            original_laplacian.var(), 1
        )

        # Determine risk level
        if change_ratio > 0.3 or hf_increase > 2.0:
            self.artifact_warnings.append(
                "Significant structural changes detected - verify results carefully"
            )
            return "high"
        elif change_ratio > 0.15 or hf_increase > 1.0:
            self.artifact_warnings.append(
                "Moderate enhancement applied - review for potential artifacts"
            )
            return "medium"
        else:
            return "low"

    def _visualize_ridge_orientation(
        self, image: np.ndarray, orientation: np.ndarray
    ) -> np.ndarray:
        """Create visualization of ridge orientation"""
        h, w = image.shape
        visualization = cv2.cvtColor(image, cv2.COLOR_GRAY2BGR)

        block_size = 16
        line_length = block_size // 2

        for i in range(block_size // 2, h - block_size // 2, block_size):
            for j in range(block_size // 2, w - block_size // 2, block_size):
                angle = orientation[i, j]
                dx = int(line_length * np.cos(angle))
                dy = int(line_length * np.sin(angle))

                # Draw orientation line
                pt1 = (j - dx, i - dy)
                pt2 = (j + dx, i + dy)
                cv2.line(visualization, pt1, pt2, (0, 255, 0), 1)

        return visualization


def image_to_bytes(image: np.ndarray, format: str = "png") -> bytes:
    """Convert numpy array to bytes"""
    success, encoded = cv2.imencode(f".{format}", image)
    if not success:
        raise ValueError("Failed to encode image")
    return encoded.tobytes()


def bytes_to_image(data: bytes) -> np.ndarray:
    """Convert bytes to numpy array"""
    nparr = np.frombuffer(data, np.uint8)
    image = cv2.imdecode(nparr, cv2.IMREAD_UNCHANGED)
    if image is None:
        raise ValueError("Failed to decode image")
    return image
