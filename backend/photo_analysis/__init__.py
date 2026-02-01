"""
Photo Analysis Module

Uses MediaPipe Pose to analyze back photos for scoliosis screening indicators.
This is a screening tool only, not a diagnostic tool.
"""

from .mediapipe_analyzer import (
    analyze_back_photo,
    detect_pose_landmarks,
    calculate_asymmetry_metrics,
    assess_risk_level,
    reset_pose_landmarker,
)
from .validation import validate_photo_for_analysis
from .visualization import draw_pose_overlay

# Reset pose landmarker on module load to ensure fresh model
reset_pose_landmarker()

__all__ = [
    "analyze_back_photo",
    "detect_pose_landmarks",
    "calculate_asymmetry_metrics",
    "assess_risk_level",
    "reset_pose_landmarker",
    "validate_photo_for_analysis",
    "draw_pose_overlay",
]
