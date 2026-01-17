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
    max_detections: int = 18
) -> Dict[str, Any]:
    """
    Filter and process raw model outputs.

    Steps:
    1. Filter by confidence score
    2. Apply Non-Maximum Suppression
    3. Keep top-k detections
    4. Sort by y-coordinate (top to bottom)
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

    # 3. Keep top-k
    if len(boxes) > max_detections:
        top_k_indices = torch.topk(scores, max_detections).indices
        boxes = boxes[top_k_indices]
        scores = scores[top_k_indices]
        keypoints = keypoints[top_k_indices]

    # 4. Sort by y-coordinate (top of bounding box)
    y_positions = boxes[:, 1]  # y1 (top)
    sort_indices = torch.argsort(y_positions)
    boxes = boxes[sort_indices]
    scores = scores[sort_indices]
    keypoints = keypoints[sort_indices]

    return {
        "boxes": boxes.cpu().numpy().tolist(),
        "scores": scores.cpu().numpy().tolist(),
        "keypoints": keypoints.cpu().numpy().tolist()
    }


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
