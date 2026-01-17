import numpy as np
from typing import List, Tuple
from api.schemas import (
    Vertebra, CobbAngleMeasurement, SchrothType, CurveLocation,
    CurveDirection, Severity
)
from .cobb_angle import get_vertebra_center


def is_pelvis_balanced(vertebrae: List[Vertebra], threshold: float = 0.1) -> bool:
    """
    Determine if the pelvis is balanced based on the lowest vertebra (L5/S1) level.

    Balanced: The lower endplate is approximately horizontal.

    Args:
        vertebrae: List of detected vertebrae
        threshold: Maximum tilt ratio (relative to width) for "balanced"

    Returns:
        True if pelvis appears balanced, False otherwise
    """
    if len(vertebrae) < 5:
        return True  # Assume balanced if insufficient data

    # Use lowest vertebra as pelvic reference
    lowest = vertebrae[-1]
    kp = lowest.keypoints

    if len(kp) < 4:
        return True

    # Check horizontal deviation of lower endplate
    lower_left_y = kp[2].y
    lower_right_y = kp[3].y
    width = abs(kp[3].x - kp[2].x)

    if width == 0:
        return True

    deviation_ratio = abs(lower_right_y - lower_left_y) / width

    return deviation_ratio < threshold


def is_pelvis_lumbar_coupled(vertebrae: List[Vertebra]) -> bool:
    """
    Determine if the pelvis and lumbar spine deviate in the same direction (coupled).

    Coupled (3CP pattern): Pelvis shifts WITH the lumbar curve
    Uncoupled (4CP pattern): Pelvis shifts OPPOSITE to the lumbar curve

    Returns:
        True if coupled, False if uncoupled
    """
    if len(vertebrae) < 5:
        return True

    # Get reference midline from upper vertebrae
    upper_centers = [get_vertebra_center(v.keypoints)[0] for v in vertebrae[:3]]
    midline_x = np.mean(upper_centers)

    # Lumbar region (approximately L1-L4)
    lumbar_start = max(0, len(vertebrae) - 5)
    lumbar_end = len(vertebrae) - 1

    lumbar_segment = vertebrae[lumbar_start:lumbar_end]

    if not lumbar_segment:
        return True

    # Calculate average lateral position of lumbar vertebrae
    lumbar_x = np.mean([get_vertebra_center(v.keypoints)[0] for v in lumbar_segment])

    # Pelvis position (lowest vertebra center)
    pelvis_x = get_vertebra_center(vertebrae[-1].keypoints)[0]

    # Coupled if both deviate in the same direction from midline
    lumbar_direction = lumbar_x - midline_x
    pelvis_direction = pelvis_x - midline_x

    # Same sign = coupled (both left or both right of midline)
    return (lumbar_direction * pelvis_direction) > 0


def get_dominant_curve_region(
    cobb_angles: List[CobbAngleMeasurement]
) -> Tuple[CurveLocation, float]:
    """
    Determine which region (thoracic or lumbar) has the dominant curve.

    Returns:
        Tuple of (dominant location, angle)
    """
    thoracic_max = 0.0
    lumbar_max = 0.0

    for c in cobb_angles:
        if c.curve_location == CurveLocation.THORACIC:
            thoracic_max = max(thoracic_max, c.angle)
        elif c.curve_location in [CurveLocation.LUMBAR, CurveLocation.THORACOLUMBAR]:
            lumbar_max = max(lumbar_max, c.angle)

    if thoracic_max >= lumbar_max:
        return CurveLocation.THORACIC, thoracic_max
    else:
        return CurveLocation.LUMBAR, lumbar_max


def determine_schroth_type(
    cobb_angles: List[CobbAngleMeasurement],
    vertebrae: List[Vertebra]
) -> SchrothType:
    """
    Determine Schroth classification based on curve patterns and pelvis balance.

    Classification rules:
    - 3C: Major thoracic curve, balanced pelvis
    - 3CP: Long thoracic curve, unbalanced pelvis (pelvis coupled with lumbar)
    - 4C: Major lumbar/double curve, balanced pelvis
    - 4CP: Major lumbar curve, unbalanced pelvis (pelvis uncoupled with lumbar)
    """
    if not cobb_angles:
        return SchrothType.UNKNOWN

    # Analyze pelvis balance
    pelvis_balanced = is_pelvis_balanced(vertebrae)

    # Get dominant curve region
    dominant_region, dominant_angle = get_dominant_curve_region(cobb_angles)

    # Check for double curve pattern
    thoracic_angles = [c for c in cobb_angles if c.curve_location == CurveLocation.THORACIC]
    lumbar_angles = [c for c in cobb_angles
                     if c.curve_location in [CurveLocation.LUMBAR, CurveLocation.THORACOLUMBAR]]

    max_thoracic = max((c.angle for c in thoracic_angles), default=0)
    max_lumbar = max((c.angle for c in lumbar_angles), default=0)

    # Check if double major curve (both thoracic and lumbar are significant)
    is_double_curve = (
        max_thoracic >= 10 and max_lumbar >= 10 and
        abs(max_thoracic - max_lumbar) < 15  # Similar magnitude
    )

    # Classification logic
    if pelvis_balanced:
        if is_double_curve:
            return SchrothType.TYPE_4C  # Double curve with balanced pelvis
        elif max_thoracic > max_lumbar * 1.2:
            return SchrothType.TYPE_3C  # Thoracic dominant, balanced
        else:
            return SchrothType.TYPE_4C  # Lumbar dominant or balanced double
    else:
        # Unbalanced pelvis
        pelvis_coupled = is_pelvis_lumbar_coupled(vertebrae)

        if pelvis_coupled:
            return SchrothType.TYPE_3CP  # Thoracic with coupled pelvic shift
        else:
            return SchrothType.TYPE_4CP  # Lumbar with uncoupled pelvic shift


def determine_severity(primary_cobb_angle: float) -> Severity:
    """
    Determine scoliosis severity based on primary Cobb angle.

    Standard medical classification:
    - Mild: 10-25 degrees
    - Moderate: 25-40 degrees
    - Severe: 40-50 degrees
    - Very Severe: >50 degrees
    """
    if primary_cobb_angle < 10:
        return Severity.MILD  # Sub-threshold, but classify as mild
    elif primary_cobb_angle < 25:
        return Severity.MILD
    elif primary_cobb_angle < 40:
        return Severity.MODERATE
    elif primary_cobb_angle < 50:
        return Severity.SEVERE
    else:
        return Severity.VERY_SEVERE


def get_primary_curve_info(
    cobb_angles: List[CobbAngleMeasurement]
) -> Tuple[CurveLocation, CurveDirection]:
    """
    Get the location and direction of the primary (largest) curve.
    """
    if not cobb_angles:
        return CurveLocation.THORACIC, CurveDirection.NONE

    primary = cobb_angles[0]  # Already sorted by angle
    return primary.curve_location, primary.curve_direction
