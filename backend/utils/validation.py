import io
import base64
import numpy as np
from PIL import Image
from typing import Tuple, Dict, Any


class ValidationError(Exception):
    """Custom exception for validation errors."""
    def __init__(self, message: str, error_code: str):
        self.message = message
        self.error_code = error_code
        super().__init__(message)


class ErrorCodes:
    INVALID_IMAGE_FORMAT = "INVALID_IMAGE_FORMAT"
    IMAGE_TOO_SMALL = "IMAGE_TOO_SMALL"
    IMAGE_TOO_LARGE = "IMAGE_TOO_LARGE"
    INVALID_BASE64 = "INVALID_BASE64"
    NO_SPINE_DETECTED = "NO_SPINE_DETECTED"
    INSUFFICIENT_VERTEBRAE = "INSUFFICIENT_VERTEBRAE"
    LOW_CONFIDENCE = "LOW_CONFIDENCE"
    MODEL_ERROR = "MODEL_ERROR"


# Validation constants
MIN_DIMENSION = 256
MAX_DIMENSION = 4096
MIN_VERTEBRAE = 5
MIN_CONFIDENCE = 0.3


def validate_base64_image(base64_string: str) -> Image.Image:
    """
    Validate and decode a base64 encoded image string.

    Args:
        base64_string: Base64 encoded image (with or without data URL prefix)

    Returns:
        PIL Image object

    Raises:
        ValidationError: If the image is invalid
    """
    try:
        # Handle data URL prefix
        if "," in base64_string:
            base64_string = base64_string.split(",")[1]

        # Decode base64
        image_data = base64.b64decode(base64_string)

        # Open as PIL Image
        image = Image.open(io.BytesIO(image_data))

        # Verify it's a valid image
        image.verify()

        # Re-open after verify (verify() can leave the image in an invalid state)
        image = Image.open(io.BytesIO(image_data))

        return image

    except base64.binascii.Error:
        raise ValidationError(
            "Invalid base64 encoding. Please provide a valid base64 image string.",
            ErrorCodes.INVALID_BASE64
        )
    except Exception as e:
        raise ValidationError(
            f"Invalid image file: {str(e)}. Please upload a valid JPG or PNG image.",
            ErrorCodes.INVALID_IMAGE_FORMAT
        )


def validate_image_format(image: Image.Image) -> None:
    """
    Validate that the image format is supported.

    Args:
        image: PIL Image object

    Raises:
        ValidationError: If the format is not supported
    """
    supported_formats = ["JPEG", "JPG", "PNG", "WEBP"]

    if image.format and image.format.upper() not in supported_formats:
        raise ValidationError(
            f"Unsupported image format: {image.format}. Please use JPG, PNG, or WEBP.",
            ErrorCodes.INVALID_IMAGE_FORMAT
        )


def validate_image_dimensions(image: Image.Image) -> None:
    """
    Check that image dimensions are within acceptable range.

    Args:
        image: PIL Image object

    Raises:
        ValidationError: If dimensions are out of range
    """
    width, height = image.size

    if width < MIN_DIMENSION or height < MIN_DIMENSION:
        raise ValidationError(
            f"Image too small ({width}x{height}). Minimum size is {MIN_DIMENSION}x{MIN_DIMENSION} pixels.",
            ErrorCodes.IMAGE_TOO_SMALL
        )

    if width > MAX_DIMENSION or height > MAX_DIMENSION:
        raise ValidationError(
            f"Image too large ({width}x{height}). Maximum size is {MAX_DIMENSION}x{MAX_DIMENSION} pixels.",
            ErrorCodes.IMAGE_TOO_LARGE
        )


def validate_detection_results(
    filtered_outputs: Dict[str, Any],
    min_vertebrae: int = MIN_VERTEBRAE,
    min_confidence: float = MIN_CONFIDENCE
) -> None:
    """
    Validate that the detection results are sufficient for analysis.

    Args:
        filtered_outputs: Dictionary with boxes, scores, keypoints
        min_vertebrae: Minimum number of vertebrae required
        min_confidence: Minimum average confidence required

    Raises:
        ValidationError: If detection is insufficient
    """
    boxes = filtered_outputs.get("boxes", [])
    scores = filtered_outputs.get("scores", [])

    if len(boxes) == 0:
        raise ValidationError(
            "No spine detected in the image. Please ensure the X-ray clearly shows the spine.",
            ErrorCodes.NO_SPINE_DETECTED
        )

    if len(boxes) < min_vertebrae:
        raise ValidationError(
            f"Only {len(boxes)} vertebrae detected. At least {min_vertebrae} are needed for analysis.",
            ErrorCodes.INSUFFICIENT_VERTEBRAE
        )

    if scores:
        avg_confidence = sum(scores) / len(scores)
        if avg_confidence < min_confidence:
            raise ValidationError(
                f"Detection confidence is low ({avg_confidence:.1%}). Image quality may be insufficient.",
                ErrorCodes.LOW_CONFIDENCE
            )


def validate_image(base64_string: str) -> Image.Image:
    """
    Full validation pipeline for input images.

    Args:
        base64_string: Base64 encoded image

    Returns:
        Validated PIL Image object

    Raises:
        ValidationError: If any validation fails
    """
    # 1. Decode and validate base64
    image = validate_base64_image(base64_string)

    # 2. Validate format
    validate_image_format(image)

    # 3. Validate dimensions
    validate_image_dimensions(image)

    # 4. Convert to RGB if needed
    if image.mode != "RGB":
        image = image.convert("RGB")

    return image
