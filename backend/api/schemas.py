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


class AnalysisRequest(BaseModel):
    image: str = Field(..., description="Base64 encoded image")


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


class ErrorResponse(BaseModel):
    success: bool = False
    error: str
    error_code: str


class HealthResponse(BaseModel):
    status: str
    model_loaded: bool
