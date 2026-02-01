"""
Visualization for Back Photo Analysis

Draws pose landmarks and asymmetry indicators on back photos.
"""

import cv2
import numpy as np
from PIL import Image
from typing import List, Tuple
from io import BytesIO
import base64

from .mediapipe_analyzer import (
    Landmark, AsymmetryMetrics, PoseLandmark, RiskLevel,
    estimate_derived_landmarks, DerivedLandmarks
)


# Color palette (BGR for OpenCV) - matches design system
COLORS = {
    "primary": (97, 155, 63),       # #3F9B61 - Primary green
    "primary_light": (115, 175, 76), # #4CAF73 - Primary light
    "warning": (0, 165, 255),        # Orange
    "danger": (0, 0, 255),           # Red
    "light": (239, 247, 239),        # #EFF7EF - Light background
    "dark": (50, 45, 41),            # #292D32 - Dark text
    "white": (255, 255, 255),
    "skeleton": (180, 180, 180),     # Gray for skeleton lines
}


def get_color_for_risk(risk_level: RiskLevel) -> Tuple[int, int, int]:
    """Get color based on risk level."""
    if risk_level == RiskLevel.HIGH:
        return COLORS["danger"]
    elif risk_level == RiskLevel.MEDIUM:
        return COLORS["warning"]
    return COLORS["primary"]


def draw_pose_overlay(
    image: Image.Image,
    landmarks: List[Landmark],
    metrics: AsymmetryMetrics,
    risk_level: RiskLevel
) -> np.ndarray:
    """
    Draw pose landmarks and asymmetry indicators on the image.

    Args:
        image: Original PIL Image
        landmarks: List of 33 MediaPipe pose landmarks
        metrics: Calculated asymmetry metrics
        risk_level: Assessed risk level

    Returns:
        Annotated image as numpy array (RGB)
    """
    # Convert PIL to numpy (RGB to BGR for OpenCV)
    img_np = np.array(image)
    if len(img_np.shape) == 2:
        img_np = cv2.cvtColor(img_np, cv2.COLOR_GRAY2BGR)
    elif img_np.shape[2] == 4:
        img_np = cv2.cvtColor(img_np, cv2.COLOR_RGBA2BGR)
    else:
        img_np = cv2.cvtColor(img_np, cv2.COLOR_RGB2BGR)

    height, width = img_np.shape[:2]

    # Scale factor for line thickness based on image size
    scale = min(width, height) / 800
    line_thickness = max(2, int(4 * scale))
    point_radius = max(6, int(12 * scale))
    font_scale = max(0.5, 0.7 * scale)

    # Get key landmark coordinates with visibility check
    def get_point(idx: int) -> Tuple[int, int]:
        lm = landmarks[idx]
        return (int(lm.x * width), int(lm.y * height))

    def get_visibility(idx: int) -> float:
        return landmarks[idx].visibility

    # Get shoulder and hip landmarks
    left_shoulder = get_point(PoseLandmark.LEFT_SHOULDER)
    right_shoulder = get_point(PoseLandmark.RIGHT_SHOULDER)
    left_hip = get_point(PoseLandmark.LEFT_HIP)
    right_hip = get_point(PoseLandmark.RIGHT_HIP)

    left_shoulder_vis = get_visibility(PoseLandmark.LEFT_SHOULDER)
    right_shoulder_vis = get_visibility(PoseLandmark.RIGHT_SHOULDER)
    left_hip_vis = get_visibility(PoseLandmark.LEFT_HIP)
    right_hip_vis = get_visibility(PoseLandmark.RIGHT_HIP)

    # Get derived landmarks (waist, axilla) for HAI visualization
    derived = estimate_derived_landmarks(landmarks)

    # Convert derived landmarks to pixel coordinates
    left_waist = (int(derived.left_waist[0] * width), int(derived.left_waist[1] * height))
    right_waist = (int(derived.right_waist[0] * width), int(derived.right_waist[1] * height))
    left_axilla = (int(derived.left_axilla[0] * width), int(derived.left_axilla[1] * height))
    right_axilla = (int(derived.right_axilla[0] * width), int(derived.right_axilla[1] * height))

    # Calculate midpoints
    shoulder_mid = (
        (left_shoulder[0] + right_shoulder[0]) // 2,
        (left_shoulder[1] + right_shoulder[1]) // 2
    )
    hip_mid = (
        (left_hip[0] + right_hip[0]) // 2,
        (left_hip[1] + right_hip[1]) // 2
    )
    waist_mid = (
        (left_waist[0] + right_waist[0]) // 2,
        (left_waist[1] + right_waist[1]) // 2
    )
    axilla_mid = (
        (left_axilla[0] + right_axilla[0]) // 2,
        (left_axilla[1] + right_axilla[1]) // 2
    )

    # Create semi-transparent overlay
    overlay = img_np.copy()

    # Draw skeleton connections with visibility-based opacity
    skeleton_connections = [
        (PoseLandmark.LEFT_SHOULDER, PoseLandmark.RIGHT_SHOULDER),
        (PoseLandmark.LEFT_HIP, PoseLandmark.RIGHT_HIP),
        (PoseLandmark.LEFT_SHOULDER, PoseLandmark.LEFT_HIP),
        (PoseLandmark.RIGHT_SHOULDER, PoseLandmark.RIGHT_HIP),
    ]

    for start_idx, end_idx in skeleton_connections:
        start_point = get_point(start_idx)
        end_point = get_point(end_idx)
        cv2.line(overlay, start_point, end_point, COLORS["skeleton"], line_thickness)

    # Draw trunk midline (shoulder mid to hip mid)
    color = get_color_for_risk(risk_level)
    cv2.line(overlay, shoulder_mid, hip_mid, color, line_thickness + 2)

    # Draw horizontal reference lines at shoulder and hip levels
    line_extend = int(width * 0.12)

    # Shoulder level line - draw as actual line between points
    shoulder_color = COLORS["warning"] if metrics.shoulder_height_diff_pct > 2 else COLORS["primary"]
    cv2.line(
        overlay,
        (min(left_shoulder[0], right_shoulder[0]) - line_extend, left_shoulder[1]),
        (max(left_shoulder[0], right_shoulder[0]) + line_extend, right_shoulder[1]),
        shoulder_color,
        line_thickness
    )

    # Draw a horizontal reference line at average shoulder height
    avg_shoulder_y = (left_shoulder[1] + right_shoulder[1]) // 2
    cv2.line(
        overlay,
        (min(left_shoulder[0], right_shoulder[0]) - line_extend, avg_shoulder_y),
        (max(left_shoulder[0], right_shoulder[0]) + line_extend, avg_shoulder_y),
        (200, 200, 200),  # Light gray reference
        1,
        cv2.LINE_AA
    )

    # Axillary fold level line (HAI component)
    axilla_color = COLORS["warning"] if metrics.axilla_height_diff_pct > 2.5 else COLORS["primary"]
    cv2.line(
        overlay,
        (min(left_axilla[0], right_axilla[0]) - line_extend // 2, left_axilla[1]),
        (max(left_axilla[0], right_axilla[0]) + line_extend // 2, right_axilla[1]),
        axilla_color,
        line_thickness
    )

    # Waist crease level line (HAI component)
    waist_color = COLORS["warning"] if metrics.waist_height_diff_pct > 1.5 else COLORS["primary"]
    cv2.line(
        overlay,
        (min(left_waist[0], right_waist[0]) - line_extend, left_waist[1]),
        (max(left_waist[0], right_waist[0]) + line_extend, right_waist[1]),
        waist_color,
        line_thickness
    )

    # Hip level line
    hip_color = COLORS["warning"] if metrics.hip_height_diff_pct > 1.5 else COLORS["primary"]
    cv2.line(
        overlay,
        (min(left_hip[0], right_hip[0]) - line_extend, left_hip[1]),
        (max(left_hip[0], right_hip[0]) + line_extend, right_hip[1]),
        hip_color,
        line_thickness
    )

    # Draw horizontal reference lines at each level
    avg_shoulder_y = (left_shoulder[1] + right_shoulder[1]) // 2
    avg_axilla_y = (left_axilla[1] + right_axilla[1]) // 2
    avg_waist_y = (left_waist[1] + right_waist[1]) // 2
    avg_hip_y = (left_hip[1] + right_hip[1]) // 2

    for avg_y in [avg_shoulder_y, avg_axilla_y, avg_waist_y, avg_hip_y]:
        cv2.line(
            overlay,
            (min(left_hip[0], right_hip[0]) - line_extend, avg_y),
            (max(left_hip[0], right_hip[0]) + line_extend, avg_y),
            (200, 200, 200),  # Light gray reference
            1,
            cv2.LINE_AA
        )

    # Draw vertical reference line (ideal spine alignment)
    # Solid line from hip midpoint straight up
    cv2.line(
        overlay,
        (hip_mid[0], hip_mid[1]),
        (hip_mid[0], shoulder_mid[1] - int(height * 0.03)),
        (180, 180, 180),
        2,
        cv2.LINE_AA
    )

    # Draw landmark points with labels
    # Primary landmarks (from MediaPipe)
    # Note: MediaPipe uses subject's perspective (LEFT_SHOULDER = subject's left)
    # For back photos, we label from VIEWER's perspective:
    # - Subject's left shoulder appears on viewer's right → label as "R.Sh"
    # - Subject's right shoulder appears on viewer's left → label as "L.Sh"
    landmark_info = [
        (PoseLandmark.LEFT_SHOULDER, left_shoulder, left_shoulder_vis, "R.Sh"),
        (PoseLandmark.RIGHT_SHOULDER, right_shoulder, right_shoulder_vis, "L.Sh"),
        (PoseLandmark.LEFT_HIP, left_hip, left_hip_vis, "R.Hip"),
        (PoseLandmark.RIGHT_HIP, right_hip, right_hip_vis, "L.Hip"),
    ]

    # Derived landmarks (HAI components) - drawn smaller with different style
    derived_landmark_info = [
        (left_axilla, "Ax", axilla_color),
        (right_axilla, "Ax", axilla_color),
        (left_waist, "W", waist_color),
        (right_waist, "W", waist_color),
    ]

    # Draw derived landmarks first (smaller, behind primary)
    derived_radius = max(4, int(8 * scale))
    for point, label, pt_color in derived_landmark_info:
        # Outer circle (white border)
        cv2.circle(overlay, point, derived_radius + 2, COLORS["white"], -1)
        # Inner circle (colored)
        cv2.circle(overlay, point, derived_radius, pt_color, -1)
        # Draw small label
        cv2.putText(
            overlay, label,
            (point[0] + 8, point[1] + 4),
            cv2.FONT_HERSHEY_SIMPLEX,
            font_scale * 0.5,
            pt_color,
            max(1, int(font_scale * 1.5)),
            cv2.LINE_AA
        )

    for idx, point, vis, label in landmark_info:
        # Color based on visibility (green = good, yellow = medium, red = low)
        if vis > 0.7:
            pt_color = COLORS["primary"]
        elif vis > 0.4:
            pt_color = COLORS["warning"]
        else:
            pt_color = COLORS["danger"]

        # Draw outer circle (white border)
        cv2.circle(overlay, point, point_radius + 3, COLORS["white"], -1)
        # Draw inner circle (colored based on visibility)
        cv2.circle(overlay, point, point_radius, pt_color, -1)
        # Draw center dot
        cv2.circle(overlay, point, 3, COLORS["white"], -1)

        # Draw label near the point
        # Labels with "L." are now on left side of image, offset to the right (toward center)
        # Labels with "R." are now on right side of image, offset to the left (toward center)
        label_offset_x = -50 if "R." in label else 15
        label_pos = (point[0] + label_offset_x, point[1] - 10)
        cv2.putText(
            overlay, label,
            label_pos,
            cv2.FONT_HERSHEY_SIMPLEX,
            font_scale * 0.7,
            COLORS["white"],
            max(1, int(font_scale * 3)),
            cv2.LINE_AA
        )
        cv2.putText(
            overlay, label,
            label_pos,
            cv2.FONT_HERSHEY_SIMPLEX,
            font_scale * 0.7,
            pt_color,
            max(1, int(font_scale * 1.5)),
            cv2.LINE_AA
        )

    # Draw midpoint markers (smaller, different color)
    cv2.circle(overlay, shoulder_mid, point_radius - 3, COLORS["white"], -1)
    cv2.circle(overlay, shoulder_mid, point_radius - 5, COLORS["primary_light"], -1)
    cv2.circle(overlay, hip_mid, point_radius - 3, COLORS["white"], -1)
    cv2.circle(overlay, hip_mid, point_radius - 5, COLORS["primary_light"], -1)

    # Blend overlay with original
    alpha = 0.9
    img_np = cv2.addWeighted(overlay, alpha, img_np, 1 - alpha, 0)

    # Add metric labels with better positioning
    label_bg_color = (255, 255, 255)

    # Shoulder difference label (on the higher shoulder side)
    if metrics.shoulder_height_diff_pct > 1:
        label = f"Diff: {metrics.shoulder_height_diff_pct:.1f}%"
        # Position near the middle right
        label_pos = (max(left_shoulder[0], right_shoulder[0]) + 20, avg_shoulder_y)
        _draw_label(img_np, label, label_pos, font_scale, shoulder_color, label_bg_color)

    # Hip difference label
    if metrics.hip_height_diff_pct > 1:
        label = f"Diff: {metrics.hip_height_diff_pct:.1f}%"
        label_pos = (max(left_hip[0], right_hip[0]) + 20, avg_hip_y)
        _draw_label(img_np, label, label_pos, font_scale, hip_color, label_bg_color)

    # Trunk shift label
    if metrics.trunk_shift_pct > 2.5:
        label = f"Shift: {metrics.trunk_shift_pct:.1f}%"
        mid_y = (shoulder_mid[1] + hip_mid[1]) // 2
        label_pos = (max(shoulder_mid[0], hip_mid[0]) + 20, mid_y)
        _draw_label(img_np, label, label_pos, font_scale, color, label_bg_color)

    # Convert back to RGB
    img_rgb = cv2.cvtColor(img_np, cv2.COLOR_BGR2RGB)

    return img_rgb


def _draw_label(
    img: np.ndarray,
    text: str,
    position: Tuple[int, int],
    font_scale: float,
    text_color: Tuple[int, int, int],
    bg_color: Tuple[int, int, int]
):
    """Draw a label with background."""
    font = cv2.FONT_HERSHEY_SIMPLEX
    thickness = max(1, int(font_scale * 2))

    # Get text size
    (text_width, text_height), baseline = cv2.getTextSize(
        text, font, font_scale, thickness
    )

    # Draw background rectangle
    padding = 4
    x, y = position
    cv2.rectangle(
        img,
        (x - padding, y - text_height - padding),
        (x + text_width + padding, y + padding),
        bg_color,
        -1
    )

    # Draw text
    cv2.putText(
        img, text, (x, y),
        font, font_scale, text_color, thickness, cv2.LINE_AA
    )


def image_to_base64(image_np: np.ndarray) -> str:
    """
    Convert numpy array image to base64 encoded PNG.

    Args:
        image_np: Image as numpy array (RGB)

    Returns:
        Base64 encoded PNG with data URL prefix
    """
    # Ensure RGB if grayscale
    if len(image_np.shape) == 2:
        image_np = np.stack([image_np] * 3, axis=-1)

    # Convert to PIL
    pil_image = Image.fromarray(image_np)

    # Save to bytes
    buffer = BytesIO()
    pil_image.save(buffer, format="PNG", optimize=True)
    buffer.seek(0)

    # Encode to base64
    encoded = base64.b64encode(buffer.getvalue()).decode("utf-8")

    return f"data:image/png;base64,{encoded}"
