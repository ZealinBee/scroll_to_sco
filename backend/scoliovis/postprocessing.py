import torch
import numpy as np
from typing import List, Dict, Any
from torchvision.ops import nms
from api.schemas import Vertebra, Keypoint


# Vertebra labels based on typical spine anatomy
VERTEBRA_LABELS = [
    "T1", "T2", "T3", "T4", "T5", "T6", "T7", "T8", "T9", "T10", "T11", "T12",
    "L1", "L2", "L3", "L4", "L5"
]


def filter_detections(
    outputs: Dict[str, torch.Tensor],
    confidence_threshold: float = 0.5,
    nms_threshold: float = 0.3,
    max_detections: int = 17  # Match number of vertebrae labels (T1-T12, L1-L5)
) -> Dict[str, Any]:
    """
    Filter and process raw model outputs.

    Steps:
    1. Filter by confidence score
    2. Apply Non-Maximum Suppression
    3. Keep top-k detections
    4. Sort by y-coordinate (top to bottom)
    5. Filter spatial outliers (detections far from the spine)
    """
    boxes = outputs["boxes"]
    scores = outputs["scores"]
    keypoints = outputs["keypoints"]

    # 1. Filter by confidence
    confident_mask = scores >= confidence_threshold
    boxes = boxes[confident_mask]
    scores = scores[confident_mask]
    keypoints = keypoints[confident_mask]

    if len(boxes) == 0:
        return {"boxes": [], "scores": [], "keypoints": []}

    # 2. Apply NMS
    keep_indices = nms(boxes, scores, nms_threshold)
    boxes = boxes[keep_indices]
    scores = scores[keep_indices]
    keypoints = keypoints[keep_indices]

    # 3. Sort by y-coordinate first (top of bounding box)
    y_positions = boxes[:, 1]  # y1 (top)
    sort_indices = torch.argsort(y_positions)
    boxes = boxes[sort_indices]
    scores = scores[sort_indices]
    keypoints = keypoints[sort_indices]

    # 4. Filter spatial outliers - remove detections far from the spine centerline
    if len(boxes) >= 3:
        boxes, scores, keypoints = filter_spatial_outliers(boxes, scores, keypoints)

    # 5. Keep top-k (by score) if still too many
    if len(boxes) > max_detections:
        top_k_indices = torch.topk(scores, max_detections).indices
        # Re-sort these by y-position
        selected_boxes = boxes[top_k_indices]
        selected_scores = scores[top_k_indices]
        selected_keypoints = keypoints[top_k_indices]

        y_positions = selected_boxes[:, 1]
        sort_indices = torch.argsort(y_positions)
        boxes = selected_boxes[sort_indices]
        scores = selected_scores[sort_indices]
        keypoints = selected_keypoints[sort_indices]

    return {
        "boxes": boxes.cpu().numpy().tolist(),
        "scores": scores.cpu().numpy().tolist(),
        "keypoints": keypoints.cpu().numpy().tolist()
    }


def filter_spatial_outliers(
    boxes: torch.Tensor,
    scores: torch.Tensor,
    keypoints: torch.Tensor,
    x_deviation_threshold: float = 2.5,  # Number of MADs from median
    y_gap_threshold: float = 2.0  # Max gap multiplier relative to median spacing
) -> tuple:
    """
    Filter out detections that are spatially inconsistent with the spine.

    This removes false positives like:
    - Detections far horizontally from the spine centerline (pelvis, ribs)
    - Detections with abnormally large gaps from neighbors (artifacts)

    Uses Median Absolute Deviation (MAD) for robust outlier detection.
    """
    if len(boxes) < 3:
        return boxes, scores, keypoints

    # Calculate center x-position for each detection
    center_x = (boxes[:, 0] + boxes[:, 2]) / 2  # (x1 + x2) / 2
    center_y = (boxes[:, 1] + boxes[:, 3]) / 2  # (y1 + y2) / 2

    # Calculate median x-position (spine should be roughly vertical)
    median_x = torch.median(center_x)

    # Calculate Median Absolute Deviation (MAD) for x-position
    x_deviations = torch.abs(center_x - median_x)
    mad_x = torch.median(x_deviations)

    # Avoid division by zero - use a minimum MAD based on typical vertebra width
    min_mad = (boxes[:, 2] - boxes[:, 0]).median() * 0.3  # 30% of median width
    mad_x = torch.max(mad_x, min_mad)

    # Filter by x-deviation: keep detections within threshold MADs of median
    x_inlier_mask = x_deviations <= (x_deviation_threshold * mad_x)

    # Also check for abnormal vertical gaps (detections too far from neighbors)
    y_gap_mask = torch.ones(len(boxes), dtype=torch.bool, device=boxes.device)

    if len(center_y) >= 3:
        # Calculate gaps between consecutive vertebrae
        y_sorted_indices = torch.argsort(center_y)
        sorted_y = center_y[y_sorted_indices]
        gaps = sorted_y[1:] - sorted_y[:-1]

        if len(gaps) > 0:
            median_gap = torch.median(gaps)
            # Mark detections with abnormally large gaps before or after them
            for i in range(len(y_sorted_indices)):
                original_idx = y_sorted_indices[i]
                # Check gap to previous (if exists)
                if i > 0:
                    gap_before = gaps[i - 1]
                    if gap_before > y_gap_threshold * median_gap:
                        # This vertebra might be an outlier if it's the last one
                        # and has a huge gap from the rest
                        if i == len(y_sorted_indices) - 1:
                            y_gap_mask[original_idx] = False
                # Check gap to next (if exists)
                if i < len(gaps):
                    gap_after = gaps[i]
                    if gap_after > y_gap_threshold * median_gap:
                        # If first vertebra has huge gap, might be artifact at top
                        if i == 0:
                            y_gap_mask[original_idx] = False

    # Combine masks
    keep_mask = x_inlier_mask & y_gap_mask

    # Always keep at least 3 detections (don't over-filter)
    if keep_mask.sum() < 3:
        # Fall back to keeping based on x-deviation only, sorted by score
        keep_mask = x_inlier_mask
        if keep_mask.sum() < 3:
            # Keep the 3 highest scoring ones that are closest to median x
            _, closest_indices = torch.topk(-x_deviations, min(3, len(boxes)))
            keep_mask = torch.zeros(len(boxes), dtype=torch.bool, device=boxes.device)
            keep_mask[closest_indices] = True

    return boxes[keep_mask], scores[keep_mask], keypoints[keep_mask]


def extract_vertebrae(filtered_outputs: Dict[str, Any]) -> List[Vertebra]:
    """
    Convert filtered detections to Vertebra objects.

    Keypoint order from model: [top-left, top-right, bottom-left, bottom-right]
    """
    vertebrae = []

    boxes = filtered_outputs["boxes"]
    scores = filtered_outputs["scores"]
    keypoints_list = filtered_outputs["keypoints"]

    for idx, (box, score, kps) in enumerate(zip(boxes, scores, keypoints_list)):
        # Assign label based on position (approximate)
        label = VERTEBRA_LABELS[idx] if idx < len(VERTEBRA_LABELS) else f"V{idx + 1}"

        # Extract keypoints (format: [[x, y, visibility], ...])
        extracted_keypoints = [
            Keypoint(x=kp[0], y=kp[1], confidence=kp[2] if len(kp) > 2 else 1.0)
            for kp in kps
        ]

        # Calculate tilt angle from keypoints
        tilt_angle = calculate_vertebra_tilt(extracted_keypoints)

        vertebra = Vertebra(
            index=idx,
            label=label,
            bounding_box=box,
            keypoints=extracted_keypoints,
            confidence=score,
            tilt_angle=tilt_angle
        )
        vertebrae.append(vertebra)

    return vertebrae


def calculate_vertebra_tilt(keypoints: List[Keypoint]) -> float:
    """
    Calculate the tilt angle of a vertebra from horizontal.
    Uses the upper endplate (top-left to top-right).
    Positive = tilted right, Negative = tilted left.
    """
    if len(keypoints) < 4:
        return 0.0

    # Top-left and top-right keypoints
    tl = keypoints[0]
    tr = keypoints[1]

    # Calculate angle from horizontal
    dx = tr.x - tl.x
    dy = tr.y - tl.y

    angle_rad = np.arctan2(dy, dx)
    angle_deg = np.degrees(angle_rad)

    return round(angle_deg, 2)


def calculate_average_confidence(vertebrae: List[Vertebra]) -> float:
    """Calculate average confidence score across all detections."""
    if not vertebrae:
        return 0.0
    return sum(v.confidence for v in vertebrae) / len(vertebrae)
