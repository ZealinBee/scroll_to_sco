from pydantic import BaseModel, Field
from typing import List, Optional
from enum import Enum


class CurveLocation(str, Enum):
    THORACIC = "thoracic"
    LUMBAR = "lumbar"
    THORACOLUMBAR = "thoracolumbar"


class CurveDirection(str, Enum):
    LEFT = "left"
    RIGHT = "right"
    NONE = "none"


class SchrothType(str, Enum):
    TYPE_3C = "3C"
    TYPE_3CP = "3CP"
    TYPE_4C = "4C"
    TYPE_4CP = "4CP"
    UNKNOWN = "unknown"


class Severity(str, Enum):
    MILD = "mild"
    MODERATE = "moderate"
    SEVERE = "severe"
    VERY_SEVERE = "very_severe"


class ImageOrientation(str, Enum):
    """Patient orientation in the image"""
    STANDARD = "standard"      # Patient's left is on image right (typical PA view)
    FLIPPED = "flipped"        # Patient's left is on image left (mirrored)
    UNKNOWN = "unknown"        # No marker detected


class Keypoint(BaseModel):
    x: float
    y: float
    confidence: float = 1.0


class Vertebra(BaseModel):
    index: int
    label: str
    bounding_box: List[float]
    keypoints: List[Keypoint]
    confidence: float
    tilt_angle: float = 0.0


class CobbAngleMeasurement(BaseModel):
    angle: float
    upper_vertebra: str
    lower_vertebra: str
    apex_vertebra: str
    curve_location: CurveLocation
    curve_direction: CurveDirection


class Exercise(BaseModel):
    id: str
    name: str
    description: str
    target_area: str
    schroth_types: List[str]
    duration: str
    repetitions: str
    difficulty: str
    instructions: List[str]
    image_url: Optional[str] = None
    video_url: Optional[str] = None


class DetectedMarker(BaseModel):
    """OCR-detected orientation marker"""
    marker: str               # "L", "R", or "unknown"
    position: str             # "left", "right"
    confidence: float


class OrientationDetectionResult(BaseModel):
    """Result of marker detection"""
    detected_marker: Optional[DetectedMarker] = None
    suggested_orientation: ImageOrientation
    confidence: float


class OrientationDetectionRequest(BaseModel):
    image: str = Field(..., description="Base64 encoded image")


class OrientationDetectionResponse(BaseModel):
    success: bool
    detection_result: OrientationDetectionResult
    preview_image: str  # Base64 image with detected marker highlighted


class AnalysisRequest(BaseModel):
    image: str = Field(..., description="Base64 encoded image")
    confirmed_orientation: Optional[ImageOrientation] = Field(
        default=None,
        description="User-confirmed orientation. If not provided, auto-detection is used."
    )
    image_flipped: bool = Field(
        default=False,
        description="Whether the user flipped the image horizontally"
    )


class AnalysisResponse(BaseModel):
    success: bool
    image_id: str

    # Detection results
    vertebrae: List[Vertebra]
    total_vertebrae_detected: int

    # Cobb angle measurements
    cobb_angles: List[CobbAngleMeasurement]
    primary_cobb_angle: float

    # Classifications
    curve_location: CurveLocation
    curve_direction: CurveDirection
    schroth_type: SchrothType
    severity: Severity

    # Visualization
    annotated_image: str

    # Recommendations
    exercises: List[Exercise]

    # Metadata
    confidence_score: float
    processing_time_ms: float

    # Orientation info
    orientation_used: ImageOrientation = ImageOrientation.STANDARD
    orientation_confidence: float = 1.0


class ErrorResponse(BaseModel):
    success: bool = False
    error: str
    error_code: str


class HealthResponse(BaseModel):
    status: str
    model_loaded: bool


# ============================================
# Photo Analysis Schemas (Back Photo Screening)
# ============================================

class RiskLevel(str, Enum):
    LOW = "LOW"
    MEDIUM = "MEDIUM"
    HIGH = "HIGH"


class AsymmetryMetrics(BaseModel):
    """
    Calculated asymmetry metrics from pose analysis.

    Based on HAI (Height Asymmetry Index) methodology which measures
    height differences at shoulders, axillary folds, and waist creases.
    All measurements are expressed as percentages of torso height for
    camera-distance independence.
    Reference: POTSI methodology (Suzuki et al.)
    """
    # Primary measurements (as % of torso height)
    shoulder_height_diff_pct: float = Field(..., description="Shoulder height difference as % of torso height")
    hip_height_diff_pct: float = Field(..., description="Hip height difference as % of torso height")
    trunk_shift_pct: float = Field(..., description="Lateral trunk shift as % of shoulder width")

    # HAI component measurements (as % of torso height)
    waist_height_diff_pct: float = Field(0.0, description="Waist crease height difference as % of torso height")
    axilla_height_diff_pct: float = Field(0.0, description="Axillary fold height difference as % of torso height")

    # Rotation/depth scores (0-1 scale, camera-independent)
    shoulder_rotation_score: float = Field(..., description="Shoulder rotation asymmetry (0-1)")
    hip_rotation_score: float = Field(..., description="Hip rotation asymmetry (0-1)")
    scapula_prominence_diff: float = Field(0.0, description="Scapula prominence difference")

    # Composite scores
    hai_score: float = Field(0.0, description="Height Asymmetry Index (POTSI: >10 is pathologic)")
    overall_asymmetry_score: float = Field(..., description="Overall asymmetry score (0-100)")

    # Side indicators (which side is higher/more prominent)
    higher_shoulder: Optional[str] = Field(None, description="Which shoulder is higher: 'left', 'right', or None if equal")
    higher_hip: Optional[str] = Field(None, description="Which hip is higher: 'left', 'right', or None if equal")


class LandmarkPosition(BaseModel):
    """A landmark position for manual adjustment."""
    x: float = Field(..., description="Normalized X coordinate (0-1)")
    y: float = Field(..., description="Normalized Y coordinate (0-1)")


class LandmarkPositions(BaseModel):
    """All landmark positions for the photo analysis."""
    left_shoulder: LandmarkPosition
    right_shoulder: LandmarkPosition
    left_hip: LandmarkPosition
    right_hip: LandmarkPosition
    left_axilla: LandmarkPosition
    right_axilla: LandmarkPosition
    left_waist: LandmarkPosition
    right_waist: LandmarkPosition


class PhotoAnalysisRequest(BaseModel):
    """Request for back photo analysis."""
    image: str = Field(..., description="Base64 encoded image of person's back")


class RecalculateMetricsRequest(BaseModel):
    """Request to recalculate metrics from manually adjusted landmarks."""
    landmarks: LandmarkPositions = Field(..., description="Manually adjusted landmark positions")
    image_width: int = Field(..., description="Original image width in pixels")
    image_height: int = Field(..., description="Original image height in pixels")


class PhotoAnalysisResponse(BaseModel):
    """Response from back photo analysis."""
    success: bool
    image_id: str

    # Analysis results
    metrics: AsymmetryMetrics
    risk_level: RiskLevel
    risk_factors: List[str] = Field(..., description="Human-readable risk factors detected")
    recommendations: List[str] = Field(..., description="Recommendations based on risk level")

    # Visualization
    annotated_image: str = Field(..., description="Base64 encoded image with pose overlay")
    original_image: Optional[str] = Field(None, description="Base64 encoded original image (for landmark editing)")

    # Landmark positions (for manual adjustment)
    landmarks: Optional[LandmarkPositions] = Field(None, description="Detected landmark positions")

    # Image dimensions (needed for recalculation)
    image_width: Optional[int] = Field(None, description="Image width in pixels")
    image_height: Optional[int] = Field(None, description="Image height in pixels")

    # Metadata
    landmark_confidence: float = Field(..., description="Confidence of pose detection (0-1)")
    processing_time_ms: float
