"""
Gemini-based fingerprint image enhancement using Google's generative AI.
Uses the gemini-3-pro-image-preview model for forensic-grade image reconstruction.
"""

import base64
import logging
from dataclasses import dataclass
from typing import Optional

import cv2
import numpy as np
from google import genai
from google.genai import types

from ..core.config import settings

logger = logging.getLogger(__name__)


@dataclass
class GeminiEnhancementResult:
    """Result of Gemini-based image enhancement"""

    enhanced_image: np.ndarray
    original_image: np.ndarray
    success: bool
    error_message: Optional[str] = None
    text_response: Optional[str] = None


class GeminiImageEnhancer:
    """
    Fingerprint enhancement using Google Gemini's image generation capabilities.
    Uses the configured image model with TEXT and IMAGE response modalities.
    """

    ENHANCEMENT_PROMPT = """You are a forensic fingerprint enhancement specialist.
Enhance this fingerprint image for forensic analysis by:
1. Removing smudges, noise, and artifacts
2. Sharpening ridge patterns for clarity
3. Reconstructing damaged or unclear ridge areas
4. Improving contrast between ridges and valleys
5. Preserving the original ridge flow and pattern characteristics

Important: Do NOT alter the fundamental pattern structure. Only enhance visibility and clarity.
Return the full image with enhanced fingerprint image suitable for forensic identification."""

    def __init__(self):
        self.client = None
        self._initialized = False

    @property
    def model_name(self) -> str:
        """Get the model name from settings"""
        return settings.GEMINI_IMAGE_MODEL

    def _initialize_client(self):
        """Initialize the Gemini client lazily"""
        if self._initialized:
            return

        try:
            # Check if using Vertex AI or direct API
            if settings.GOOGLE_CLOUD_PROJECT:
                self.client = genai.Client(
                    vertexai=True,
                    project=settings.GOOGLE_CLOUD_PROJECT,
                    location=settings.GOOGLE_CLOUD_LOCATION,
                )
            else:
                self.client = genai.Client(
                    api_key=settings.GEMINI_API_KEY,
                )
            self._initialized = True
            logger.info("Gemini client initialized successfully")
        except Exception as e:
            logger.error(f"Failed to initialize Gemini client: {e}")
            raise

    def _image_to_base64(self, image: np.ndarray) -> str:
        """Convert numpy image array to base64 string"""
        success, encoded = cv2.imencode(".png", image)
        if not success:
            raise ValueError("Failed to encode image to PNG")
        return base64.b64encode(encoded.tobytes()).decode("utf-8")

    def _base64_to_image(self, b64_string: str) -> np.ndarray:
        """Convert base64 string to numpy image array"""
        img_data = base64.b64decode(b64_string)
        nparr = np.frombuffer(img_data, np.uint8)
        image = cv2.imdecode(nparr, cv2.IMREAD_UNCHANGED)
        if image is None:
            raise ValueError("Failed to decode base64 image")
        return image

    def enhance(
        self,
        image: np.ndarray,
        custom_prompt: Optional[str] = None,
    ) -> GeminiEnhancementResult:
        """
        Enhance a fingerprint image using Gemini's image generation.

        Args:
            image: Input fingerprint image as numpy array
            custom_prompt: Optional custom enhancement prompt

        Returns:
            GeminiEnhancementResult with enhanced image or error details
        """
        try:
            self._initialize_client()

            # Convert image to grayscale if color
            if len(image.shape) == 3:
                gray = cv2.cvtColor(image, cv2.COLOR_BGR2GRAY)
            else:
                gray = image.copy()

            # Encode image to base64
            image_b64 = self._image_to_base64(gray)

            # Create the image part
            image_part = types.Part.from_bytes(
                data=base64.b64decode(image_b64),
                mime_type="image/png",
            )

            # Build the prompt
            prompt_text = custom_prompt or self.ENHANCEMENT_PROMPT

            # Create content
            contents = [
                types.Content(
                    role="user",
                    parts=[
                        image_part,
                        types.Part.from_text(text=prompt_text),
                    ],
                ),
            ]

            # Configure generation
            generate_config = types.GenerateContentConfig(
                temperature=0.7,  # Lower for more consistent results
                top_p=0.95,
                max_output_tokens=8192,
                response_modalities=["TEXT", "IMAGE"],
                safety_settings=[
                    types.SafetySetting(
                        category="HARM_CATEGORY_HATE_SPEECH", threshold="OFF"
                    ),
                    types.SafetySetting(
                        category="HARM_CATEGORY_DANGEROUS_CONTENT", threshold="OFF"
                    ),
                    types.SafetySetting(
                        category="HARM_CATEGORY_SEXUALLY_EXPLICIT", threshold="OFF"
                    ),
                    types.SafetySetting(
                        category="HARM_CATEGORY_HARASSMENT", threshold="OFF"
                    ),
                ],
            )

            # Generate enhanced image
            enhanced_image = None
            text_response = ""

            for chunk in self.client.models.generate_content_stream(
                model=self.model_name,
                contents=contents,
                config=generate_config,
            ):
                # Check for image in response
                if hasattr(chunk, "candidates") and chunk.candidates:
                    for candidate in chunk.candidates:
                        if hasattr(candidate, "content") and candidate.content:
                            for part in candidate.content.parts:
                                try:
                                    if (
                                        hasattr(part, "inline_data")
                                        and part.inline_data
                                    ):
                                        # Extract image data
                                        img_data = part.inline_data.data
                                        data_len = len(img_data) if img_data else 0
                                        logger.info(
                                            f"Received inline_data, type: {type(img_data)}, length: {data_len}"
                                        )

                                        if isinstance(img_data, str):
                                            # Base64 string
                                            enhanced_image = self._base64_to_image(
                                                img_data
                                            )
                                        elif isinstance(img_data, bytes):
                                            # Check if data starts with JPEG or PNG magic bytes
                                            if img_data[:2] == b"\xff\xd8":
                                                logger.info("Detected JPEG format")
                                            elif img_data[:8] == b"\x89PNG\r\n\x1a\n":
                                                logger.info("Detected PNG format")
                                            else:
                                                # Might be base64 encoded as bytes - try to decode
                                                logger.info(
                                                    f"First 20 bytes: {img_data[:20]}"
                                                )
                                                try:
                                                    decoded = base64.b64decode(img_data)
                                                    img_data = decoded
                                                    logger.info(
                                                        f"Decoded base64, new length: {len(img_data)}"
                                                    )
                                                except Exception:
                                                    pass  # Not base64

                                            # Try to decode image
                                            nparr = np.frombuffer(img_data, np.uint8)
                                            enhanced_image = cv2.imdecode(
                                                nparr, cv2.IMREAD_UNCHANGED
                                            )
                                        else:
                                            logger.warning(
                                                f"Unknown data type: {type(img_data)}"
                                            )

                                        if enhanced_image is not None:
                                            logger.info(
                                                f"Image decoded successfully, shape: {enhanced_image.shape}"
                                            )
                                        else:
                                            logger.warning("cv2.imdecode returned None")
                                    elif hasattr(part, "text") and part.text:
                                        text_response += part.text
                                except Exception as part_error:
                                    logger.warning(
                                        f"Error processing part: {part_error}"
                                    )

                # Also check direct text attribute (wrapped in try-catch as .text throws on image parts)
                try:
                    if hasattr(chunk, "text") and chunk.text:
                        text_response += chunk.text
                except Exception:
                    # Expected when chunk contains image data instead of text
                    pass

            if enhanced_image is None:
                return GeminiEnhancementResult(
                    enhanced_image=gray,
                    original_image=gray,
                    success=False,
                    error_message="No image returned from Gemini",
                    text_response=text_response,
                )

            # Ensure grayscale output
            if len(enhanced_image.shape) == 3:
                enhanced_image = cv2.cvtColor(enhanced_image, cv2.COLOR_BGR2GRAY)

            # Resize to match original if needed
            if enhanced_image.shape != gray.shape:
                enhanced_image = cv2.resize(
                    enhanced_image, (gray.shape[1], gray.shape[0])
                )

            logger.info("Gemini enhancement completed successfully")

            return GeminiEnhancementResult(
                enhanced_image=enhanced_image,
                original_image=gray,
                success=True,
                text_response=text_response,
            )

        except Exception as e:
            logger.error(f"Gemini enhancement failed: {e}")
            return GeminiEnhancementResult(
                enhanced_image=(
                    image
                    if len(image.shape) == 2
                    else cv2.cvtColor(image, cv2.COLOR_BGR2GRAY)
                ),
                original_image=(
                    image
                    if len(image.shape) == 2
                    else cv2.cvtColor(image, cv2.COLOR_BGR2GRAY)
                ),
                success=False,
                error_message=str(e),
            )

    async def enhance_async(
        self,
        image: np.ndarray,
        custom_prompt: Optional[str] = None,
    ) -> GeminiEnhancementResult:
        """
        Async version of enhance for use in async contexts.
        Note: The underlying Gemini SDK may not be fully async,
        so this wraps the sync method.
        """
        import asyncio

        loop = asyncio.get_event_loop()
        return await loop.run_in_executor(
            None, lambda: self.enhance(image, custom_prompt)
        )


# Singleton instance
_gemini_enhancer: Optional[GeminiImageEnhancer] = None


def get_gemini_enhancer() -> GeminiImageEnhancer:
    """Get or create the Gemini enhancer singleton"""
    global _gemini_enhancer
    if _gemini_enhancer is None:
        _gemini_enhancer = GeminiImageEnhancer()
    return _gemini_enhancer
