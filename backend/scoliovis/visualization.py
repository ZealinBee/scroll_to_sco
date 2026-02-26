import cv2
import numpy as np
import base64
from io import BytesIO
from PIL import Image
from typing import List, Tuple, Optional

from api.schemas import Vertebra, CobbAngleMeasurement


# Color scheme (BGR for OpenCV) matching the app's design
COLORS = {
    "vertebra_fill": (97, 155, 63),      # Primary green #3F9B61
    "vertebra_outline": (80, 127, 53),   # Darker green
    "keypoint": (255, 255, 255),         # White
    "keypoint_outline": (97, 155, 63),   # Green outline
    "spine_line": (115, 175, 76),        # Primary light #4CAF73
    "cobb_line": (0, 100, 255),          # Orange-red for Cobb lines
    "cobb_arc": (0, 165, 255),           # Orange for angle arc
    "label_text": (50, 45, 41),          # Dark #292D32
    "label_bg": (239, 247, 239),         # Light #EFF7EF
}


def draw_skeleton_overlay(
    image: np.ndarray,
    vertebrae: List[Vertebra],
    cobb_angles: List[CobbAngleMeasurement]
) -> np.ndarray:
    """
    Draw spine skeleton overlay on the X-ray image.

    Elements drawn:
    1. Vertebra quadrilaterals (semi-transparent fill)
    2. Keypoint markers (corner points)
    3. Spine centerline (smooth curve through centers)
    4. Cobb angle measurement lines
    5. Vertebrae labels

    Args:
        image: Input image as numpy array (RGB)
        vertebrae: List of detected vertebrae with keypoints
        cobb_angles: List of Cobb angle measurements

    Returns:
        Annotated image as numpy array (RGB)
    """
    # Convert RGB to BGR for OpenCV
    overlay = cv2.cvtColor(image, cv2.COLOR_RGB2BGR)
    h, w = overlay.shape[:2]

    # Calculate scale factor for line thickness based on image size
    scale = max(w, h) / 1000

    # 1. Draw vertebra shapes (semi-transparent)
    for vertebra in vertebrae:
        draw_vertebra_shape(overlay, vertebra, scale)

    # 2. Draw spine centerline
    draw_spine_centerline(overlay, vertebrae, scale)

    # 3. Draw Cobb angle measurements
    for cobb in cobb_angles:
        draw_cobb_angle_lines(overlay, vertebrae, cobb, scale)

    # 4. Draw keypoint markers
    for vertebra in vertebrae:
        draw_keypoints(overlay, vertebra, scale)

    # 5. Draw vertebra labels
    for vertebra in vertebrae:
        draw_vertebra_label(overlay, vertebra, scale)

    # Convert back to RGB
    result = cv2.cvtColor(overlay, cv2.COLOR_BGR2RGB)
    return result


def clamp_to_image(x: float, y: float, width: int, height: int) -> tuple:
    """Clamp coordinates to image bounds."""
    return (
        max(0, min(int(x), width - 1)),
        max(0, min(int(y), height - 1))
    )


def draw_vertebra_shape(img: np.ndarray, vertebra: Vertebra, scale: float):
    """Draw a semi-transparent quadrilateral for a vertebra."""
    kp = vertebra.keypoints
    h, w = img.shape[:2]

    if len(kp) < 4:
        return

    # Define polygon points (TL, TR, BR, BL order for proper quadrilateral)
    # Clamp to image bounds to prevent drawing outside
    pts = np.array([
        clamp_to_image(kp[0].x, kp[0].y, w, h),  # top-left
        clamp_to_image(kp[1].x, kp[1].y, w, h),  # top-right
        clamp_to_image(kp[3].x, kp[3].y, w, h),  # bottom-right
        clamp_to_image(kp[2].x, kp[2].y, w, h),  # bottom-left
    ], dtype=np.int32)

    # Draw semi-transparent fill
    overlay_copy = img.copy()
    cv2.fillPoly(overlay_copy, [pts], COLORS["vertebra_fill"])
    cv2.addWeighted(overlay_copy, 0.25, img, 0.75, 0, img)

    # Draw outline
    cv2.polylines(img, [pts], True, COLORS["vertebra_outline"],
                  thickness=max(1, int(2 * scale)), lineType=cv2.LINE_AA)


def draw_keypoints(img: np.ndarray, vertebra: Vertebra, scale: float):
    """Draw keypoint markers for a vertebra."""
    h, w = img.shape[:2]
    for kp in vertebra.keypoints:
        # Clamp to image bounds
        center = clamp_to_image(kp.x, kp.y, w, h)
        radius = max(3, int(4 * scale))

        # White filled circle
        cv2.circle(img, center, radius, COLORS["keypoint"], -1, cv2.LINE_AA)
        # Green outline
        cv2.circle(img, center, radius, COLORS["keypoint_outline"],
                   thickness=max(1, int(1.5 * scale)), lineType=cv2.LINE_AA)


def draw_spine_centerline(img: np.ndarray, vertebrae: List[Vertebra], scale: float):
    """Draw a smooth line through vertebra centers."""
    if len(vertebrae) < 2:
        return

    h, w = img.shape[:2]

    # Calculate centers
    centers = []
    for v in vertebrae:
        kp = v.keypoints
        if len(kp) >= 4:
            cx = (kp[0].x + kp[1].x + kp[2].x + kp[3].x) / 4
            cy = (kp[0].y + kp[1].y + kp[2].y + kp[3].y) / 4
            centers.append(clamp_to_image(cx, cy, w, h))

    if len(centers) < 2:
        return

    # Draw smooth curve through centers
    pts = np.array(centers, dtype=np.int32).reshape(-1, 1, 2)
    cv2.polylines(img, [pts], False, COLORS["spine_line"],
                  thickness=max(2, int(3 * scale)), lineType=cv2.LINE_AA)


def draw_cobb_angle_lines(
    img: np.ndarray,
    vertebrae: List[Vertebra],
    cobb: CobbAngleMeasurement,
    scale: float
):
    """Draw Cobb angle measurement lines and annotation."""
    # Find upper and lower vertebrae by label
    upper = None
    lower = None

    for v in vertebrae:
        if v.label == cobb.upper_vertebra:
            upper = v
        if v.label == cobb.lower_vertebra:
            lower = v

    if not upper or not lower:
        return

    h, w = img.shape[:2]
    extension = int(80 * scale)  # How far to extend lines

    # Upper endplate line
    upper_kp = upper.keypoints
    if len(upper_kp) >= 2:
        x1, y1 = int(upper_kp[0].x), int(upper_kp[0].y)
        x2, y2 = int(upper_kp[1].x), int(upper_kp[1].y)

        # Extend the line
        dx, dy = x2 - x1, y2 - y1
        length = np.sqrt(dx*dx + dy*dy)
        if length > 0:
            dx, dy = dx/length, dy/length
            ext_x1 = int(x1 - dx * extension)
            ext_y1 = int(y1 - dy * extension)
            ext_x2 = int(x2 + dx * extension)
            ext_y2 = int(y2 + dy * extension)

            # Clamp extended line endpoints to image bounds
            pt1 = clamp_to_image(ext_x1, ext_y1, w, h)
            pt2 = clamp_to_image(ext_x2, ext_y2, w, h)
            cv2.line(img, pt1, pt2,
                     COLORS["cobb_line"], thickness=max(2, int(2.5 * scale)), lineType=cv2.LINE_AA)

    # Lower endplate line
    lower_kp = lower.keypoints
    if len(lower_kp) >= 4:
        x1, y1 = int(lower_kp[2].x), int(lower_kp[2].y)
        x2, y2 = int(lower_kp[3].x), int(lower_kp[3].y)

        # Extend the line
        dx, dy = x2 - x1, y2 - y1
        length = np.sqrt(dx*dx + dy*dy)
        if length > 0:
            dx, dy = dx/length, dy/length
            ext_x1 = int(x1 - dx * extension)
            ext_y1 = int(y1 - dy * extension)
            ext_x2 = int(x2 + dx * extension)
            ext_y2 = int(y2 + dy * extension)

            # Clamp extended line endpoints to image bounds
            pt1 = clamp_to_image(ext_x1, ext_y1, w, h)
            pt2 = clamp_to_image(ext_x2, ext_y2, w, h)
            cv2.line(img, pt1, pt2,
                     COLORS["cobb_line"], thickness=max(2, int(2.5 * scale)), lineType=cv2.LINE_AA)

    # Draw angle annotation
    # Position it to the right of the curve
    upper_center_x = (upper_kp[0].x + upper_kp[1].x) / 2
    lower_center_x = (lower_kp[2].x + lower_kp[3].x) / 2
    mid_x = int(max(upper_center_x, lower_center_x) + 30 * scale)
    mid_y = int((upper_kp[0].y + lower_kp[2].y) / 2)

    # Clamp annotation position to image bounds
    mid_x = max(0, min(mid_x, w - 1))
    mid_y = max(0, min(mid_y, h - 1))

    # Draw angle text with background
    text = f"{cobb.angle:.1f}"
    font = cv2.FONT_HERSHEY_SIMPLEX
    font_scale = 0.6 * scale
    thickness = max(1, int(2 * scale))

    (text_w, text_h), baseline = cv2.getTextSize(text, font, font_scale, thickness)

    # Background rectangle - clamp to image bounds
    padding = int(5 * scale)
    rect_x1 = max(0, mid_x - padding)
    rect_y1 = max(0, mid_y - text_h - padding)
    rect_x2 = min(w - 1, mid_x + text_w + padding)
    rect_y2 = min(h - 1, mid_y + padding)

    cv2.rectangle(img, (rect_x1, rect_y1), (rect_x2, rect_y2), COLORS["label_bg"], -1)
    cv2.rectangle(img, (rect_x1, rect_y1), (rect_x2, rect_y2),
                  COLORS["cobb_line"], max(1, int(1 * scale)))

    # Text
    cv2.putText(img, text, (mid_x, mid_y),
                font, font_scale, COLORS["cobb_line"], thickness, cv2.LINE_AA)


def draw_vertebra_label(img: np.ndarray, vertebra: Vertebra, scale: float):
    """Draw vertebra label (e.g., T1, L5) to the right of the vertebra."""
    kp = vertebra.keypoints
    h, w = img.shape[:2]

    if len(kp) < 4:
        return

    # Position label to the right, clamped to image bounds
    label_x = int(max(kp[1].x, kp[3].x) + 10 * scale)
    label_y = int((kp[0].y + kp[2].y) / 2)
    label_x = max(0, min(label_x, w - 1))
    label_y = max(0, min(label_y, h - 1))

    # Draw label
    font = cv2.FONT_HERSHEY_SIMPLEX
    font_scale = 0.4 * scale
    thickness = max(1, int(1.5 * scale))

    cv2.putText(img, vertebra.label, (label_x, label_y),
                font, font_scale, COLORS["vertebra_fill"], thickness, cv2.LINE_AA)


def image_to_base64(image: np.ndarray) -> str:
    """Convert numpy array image to base64 string."""
    # Ensure RGB format
    if len(image.shape) == 2:  # Grayscale
        image = cv2.cvtColor(image, cv2.COLOR_GRAY2RGB)

    # Convert to PIL Image
    pil_image = Image.fromarray(image.astype(np.uint8))

    # Save to bytes
    buffer = BytesIO()
    pil_image.save(buffer, format="PNG")
    buffer.seek(0)

    # Encode to base64
    base64_string = base64.b64encode(buffer.read()).decode("utf-8")

    return f"data:image/png;base64,{base64_string}"
