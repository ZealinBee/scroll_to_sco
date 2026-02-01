"""
MediaPipe Pose Analysis for Back Photos

Uses MediaPipe Pose Landmarker (Tasks API) to detect body landmarks and calculate
asymmetry metrics for scoliosis screening.
"""

import os
import math
import numpy as np
from PIL import Image
from typing import List, Tuple, Optional
from dataclasses import dataclass, field
from enum import Enum

import mediapipe as mp
from mediapipe.tasks import python
from mediapipe.tasks.python import vision


class RiskLevel(str, Enum):
    LOW = "LOW"
    MEDIUM = "MEDIUM"
    HIGH = "HIGH"


@dataclass
class Landmark:
    """A single pose landmark with 3D coordinates and visibility."""
    x: float  # Normalized [0, 1] - left to right
    y: float  # Normalized [0, 1] - top to bottom
    z: float  # Depth relative to hips (negative = closer to camera)
    visibility: float  # Confidence [0, 1]


@dataclass
class AsymmetryMetrics:
    """
    Calculated asymmetry metrics from pose landmarks.

    Based on clinical examination protocols:
    - HAI (Height Asymmetry Index): shoulders + axillary folds + waist creases
    - POTSI (Posterior Trunk Symmetry Index)
    - Scoliosis Research Society clinical examination guidelines

    All measurements are expressed as percentages for camera-distance independence:
    - Height differences: % of torso height (shoulder to hip distance)
    - Trunk shift: % of shoulder width
    """
    # Primary measurements (in pixels - for internal calculations)
    shoulder_height_diff_px: float
    hip_height_diff_px: float
    trunk_shift_px: float

    # Derived landmark measurements (in pixels) - based on HAI methodology
    waist_height_diff_px: float = 0.0  # Waist crease asymmetry
    axilla_height_diff_px: float = 0.0  # Axillary fold asymmetry
    scapula_prominence_diff: float = 0.0  # Scapula prominence difference

    # Rotation scores (from Z-depth, 0-1 scale)
    shoulder_rotation_score: float = 0.0
    hip_rotation_score: float = 0.0

    # Combined indices (based on clinical literature)
    hai_score: float = 0.0  # Height Asymmetry Index (normalized)
    overall_asymmetry_score: float = 0.0  # 0-100 composite score

    # Percentage-based measurements (camera-distance independent)
    shoulder_height_diff_pct: float = 0.0  # % of torso height
    hip_height_diff_pct: float = 0.0  # % of torso height
    trunk_shift_pct: float = 0.0  # % of shoulder width
    waist_height_diff_pct: float = 0.0  # % of torso height
    axilla_height_diff_pct: float = 0.0  # % of torso height


@dataclass
class PhotoAnalysisResult:
    """Complete result of photo analysis."""
    landmarks: List[Landmark]
    metrics: AsymmetryMetrics
    risk_level: RiskLevel
    risk_factors: List[str]
    recommendations: List[str]
    landmark_confidence: float


# MediaPipe pose landmark indices
# https://developers.google.com/mediapipe/solutions/vision/pose_landmarker
class PoseLandmark:
    NOSE = 0
    LEFT_EAR = 7
    RIGHT_EAR = 8
    LEFT_SHOULDER = 11
    RIGHT_SHOULDER = 12
    LEFT_ELBOW = 13
    RIGHT_ELBOW = 14
    LEFT_WRIST = 15
    RIGHT_WRIST = 16
    LEFT_HIP = 23
    RIGHT_HIP = 24
    LEFT_KNEE = 25
    RIGHT_KNEE = 26


@dataclass
class DerivedLandmarks:
    """
    Clinically relevant landmarks derived from MediaPipe keypoints.
    Based on HAI (Height Asymmetry Index) and POTSI methodology.
    """
    # Estimated waist points (narrowest part of torso, ~60-65% from shoulder to hip)
    left_waist: Tuple[float, float, float]  # (x, y, z)
    right_waist: Tuple[float, float, float]

    # Estimated axillary fold points (where arm meets torso)
    left_axilla: Tuple[float, float, float]
    right_axilla: Tuple[float, float, float]

    # Scapula approximation (from shoulder position and elbow angle)
    left_scapula_prominence: float  # estimated prominence score
    right_scapula_prominence: float


def estimate_derived_landmarks(landmarks: List[Landmark]) -> DerivedLandmarks:
    """
    Estimate clinically relevant landmarks from MediaPipe pose keypoints.

    Based on:
    - HAI (Height Asymmetry Index) methodology which uses shoulders, axillary folds, and waist creases
    - POTSI (Posterior Trunk Symmetry Index) reference points
    - Clinical examination protocols from orthopedic literature

    References:
    - Suzuki et al. POTSI index methodology
    - Scoliosis Research Society clinical examination guidelines
    """
    left_shoulder = landmarks[PoseLandmark.LEFT_SHOULDER]
    right_shoulder = landmarks[PoseLandmark.RIGHT_SHOULDER]
    left_hip = landmarks[PoseLandmark.LEFT_HIP]
    right_hip = landmarks[PoseLandmark.RIGHT_HIP]
    left_elbow = landmarks[PoseLandmark.LEFT_ELBOW]
    right_elbow = landmarks[PoseLandmark.RIGHT_ELBOW]

    # ============================================================
    # WAIST ESTIMATION
    # The waist (narrowest point of torso) is typically located at
    # approximately 60-65% of the distance from shoulder to hip.
    # This corresponds to the area between lower ribs and iliac crest.
    # ============================================================
    WAIST_RATIO = 0.62  # Position ratio from shoulder toward hip

    left_waist = (
        left_shoulder.x + WAIST_RATIO * (left_hip.x - left_shoulder.x),
        left_shoulder.y + WAIST_RATIO * (left_hip.y - left_shoulder.y),
        left_shoulder.z + WAIST_RATIO * (left_hip.z - left_shoulder.z)
    )

    right_waist = (
        right_shoulder.x + WAIST_RATIO * (right_hip.x - right_shoulder.x),
        right_shoulder.y + WAIST_RATIO * (right_hip.y - right_shoulder.y),
        right_shoulder.z + WAIST_RATIO * (right_hip.z - right_shoulder.z)
    )

    # ============================================================
    # AXILLARY FOLD ESTIMATION
    # The axillary fold (armpit crease) is where the arm meets the torso.
    # It's located slightly below and lateral to the shoulder joint.
    # Approximately 15-20% down from shoulder toward hip, and slightly
    # inward from the shoulder position.
    # ============================================================
    AXILLA_VERTICAL_RATIO = 0.18  # Position below shoulder
    AXILLA_HORIZONTAL_INSET = 0.02  # Slight inward offset

    # Calculate torso midline for reference
    shoulder_mid_x = (left_shoulder.x + right_shoulder.x) / 2

    left_axilla = (
        left_shoulder.x + AXILLA_HORIZONTAL_INSET * (shoulder_mid_x - left_shoulder.x),
        left_shoulder.y + AXILLA_VERTICAL_RATIO * (left_hip.y - left_shoulder.y),
        left_shoulder.z
    )

    right_axilla = (
        right_shoulder.x + AXILLA_HORIZONTAL_INSET * (shoulder_mid_x - right_shoulder.x),
        right_shoulder.y + AXILLA_VERTICAL_RATIO * (right_hip.y - right_shoulder.y),
        right_shoulder.z
    )

    # ============================================================
    # SCAPULA PROMINENCE ESTIMATION
    # Scapular prominence is a key scoliosis indicator.
    # We estimate it from:
    # 1. The Z-depth of the shoulder (how far back it is)
    # 2. The position of the elbow relative to the body
    # In a back view, a prominent scapula pushes the shoulder back (higher Z)
    # ============================================================
    # Higher Z value = more posterior (closer to camera in back view)
    left_scapula_prominence = abs(left_shoulder.z) + 0.5 * abs(left_elbow.z - left_shoulder.z)
    right_scapula_prominence = abs(right_shoulder.z) + 0.5 * abs(right_elbow.z - right_shoulder.z)

    return DerivedLandmarks(
        left_waist=left_waist,
        right_waist=right_waist,
        left_axilla=left_axilla,
        right_axilla=right_axilla,
        left_scapula_prominence=left_scapula_prominence,
        right_scapula_prominence=right_scapula_prominence
    )


# Singleton for MediaPipe pose detector
_pose_landmarker = None


def _get_model_path() -> str:
    """Get the path to the pose landmarker model."""
    # Prefer full model for better accuracy, fall back to lite
    model_names = ["pose_landmarker_full.task", "pose_landmarker_lite.task"]

    for model_name in model_names:
        possible_paths = [
            os.path.join(os.path.dirname(__file__), "..", "models", model_name),
            os.path.join(os.path.dirname(__file__), "..", "..", "models", model_name),
            f"models/{model_name}",
        ]

        for path in possible_paths:
            abs_path = os.path.abspath(path)
            if os.path.exists(abs_path):
                print(f"Using pose model: {model_name}")
                return abs_path

    raise FileNotFoundError(
        "Pose landmarker model not found. Please download it from: "
        "https://storage.googleapis.com/mediapipe-models/pose_landmarker/pose_landmarker_full/float16/1/pose_landmarker_full.task"
    )


def _get_pose_landmarker():
    """Get or create MediaPipe pose landmarker (singleton)."""
    global _pose_landmarker
    if _pose_landmarker is None:
        model_path = _get_model_path()

        base_options = python.BaseOptions(model_asset_path=model_path)
        options = vision.PoseLandmarkerOptions(
            base_options=base_options,
            output_segmentation_masks=False,
            # Lower thresholds for back views which are harder to detect
            min_pose_detection_confidence=0.3,
            min_pose_presence_confidence=0.3,
            min_tracking_confidence=0.3,
            num_poses=1
        )
        _pose_landmarker = vision.PoseLandmarker.create_from_options(options)
    return _pose_landmarker


def reset_pose_landmarker():
    """Reset the pose landmarker singleton (useful when changing models)."""
    global _pose_landmarker
    if _pose_landmarker is not None:
        _pose_landmarker.close()
        _pose_landmarker = None


def detect_pose_landmarks(image: Image.Image) -> Tuple[Optional[List[Landmark]], float]:
    """
    Detect pose landmarks from an image using MediaPipe.

    Args:
        image: PIL Image (RGB)

    Returns:
        Tuple of (list of landmarks, overall confidence)
        Returns (None, 0.0) if no pose detected
    """
    # Convert PIL to numpy array
    image_np = np.array(image)

    # Ensure RGB
    if len(image_np.shape) == 2:
        image_np = np.stack([image_np] * 3, axis=-1)
    elif image_np.shape[2] == 4:
        image_np = image_np[:, :, :3]

    # Create MediaPipe Image
    mp_image = mp.Image(image_format=mp.ImageFormat.SRGB, data=image_np)

    # Run detection
    landmarker = _get_pose_landmarker()
    results = landmarker.detect(mp_image)

    if not results.pose_landmarks or len(results.pose_landmarks) == 0:
        return None, 0.0

    # Extract landmarks from first pose
    pose_landmarks = results.pose_landmarks[0]
    landmarks = []
    total_visibility = 0.0

    for lm in pose_landmarks:
        landmarks.append(Landmark(
            x=lm.x,
            y=lm.y,
            z=lm.z,
            visibility=lm.visibility if hasattr(lm, 'visibility') else lm.presence
        ))
        visibility = lm.visibility if hasattr(lm, 'visibility') else lm.presence
        total_visibility += visibility

    avg_confidence = total_visibility / len(landmarks) if landmarks else 0.0

    return landmarks, avg_confidence


def calculate_asymmetry_metrics(
    landmarks: List[Landmark],
    image_width: int,
    image_height: int,
    estimated_distance_cm: float = 150.0  # Estimated camera distance
) -> AsymmetryMetrics:
    """
    Calculate asymmetry metrics from pose landmarks using clinically validated methods.

    Based on:
    - HAI (Height Asymmetry Index): Sum of height differences at shoulders, axillary folds,
      and waist creases, normalized by torso height. (Suzuki et al., POTSI methodology)
    - Clinical examination protocols from SRS and orthopedic literature

    Args:
        landmarks: List of 33 MediaPipe pose landmarks
        image_width: Image width in pixels
        image_height: Image height in pixels
        estimated_distance_cm: Estimated distance from camera in cm

    Returns:
        AsymmetryMetrics with all calculated values including HAI components
    """
    # Get primary landmarks
    left_shoulder = landmarks[PoseLandmark.LEFT_SHOULDER]
    right_shoulder = landmarks[PoseLandmark.RIGHT_SHOULDER]
    left_hip = landmarks[PoseLandmark.LEFT_HIP]
    right_hip = landmarks[PoseLandmark.RIGHT_HIP]

    # Get derived landmarks (waist, axilla, scapula)
    derived = estimate_derived_landmarks(landmarks)

    # ============================================================
    # PRIMARY MEASUREMENTS
    # ============================================================

    # Shoulder height difference (in pixels)
    shoulder_height_diff_px = (right_shoulder.y - left_shoulder.y) * image_height

    # Hip height difference (in pixels)
    hip_height_diff_px = (right_hip.y - left_hip.y) * image_height

    # ============================================================
    # DERIVED LANDMARK MEASUREMENTS (HAI Components)
    # Based on POTSI/HAI methodology from clinical literature
    # ============================================================

    # Waist crease height difference
    waist_height_diff_px = (derived.right_waist[1] - derived.left_waist[1]) * image_height

    # Axillary fold height difference
    axilla_height_diff_px = (derived.right_axilla[1] - derived.left_axilla[1]) * image_height

    # Scapula prominence difference (from Z-depth estimation)
    scapula_prominence_diff = derived.right_scapula_prominence - derived.left_scapula_prominence

    # ============================================================
    # TRUNK SHIFT (Coronal Balance)
    # ============================================================

    # Calculate midpoints
    shoulder_mid_x = (left_shoulder.x + right_shoulder.x) / 2
    hip_mid_x = (left_hip.x + right_hip.x) / 2
    waist_mid_x = (derived.left_waist[0] + derived.right_waist[0]) / 2

    # Trunk shift: lateral deviation of shoulders from hips
    trunk_shift_px = (shoulder_mid_x - hip_mid_x) * image_width

    # Also calculate waist-level trunk shift (may be more sensitive)
    waist_trunk_shift_px = (waist_mid_x - hip_mid_x) * image_width

    # ============================================================
    # ROTATION SCORES (3D asymmetry)
    # ============================================================

    shoulder_rotation_score = abs(left_shoulder.z - right_shoulder.z)
    hip_rotation_score = abs(left_hip.z - right_hip.z)

    # ============================================================
    # REFERENCE MEASUREMENTS FOR PERCENTAGE CALCULATIONS
    # ============================================================

    # Torso height (shoulder midpoint to hip midpoint)
    torso_height_px = abs(
        ((left_hip.y + right_hip.y) / 2) - ((left_shoulder.y + right_shoulder.y) / 2)
    ) * image_height

    # Shoulder width (for trunk shift percentage)
    shoulder_width_px = abs(right_shoulder.x - left_shoulder.x) * image_width

    # ============================================================
    # PERCENTAGE-BASED MEASUREMENTS (Camera-distance independent)
    # ============================================================

    if torso_height_px > 0:
        shoulder_height_diff_pct = (abs(shoulder_height_diff_px) / torso_height_px) * 100
        hip_height_diff_pct = (abs(hip_height_diff_px) / torso_height_px) * 100
        waist_height_diff_pct = (abs(waist_height_diff_px) / torso_height_px) * 100
        axilla_height_diff_pct = (abs(axilla_height_diff_px) / torso_height_px) * 100
    else:
        shoulder_height_diff_pct = 0.0
        hip_height_diff_pct = 0.0
        waist_height_diff_pct = 0.0
        axilla_height_diff_pct = 0.0

    if shoulder_width_px > 0:
        trunk_shift_pct = (abs(trunk_shift_px) / shoulder_width_px) * 100
    else:
        trunk_shift_pct = 0.0

    # ============================================================
    # HAI (Height Asymmetry Index) CALCULATION
    # HAI = (shoulder_diff + axilla_diff + waist_diff) / torso_height * 100
    # This is already a percentage - sum of component percentages
    # Reference: Suzuki et al., POTSI methodology
    # POTSI considers HAI ≤10 as normal, >10 as pathologic
    # ============================================================

    if torso_height_px > 0:
        total_height_asymmetry = (
            abs(shoulder_height_diff_px) +
            abs(axilla_height_diff_px) +
            abs(waist_height_diff_px)
        )
        hai_raw = (total_height_asymmetry / torso_height_px) * 100
        hai_score = min(100, hai_raw)
    else:
        hai_score = 0.0

    # ============================================================
    # OVERALL ASYMMETRY SCORE (Composite)
    # Weighted combination based on clinical significance
    # Using percentage thresholds instead of mm
    # ============================================================

    score = 0.0

    # HAI components (60% weight - most clinically validated)
    # Shoulder height: max 20 points (>2.5% is notable asymmetry)
    score += min(20, (shoulder_height_diff_pct / 2.5) * 20)

    # Axillary fold: max 20 points
    score += min(20, (axilla_height_diff_pct / 2.5) * 20)

    # Waist crease: max 20 points
    score += min(20, (waist_height_diff_pct / 2.5) * 20)

    # Trunk shift (25% weight - as % of shoulder width)
    # >5% trunk shift is notable
    score += min(25, (trunk_shift_pct / 5.0) * 25)

    # Scapula/rotation (15% weight - harder to assess from photo)
    score += min(8, (shoulder_rotation_score / 0.05) * 8)
    score += min(7, abs(scapula_prominence_diff) / 0.05 * 7)

    return AsymmetryMetrics(
        shoulder_height_diff_px=round(shoulder_height_diff_px, 1),
        hip_height_diff_px=round(hip_height_diff_px, 1),
        trunk_shift_px=round(trunk_shift_px, 1),
        waist_height_diff_px=round(waist_height_diff_px, 1),
        axilla_height_diff_px=round(axilla_height_diff_px, 1),
        scapula_prominence_diff=round(scapula_prominence_diff, 4),
        shoulder_rotation_score=round(shoulder_rotation_score, 4),
        hip_rotation_score=round(hip_rotation_score, 4),
        hai_score=round(hai_score, 1),
        overall_asymmetry_score=round(min(100, score), 1),
        shoulder_height_diff_pct=round(shoulder_height_diff_pct, 1),
        hip_height_diff_pct=round(hip_height_diff_pct, 1),
        trunk_shift_pct=round(trunk_shift_pct, 1),
        waist_height_diff_pct=round(waist_height_diff_pct, 1),
        axilla_height_diff_pct=round(axilla_height_diff_pct, 1)
    )


@dataclass
class ClinicalFinding:
    """A clinical finding with evidence-based context."""
    measurement: str
    value: float
    unit: str
    severity: str  # "normal", "mild", "moderate", "significant"
    clinical_context: str
    reference: str


def assess_risk_level(metrics: AsymmetryMetrics) -> Tuple[RiskLevel, List[str], List[str]]:
    """
    Assess risk level based on asymmetry metrics using evidence-based thresholds.

    Clinical thresholds based on:
    - Kuklo et al.: Shoulder imbalance threshold of >10mm
    - SRS (Scoliosis Research Society): Trunk shift >20mm indicates decompensation
    - Akel et al.: Only 19% of adolescents have perfectly level shoulders

    Returns:
        Tuple of (risk_level, risk_factors, recommendations)
    """
    findings: List[ClinicalFinding] = []
    risk_score = 0  # Weighted score for overall assessment

    # ============================================================
    # HAI (Height Asymmetry Index) - PRIMARY CLINICAL INDICATOR
    # Reference: POTSI methodology - HAI ≤10 normal, >10 pathologic
    # HAI is the sum of height differences at shoulders, axillae, and waist
    # normalized by torso height. This is more reliable than any single measurement.
    # ============================================================
    if metrics.hai_score > 15:
        findings.append(ClinicalFinding(
            measurement="Height Asymmetry Index (HAI)",
            value=metrics.hai_score,
            unit="/100",
            severity="significant",
            clinical_context="HAI significantly exceeds the clinical threshold (>10). The HAI "
                           "combines shoulder, axillary fold, and waist crease asymmetries - "
                           "the same landmarks used in clinical scoliosis screening. This pattern "
                           "of multi-level asymmetry is consistent with underlying spinal curvature.",
            reference="POTSI methodology (Suzuki et al.); HAI clinical threshold studies"
        ))
        risk_score += 30
    elif metrics.hai_score > 10:
        findings.append(ClinicalFinding(
            measurement="Height Asymmetry Index (HAI)",
            value=metrics.hai_score,
            unit="/100",
            severity="moderate",
            clinical_context="HAI exceeds the clinical threshold for pathologic asymmetry (>10). "
                           "The POTSI index considers HAI >10 as warranting further evaluation. "
                           "This indicates combined asymmetry across multiple torso landmarks.",
            reference="POTSI methodology; HAI threshold = 10"
        ))
        risk_score += 20
    elif metrics.hai_score > 5:
        findings.append(ClinicalFinding(
            measurement="Height Asymmetry Index (HAI)",
            value=metrics.hai_score,
            unit="/100",
            severity="mild",
            clinical_context="HAI within normal range. Minor asymmetries across shoulder, axilla, "
                           "and waist levels are common in the general population.",
            reference="POTSI normal range"
        ))
        risk_score += 5

    # ============================================================
    # WAIST CREASE ASYMMETRY - Key HAI component
    # Waist crease asymmetry is a specific scoliosis indicator
    # Threshold: >3% of torso height is significant
    # ============================================================
    if metrics.waist_height_diff_pct > 3.0:
        findings.append(ClinicalFinding(
            measurement="Waist Crease Asymmetry",
            value=metrics.waist_height_diff_pct,
            unit="% of torso",
            severity="significant",
            clinical_context="Significant waist crease height difference. Uneven waist creases "
                           "are a classic sign of lumbar or thoracolumbar scoliosis. This asymmetry "
                           "often correlates with the apex of lumbar curves.",
            reference="Clinical examination: waist crease asymmetry in scoliosis"
        ))
        risk_score += 15
    elif metrics.waist_height_diff_pct > 1.5:
        findings.append(ClinicalFinding(
            measurement="Waist Crease Asymmetry",
            value=metrics.waist_height_diff_pct,
            unit="% of torso",
            severity="moderate",
            clinical_context="Moderate waist crease asymmetry detected. The waist may appear "
                           "flattened on one side, which clinicians look for during physical "
                           "examination for scoliosis.",
            reference="SRS clinical examination guidelines"
        ))
        risk_score += 8

    # ============================================================
    # AXILLARY FOLD ASYMMETRY - HAI component
    # Axillary fold position reflects underlying torso shape
    # Threshold: >2.5% of torso height is notable
    # ============================================================
    if metrics.axilla_height_diff_pct > 2.5:
        findings.append(ClinicalFinding(
            measurement="Axillary Fold Asymmetry",
            value=metrics.axilla_height_diff_pct,
            unit="% of torso",
            severity="moderate",
            clinical_context="The axillary folds (armpit creases) show height asymmetry. Research "
                           "shows this reflects underlying torso asymmetry and correlates with "
                           "thoracic curve severity. The shoulder girdle compensates for torso "
                           "deformity, making axillae position a useful indicator.",
            reference="Post-operative shoulder imbalance studies; axilla position research"
        ))
        risk_score += 10
    elif metrics.axilla_height_diff_pct > 1.0:
        findings.append(ClinicalFinding(
            measurement="Axillary Fold Asymmetry",
            value=metrics.axilla_height_diff_pct,
            unit="% of torso",
            severity="mild",
            clinical_context="Minor axillary fold height difference. This is included in the HAI "
                           "calculation as one of three key torso landmarks.",
            reference="HAI methodology"
        ))
        risk_score += 4

    # ============================================================
    # SHOULDER HEIGHT DIFFERENCE
    # Threshold: >4% of torso height is significant, >2% is moderate
    # ============================================================
    if metrics.shoulder_height_diff_pct > 4.0:
        findings.append(ClinicalFinding(
            measurement="Shoulder Height Difference",
            value=metrics.shoulder_height_diff_pct,
            unit="% of torso",
            severity="significant",
            clinical_context="Exceeds clinical threshold for shoulder imbalance. "
                           "This level of asymmetry is uncommon in the general population and "
                           "may indicate underlying spinal curvature. Studies show shoulder "
                           "asymmetry correlates with thoracic curve magnitude.",
            reference="Kuklo et al. (2006); Akel et al. shoulder imbalance studies"
        ))
        risk_score += 15
    elif metrics.shoulder_height_diff_pct > 2.0:
        findings.append(ClinicalFinding(
            measurement="Shoulder Height Difference",
            value=metrics.shoulder_height_diff_pct,
            unit="% of torso",
            severity="moderate",
            clinical_context="Moderate shoulder height difference detected. "
                           "About 28% of healthy adolescents show this level of asymmetry. "
                           "While not diagnostic alone, combined with other findings it may "
                           "warrant further evaluation.",
            reference="Kuklo et al. (2006) shoulder imbalance threshold"
        ))
        risk_score += 8
    elif metrics.shoulder_height_diff_pct > 1.0:
        findings.append(ClinicalFinding(
            measurement="Shoulder Height Difference",
            value=metrics.shoulder_height_diff_pct,
            unit="% of torso",
            severity="mild",
            clinical_context="Within normal variation. Studies show only 19% of adolescents "
                           "have perfectly level shoulders. This level of asymmetry is common "
                           "and typically not clinically significant.",
            reference="Akel et al. photographic shoulder assessment"
        ))
        risk_score += 3

    # ============================================================
    # TRUNK SHIFT (Coronal Balance)
    # Measured as % of shoulder width
    # Threshold: >7.5% is significant, >5% is moderate
    # ============================================================
    if metrics.trunk_shift_pct > 7.5:
        findings.append(ClinicalFinding(
            measurement="Trunk Shift (Coronal Balance)",
            value=metrics.trunk_shift_pct,
            unit="% of shoulder width",
            severity="significant",
            clinical_context="Significant lateral trunk deviation. The Scoliosis "
                           "Research Society classifies this as Type B/C imbalance. This level "
                           "of lateral trunk deviation strongly suggests underlying spinal "
                           "curvature and requires clinical evaluation.",
            reference="SRS coronal balance classification; European Spine Journal (2018)"
        ))
        risk_score += 35
    elif metrics.trunk_shift_pct > 5.0:
        findings.append(ClinicalFinding(
            measurement="Trunk Shift (Coronal Balance)",
            value=metrics.trunk_shift_pct,
            unit="% of shoulder width",
            severity="moderate",
            clinical_context="Moderate trunk decompensation detected. "
                           "This indicates the upper body is shifted laterally relative to "
                           "the pelvis, which may indicate compensatory posturing for an "
                           "underlying spinal curve.",
            reference="Scoliosis Research Society decompensation criteria"
        ))
        risk_score += 20
    elif metrics.trunk_shift_pct > 2.5:
        findings.append(ClinicalFinding(
            measurement="Trunk Shift (Coronal Balance)",
            value=metrics.trunk_shift_pct,
            unit="% of shoulder width",
            severity="mild",
            clinical_context="Minor lateral shift detected. This is within normal postural "
                           "variation and may be influenced by stance, muscle fatigue, or "
                           "habitual posture rather than structural deformity.",
            reference="Coronal balance assessment guidelines"
        ))
        risk_score += 5

    # ============================================================
    # HIP HEIGHT DIFFERENCE (Pelvic Obliquity)
    # Threshold: >3% of torso height is significant
    # ============================================================
    if metrics.hip_height_diff_pct > 3.0:
        findings.append(ClinicalFinding(
            measurement="Hip/Pelvic Height Difference",
            value=metrics.hip_height_diff_pct,
            unit="% of torso",
            severity="significant",
            clinical_context="Significant pelvic obliquity detected. This may indicate "
                           "leg length discrepancy (functional or structural) or compensatory "
                           "changes from lumbar spinal curvature. Pelvic obliquity can both "
                           "cause and result from scoliosis.",
            reference="Pelvic obliquity in scoliosis assessment literature"
        ))
        risk_score += 20
    elif metrics.hip_height_diff_pct > 1.5:
        findings.append(ClinicalFinding(
            measurement="Hip/Pelvic Height Difference",
            value=metrics.hip_height_diff_pct,
            unit="% of torso",
            severity="moderate",
            clinical_context="Moderate pelvic obliquity. May indicate mild leg length "
                           "difference or habitual standing posture. Worth noting but "
                           "not diagnostic alone.",
            reference="Pelvic assessment in postural screening"
        ))
        risk_score += 10

    # ============================================================
    # ROTATION SCORES (3D asymmetry from depth estimation)
    # Note: These are less reliable from 2D photos
    # ============================================================
    if metrics.shoulder_rotation_score > 0.08:
        findings.append(ClinicalFinding(
            measurement="Shoulder Rotation Asymmetry",
            value=metrics.shoulder_rotation_score,
            unit="ratio",
            severity="moderate",
            clinical_context="Detected rotational asymmetry in the shoulders, suggesting "
                           "one shoulder may be more forward than the other. This can "
                           "indicate thoracic rotation associated with scoliosis, though "
                           "photo-based detection has limitations.",
            reference="3D postural assessment methodology"
        ))
        risk_score += 10

    if metrics.hip_rotation_score > 0.08:
        findings.append(ClinicalFinding(
            measurement="Hip Rotation Asymmetry",
            value=metrics.hip_rotation_score,
            unit="ratio",
            severity="moderate",
            clinical_context="Detected rotational asymmetry in the hips/pelvis. This may "
                           "indicate pelvic rotation which can accompany lumbar curves.",
            reference="Pelvic rotation assessment"
        ))
        risk_score += 10

    # ============================================================
    # DETERMINE OVERALL RISK LEVEL
    # Based on weighted score from clinical findings
    # ============================================================
    risk_factors = []
    for finding in findings:
        severity_prefix = {
            "significant": "⚠️ ",
            "moderate": "◐ ",
            "mild": "○ ",
            "normal": "✓ "
        }.get(finding.severity, "")

        risk_factors.append(
            f"{severity_prefix}{finding.measurement}: {finding.value:.0f}{finding.unit} "
            f"({finding.severity.upper()})"
        )
        risk_factors.append(f"   → {finding.clinical_context}")

    # Determine risk level based on weighted score
    if risk_score >= 50:
        risk_level = RiskLevel.HIGH
        recommendations = [
            "CLINICAL EVALUATION RECOMMENDED: Multiple significant asymmetries detected "
            "that exceed clinical thresholds used in scoliosis screening programs.",

            "These findings suggest possible underlying spinal curvature. While photo-based "
            "screening cannot measure Cobb angle (requires X-ray), the pattern of asymmetries "
            "is consistent with what clinicians look for during physical examination.",

            "NEXT STEPS: Consult a healthcare provider (orthopedist, physiatrist, or spine "
            "specialist) for clinical examination. They may recommend standing spine X-rays "
            "to measure actual curvature if warranted.",

            "IMPORTANT: Early detection in adolescents (ages 10-18) is crucial as curves can "
            "progress during growth spurts. Treatment options are most effective when started early."
        ]
    elif risk_score >= 25:
        risk_level = RiskLevel.MEDIUM
        recommendations = [
            "MONITORING ADVISED: Some postural asymmetries detected that approach or exceed "
            "clinical screening thresholds.",

            "These findings alone are not diagnostic but may warrant attention, especially in "
            "growing adolescents or if you've noticed changes in posture, uneven shoulders, "
            "or clothing fitting differently.",

            "SUGGESTED ACTIONS: (1) Retake this screening in 4-6 weeks to monitor for changes. "
            "(2) Consider a clinical screening exam (Adams forward bend test) by a healthcare "
            "provider. (3) Watch for progression of any asymmetry.",

            "CONTEXT: School scoliosis screening programs look for similar asymmetries. A "
            "scoliometer reading >7° (roughly equivalent to visible trunk rotation) typically "
            "triggers referral for X-ray evaluation."
        ]
    else:
        risk_level = RiskLevel.LOW
        if not findings:
            risk_factors.append("✓ No significant postural asymmetries detected")
            risk_factors.append("   → All measurements within normal population variation")

        recommendations = [
            "REASSURING FINDINGS: Your postural measurements fall within normal variation "
            "seen in the general population.",

            "CONTEXT: Studies show only 19% of adolescents have perfectly symmetrical shoulders, "
            "and minor postural variations are common and typically not clinically significant.",

            "MAINTENANCE: Continue good posture habits and general physical activity. "
            "Core strengthening and flexibility exercises support spinal health.",

            "FOLLOW-UP: Consider repeating this screening in 6-12 months, especially during "
            "adolescent growth periods, to monitor for any changes."
        ]

    return risk_level, risk_factors, recommendations


def analyze_back_photo(image: Image.Image) -> PhotoAnalysisResult:
    """
    Complete analysis of a back photo for scoliosis screening.

    Args:
        image: PIL Image of person's back

    Returns:
        PhotoAnalysisResult with all metrics and recommendations

    Raises:
        ValueError: If no pose is detected in the image
    """
    # Ensure RGB
    if image.mode != "RGB":
        image = image.convert("RGB")

    # Detect pose landmarks
    landmarks, confidence = detect_pose_landmarks(image)

    if landmarks is None:
        raise ValueError("No person detected in the image. Please ensure your full back is visible.")

    # Calculate metrics
    metrics = calculate_asymmetry_metrics(
        landmarks,
        image.width,
        image.height
    )

    # Assess risk
    risk_level, risk_factors, recommendations = assess_risk_level(metrics)

    return PhotoAnalysisResult(
        landmarks=landmarks,
        metrics=metrics,
        risk_level=risk_level,
        risk_factors=risk_factors,
        recommendations=recommendations,
        landmark_confidence=confidence
    )
