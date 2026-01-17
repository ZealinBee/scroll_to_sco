import numpy as np
from typing import List, Tuple, Optional
from api.schemas import Vertebra, Keypoint, CobbAngleMeasurement, CurveLocation, CurveDirection, ImageOrientation


def get_endplate_vector(keypoints: List[Keypoint], endplate: str = "upper") -> np.ndarray:
    """
    Get the endplate vector for a vertebra.

    Args:
        keypoints: List of 4 keypoints [TL, TR, BL, BR]
        endplate: "upper" for top endplate, "lower" for bottom

    Returns:
        Vector from left to right of the endplate
    """
    if endplate == "upper":
        # Top-left to top-right
        left = np.array([keypoints[0].x, keypoints[0].y])
        right = np.array([keypoints[1].x, keypoints[1].y])
    else:
        # Bottom-left to bottom-right
        left = np.array([keypoints[2].x, keypoints[2].y])
        right = np.array([keypoints[3].x, keypoints[3].y])

    return right - left


def get_vertebra_center(keypoints: List[Keypoint]) -> np.ndarray:
    """Get the center point of a vertebra from its 4 keypoints."""
    x = sum(kp.x for kp in keypoints) / 4
    y = sum(kp.y for kp in keypoints) / 4
    return np.array([x, y])


def calculate_angle_between_vectors(v1: np.ndarray, v2: np.ndarray) -> float:
    """
    Calculate angle between two vectors using dot product.

    Formula: cos(θ) = (v1 · v2) / (|v1| × |v2|)

    Returns angle in degrees.
    """
    # Normalize vectors
    norm1 = np.linalg.norm(v1)
    norm2 = np.linalg.norm(v2)

    if norm1 == 0 or norm2 == 0:
        return 0.0

    v1_normalized = v1 / norm1
    v2_normalized = v2 / norm2

    # Calculate dot product
    dot_product = np.dot(v1_normalized, v2_normalized)

    # Clamp to [-1, 1] to handle numerical errors
    dot_product = np.clip(dot_product, -1.0, 1.0)

    # Calculate angle
    angle_rad = np.arccos(dot_product)
    angle_deg = np.degrees(angle_rad)

    return angle_deg


def find_inflection_points(vertebrae: List[Vertebra]) -> List[int]:
    """
    Find inflection points where the spinal curve changes direction.
    These mark the boundaries between different curves.

    Returns list of vertebra indices that are inflection points.
    """
    if len(vertebrae) < 3:
        return [0, len(vertebrae) - 1]

    # Calculate tilt for each vertebra
    tilts = [v.tilt_angle for v in vertebrae]

    inflections = []

    # Find local maxima and minima
    for i in range(1, len(tilts) - 1):
        prev_diff = tilts[i] - tilts[i - 1]
        next_diff = tilts[i + 1] - tilts[i]

        # Direction change (sign change in slope)
        if prev_diff * next_diff < 0:
            inflections.append(i)

    # Always include first and last
    inflections = [0] + inflections + [len(vertebrae) - 1]
    return sorted(set(inflections))


def find_apex_vertebra(vertebrae: List[Vertebra], start_idx: int, end_idx: int) -> int:
    """
    Find the apex vertebra (most laterally deviated) in a curve segment.

    The apex is the vertebra that deviates most from the line connecting
    the endpoints of the curve.
    """
    if end_idx - start_idx < 2:
        return start_idx

    segment = vertebrae[start_idx:end_idx + 1]

    # Get centers of first and last vertebra
    start_center = get_vertebra_center(segment[0].keypoints)
    end_center = get_vertebra_center(segment[-1].keypoints)

    # Calculate midline from start to end
    midline = (start_center + end_center) / 2

    # Find vertebra with maximum deviation from midline
    max_deviation = 0
    apex_idx = start_idx

    for i, v in enumerate(segment):
        center = get_vertebra_center(v.keypoints)
        deviation = abs(center[0] - midline[0])  # Lateral (x) deviation

        if deviation > max_deviation:
            max_deviation = deviation
            apex_idx = start_idx + i

    return apex_idx


def determine_curve_location(
    upper_idx: int,
    lower_idx: int,
    total_vertebrae: int
) -> CurveLocation:
    """
    Determine the anatomical location of a curve based on vertebra indices.

    For 17 vertebrae (T1-L5):
    - T1-T10 (idx 0-9): Thoracic
    - T11-L1 (idx 10-12): Thoracolumbar
    - L2-L5 (idx 13-16): Lumbar
    """
    # Calculate curve midpoint
    mid_point = (upper_idx + lower_idx) / 2

    # Adjust thresholds based on total vertebrae detected
    if total_vertebrae >= 15:
        thoracic_end = 9
        lumbar_start = 13
    elif total_vertebrae >= 10:
        thoracic_end = int(total_vertebrae * 0.6)
        lumbar_start = int(total_vertebrae * 0.8)
    else:
        thoracic_end = int(total_vertebrae * 0.5)
        lumbar_start = int(total_vertebrae * 0.7)

    if mid_point <= thoracic_end:
        return CurveLocation.THORACIC
    elif mid_point >= lumbar_start:
        return CurveLocation.LUMBAR
    else:
        return CurveLocation.THORACOLUMBAR


def determine_curve_direction(
    vertebrae: List[Vertebra],
    start_idx: int,
    end_idx: int,
    orientation: ImageOrientation = ImageOrientation.STANDARD
) -> CurveDirection:
    """
    Determine curve direction (left/right convexity) based on apex position.

    Args:
        vertebrae: List of detected vertebrae
        start_idx: Start index of curve segment
        end_idx: End index of curve segment
        orientation: Image orientation to correctly interpret left/right

    - Right (Dextroscoliosis): Apex deviates to patient's right
    - Left (Levoscoliosis): Apex deviates to patient's left

    Note: If image is flipped, we invert the result to get anatomical direction.
    """
    segment = vertebrae[start_idx:end_idx + 1]

    if len(segment) < 3:
        return CurveDirection.NONE

    # Get x-coordinates of all vertebra centers
    x_positions = [get_vertebra_center(v.keypoints)[0] for v in segment]

    # Midline from endpoints
    midline_x = (x_positions[0] + x_positions[-1]) / 2

    # Find apex position
    apex_local_idx = 0
    max_deviation = 0
    for i, x in enumerate(x_positions):
        deviation = abs(x - midline_x)
        if deviation > max_deviation:
            max_deviation = deviation
            apex_local_idx = i

    apex_x = x_positions[apex_local_idx]

    # Determine direction based on pixel coordinates
    # In standard view: higher x = right side of image = patient's left
    if apex_x > midline_x:
        pixel_direction = CurveDirection.RIGHT
    elif apex_x < midline_x:
        pixel_direction = CurveDirection.LEFT
    else:
        return CurveDirection.NONE

    # If image is flipped, invert the direction to get anatomical direction
    if orientation == ImageOrientation.FLIPPED:
        if pixel_direction == CurveDirection.RIGHT:
            return CurveDirection.LEFT
        elif pixel_direction == CurveDirection.LEFT:
            return CurveDirection.RIGHT

    return pixel_direction


def calculate_cobb_angle_for_segment(
    vertebrae: List[Vertebra],
    upper_idx: int,
    lower_idx: int
) -> float:
    """
    Calculate Cobb angle between two vertebrae.

    The Cobb angle is measured between:
    - The upper endplate of the upper end vertebra
    - The lower endplate of the lower end vertebra
    """
    upper_vertebra = vertebrae[upper_idx]
    lower_vertebra = vertebrae[lower_idx]

    # Get endplate vectors
    upper_vector = get_endplate_vector(upper_vertebra.keypoints, "upper")
    lower_vector = get_endplate_vector(lower_vertebra.keypoints, "lower")

    # Calculate angle
    angle = calculate_angle_between_vectors(upper_vector, lower_vector)

    return round(angle, 1)


def calculate_all_cobb_angles(
    vertebrae: List[Vertebra],
    orientation: ImageOrientation = ImageOrientation.STANDARD
) -> List[CobbAngleMeasurement]:
    """
    Calculate all significant Cobb angles in the spine.

    Args:
        vertebrae: List of detected vertebrae
        orientation: Image orientation for correct left/right determination

    Returns measurements sorted by angle (largest first).
    """
    if len(vertebrae) < 5:
        return []

    # Find inflection points
    inflections = find_inflection_points(vertebrae)
    measurements = []

    # Calculate Cobb angle for each curve segment
    for i in range(len(inflections) - 1):
        upper_idx = inflections[i]
        lower_idx = inflections[i + 1]

        # Skip very short segments
        if lower_idx - upper_idx < 3:
            continue

        # Calculate angle
        angle = calculate_cobb_angle_for_segment(vertebrae, upper_idx, lower_idx)

        # Skip angles below scoliosis threshold
        if angle < 10:
            continue

        # Find apex
        apex_idx = find_apex_vertebra(vertebrae, upper_idx, lower_idx)

        # Determine location and direction (pass orientation for correct left/right)
        location = determine_curve_location(upper_idx, lower_idx, len(vertebrae))
        direction = determine_curve_direction(vertebrae, upper_idx, lower_idx, orientation)

        measurement = CobbAngleMeasurement(
            angle=angle,
            upper_vertebra=vertebrae[upper_idx].label,
            lower_vertebra=vertebrae[lower_idx].label,
            apex_vertebra=vertebrae[apex_idx].label,
            curve_location=location,
            curve_direction=direction
        )
        measurements.append(measurement)

    # Sort by angle (largest first)
    measurements.sort(key=lambda m: m.angle, reverse=True)

    return measurements


def get_primary_cobb_angle(measurements: List[CobbAngleMeasurement]) -> float:
    """Get the primary (largest) Cobb angle."""
    if not measurements:
        return 0.0
    return measurements[0].angle
