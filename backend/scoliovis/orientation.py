"""
X-ray orientation detection using OCR to find L/R markers.

Standard PA X-ray convention:
- "R" marker placed on patient's right side
- In standard orientation, "R" appears on LEFT side of image (viewer's left)
- If "R" appears on RIGHT side, image is flipped/mirrored
"""

import numpy as np
from PIL import Image
from typing import Optional
import cv2

from api.schemas import (
    ImageOrientation,
    DetectedMarker,
    OrientationDetectionResult,
)

# Lazy-loaded EasyOCR reader
_reader = None


def get_ocr_reader():
    """Lazy load EasyOCR reader to avoid startup delay."""
    global _reader
    if _reader is None:
        import easyocr
        _reader = easyocr.Reader(['en'], gpu=False, verbose=False)
    return _reader


def detect_lr_marker(image: Image.Image) -> OrientationDetectionResult:
    """
    Detect L or R marker on X-ray image using OCR.

    L/R markers are typically placed in corners of clinical X-rays.
    Standard PA view: "R" marker on patient's right side (appears on left of image)

    Args:
        image: PIL Image of the X-ray

    Returns:
        OrientationDetectionResult with detected marker and suggested orientation
    """
    reader = get_ocr_reader()
    image_np = np.array(image.convert('RGB'))

    height, width = image_np.shape[:2]

    # Define corner regions to search (markers are usually in corners)
    # Search top and bottom corners, 20% of image dimensions
    corner_size_w = int(width * 0.2)
    corner_size_h = int(height * 0.15)

    corners = {
        "left": [
            (0, 0, corner_size_w, corner_size_h),  # top-left
            (0, height - corner_size_h, corner_size_w, height),  # bottom-left
        ],
        "right": [
            (width - corner_size_w, 0, width, corner_size_h),  # top-right
            (width - corner_size_w, height - corner_size_h, width, height),  # bottom-right
        ],
    }

    detected_marker = None
    best_confidence = 0.0

    for position, regions in corners.items():
        for (x1, y1, x2, y2) in regions:
            # Crop corner region
            corner_img = image_np[y1:y2, x1:x2]

            # Run OCR on corner - only allow L, R characters
            try:
                results = reader.readtext(corner_img, detail=1, allowlist='LRlr')

                for (_bbox, text, confidence) in results:
                    text_upper = text.upper().strip()

                    # Check for L or R marker with reasonable confidence
                    if text_upper in ['L', 'R'] and confidence > 0.4:
                        if confidence > best_confidence:
                            best_confidence = confidence
                            detected_marker = DetectedMarker(
                                marker=text_upper,
                                position=position,
                                confidence=round(confidence, 3)
                            )
            except Exception:
                # OCR can fail on some images, continue to next region
                continue

    # Determine suggested orientation based on detected marker
    if detected_marker:
        suggested_orientation = determine_orientation_from_marker(detected_marker)
        return OrientationDetectionResult(
            detected_marker=detected_marker,
            suggested_orientation=suggested_orientation,
            confidence=best_confidence
        )
    else:
        return OrientationDetectionResult(
            detected_marker=None,
            suggested_orientation=ImageOrientation.UNKNOWN,
            confidence=0.0
        )


def determine_orientation_from_marker(marker: DetectedMarker) -> ImageOrientation:
    """
    Determine image orientation from detected marker.

    Standard PA X-ray convention:
    - "R" marker placed on patient's right side
    - In standard orientation, "R" appears on LEFT side of image (viewer's left)
    - If "R" appears on RIGHT side, image is flipped

    Similarly for "L":
    - "L" marker placed on patient's left side
    - In standard orientation, "L" appears on RIGHT side of image
    - If "L" appears on LEFT side, image is flipped
    """
    if marker.marker == "R":
        if marker.position == "left":
            return ImageOrientation.STANDARD
        else:
            return ImageOrientation.FLIPPED
    elif marker.marker == "L":
        if marker.position == "right":
            return ImageOrientation.STANDARD
        else:
            return ImageOrientation.FLIPPED

    return ImageOrientation.UNKNOWN


def flip_image_horizontal(image: Image.Image) -> Image.Image:
    """Flip image horizontally (mirror)."""
    return image.transpose(Image.FLIP_LEFT_RIGHT)


def draw_marker_highlight(
    image_np: np.ndarray,
    marker: DetectedMarker
) -> np.ndarray:
    """
    Draw a highlight box around the detected marker position.
    Used for preview image to show user what was detected.

    Args:
        image_np: NumPy array of the image (RGB)
        marker: Detected marker with position info

    Returns:
        Image with highlight drawn
    """
    height, width = image_np.shape[:2]
    result = image_np.copy()

    # Determine corner region based on marker position
    corner_size_w = int(width * 0.2)
    corner_size_h = int(height * 0.15)

    if marker.position == "left":
        # Check top-left first, assume marker is there
        x1, y1, x2, y2 = 0, 0, corner_size_w, corner_size_h
    else:
        x1, y1, x2, y2 = width - corner_size_w, 0, width, corner_size_h

    # Draw rectangle with primary green color (RGB: 63, 155, 97 -> BGR for OpenCV)
    cv2.rectangle(result, (x1, y1), (x2, y2), (63, 155, 97), 3)

    # Add label
    label = f"Detected: {marker.marker}"
    font_scale = max(0.5, min(width, height) / 1000)
    thickness = max(1, int(min(width, height) / 500))
    cv2.putText(
        result, label,
        (x1 + 10, y2 + 25),
        cv2.FONT_HERSHEY_SIMPLEX,
        font_scale,
        (63, 155, 97),
        thickness
    )

    return result
