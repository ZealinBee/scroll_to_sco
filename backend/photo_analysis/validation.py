"""
Photo Validation for Back Photo Analysis

Validates that uploaded photos are suitable for scoliosis screening analysis.
"""

from PIL import Image
from typing import Tuple, Optional
from dataclasses import dataclass

from .mediapipe_analyzer import detect_pose_landmarks, PoseLandmark


@dataclass
class PhotoValidationResult:
    """Result of photo validation."""
    is_valid: bool
    error_message: Optional[str] = None
    guidance: Optional[str] = None


# Validation thresholds
MIN_IMAGE_SIZE = 256
MAX_IMAGE_SIZE = 4096
MIN_LANDMARK_VISIBILITY = 0.5
REQUIRED_LANDMARKS = [
    PoseLandmark.LEFT_SHOULDER,
    PoseLandmark.RIGHT_SHOULDER,
    PoseLandmark.LEFT_HIP,
    PoseLandmark.RIGHT_HIP,
]


def validate_photo_for_analysis(image: Image.Image) -> PhotoValidationResult:
    """
    Validate that a photo is suitable for back analysis.

    Checks:
    1. Image size is within acceptable range
    2. A person is detected in the image
    3. Key landmarks (shoulders, hips) are visible
    4. Person appears to be showing their back

    Args:
        image: PIL Image to validate

    Returns:
        PhotoValidationResult with validation status and any guidance
    """
    # Check image dimensions
    width, height = image.size

    if width < MIN_IMAGE_SIZE or height < MIN_IMAGE_SIZE:
        return PhotoValidationResult(
            is_valid=False,
            error_message=f"Image too small. Minimum size is {MIN_IMAGE_SIZE}x{MIN_IMAGE_SIZE} pixels.",
            guidance="Please use a higher resolution image."
        )

    if width > MAX_IMAGE_SIZE or height > MAX_IMAGE_SIZE:
        return PhotoValidationResult(
            is_valid=False,
            error_message=f"Image too large. Maximum size is {MAX_IMAGE_SIZE}x{MAX_IMAGE_SIZE} pixels.",
            guidance="Please resize the image to a smaller size."
        )

    # Detect pose
    landmarks, confidence = detect_pose_landmarks(image)

    if landmarks is None:
        return PhotoValidationResult(
            is_valid=False,
            error_message="No person detected in the image.",
            guidance="Please ensure your full back is visible in the frame. Stand 4-6 feet from the camera."
        )

    # Check that key landmarks are visible
    low_visibility_parts = []
    for landmark_idx in REQUIRED_LANDMARKS:
        if landmarks[landmark_idx].visibility < MIN_LANDMARK_VISIBILITY:
            landmark_names = {
                PoseLandmark.LEFT_SHOULDER: "left shoulder",
                PoseLandmark.RIGHT_SHOULDER: "right shoulder",
                PoseLandmark.LEFT_HIP: "left hip",
                PoseLandmark.RIGHT_HIP: "right hip",
            }
            low_visibility_parts.append(landmark_names.get(landmark_idx, f"landmark {landmark_idx}"))

    if low_visibility_parts:
        parts_str = ", ".join(low_visibility_parts)
        return PhotoValidationResult(
            is_valid=False,
            error_message=f"Cannot clearly detect: {parts_str}.",
            guidance="Please ensure your full back from shoulders to hips is visible. Remove any obstructions and try again."
        )

    # Check image orientation (person should be roughly vertical)
    left_shoulder = landmarks[PoseLandmark.LEFT_SHOULDER]
    right_shoulder = landmarks[PoseLandmark.RIGHT_SHOULDER]
    left_hip = landmarks[PoseLandmark.LEFT_HIP]
    right_hip = landmarks[PoseLandmark.RIGHT_HIP]

    # Calculate vertical extent
    shoulder_y = (left_shoulder.y + right_shoulder.y) / 2
    hip_y = (left_hip.y + right_hip.y) / 2

    if hip_y < shoulder_y:
        return PhotoValidationResult(
            is_valid=False,
            error_message="Image appears to be upside down.",
            guidance="Please rotate the image so the person is right-side up."
        )

    # Check that person is centered enough
    shoulder_x = (left_shoulder.x + right_shoulder.x) / 2
    hip_x = (left_hip.x + right_hip.x) / 2
    avg_x = (shoulder_x + hip_x) / 2

    if avg_x < 0.2 or avg_x > 0.8:
        return PhotoValidationResult(
            is_valid=False,
            error_message="Person is not centered in the frame.",
            guidance="Please position yourself in the center of the frame."
        )

    # Check that back is mostly visible (not too close or too far)
    shoulder_hip_distance = abs(hip_y - shoulder_y)

    if shoulder_hip_distance < 0.15:
        return PhotoValidationResult(
            is_valid=False,
            error_message="Person appears too far from the camera.",
            guidance="Please move closer to the camera (4-6 feet away)."
        )

    if shoulder_hip_distance > 0.7:
        return PhotoValidationResult(
            is_valid=False,
            error_message="Person appears too close to the camera.",
            guidance="Please move further from the camera (4-6 feet away)."
        )

    # All checks passed
    return PhotoValidationResult(
        is_valid=True,
        error_message=None,
        guidance=None
    )
