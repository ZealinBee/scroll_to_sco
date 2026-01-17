import time
import uuid
import numpy as np
from fastapi import APIRouter, HTTPException

from .schemas import (
    AnalysisRequest, AnalysisResponse, ErrorResponse, HealthResponse,
    Severity
)
from scoliovis.model import get_model
from scoliovis.preprocessing import image_to_numpy
from scoliovis.postprocessing import (
    filter_detections, extract_vertebrae, calculate_average_confidence
)
from scoliovis.cobb_angle import calculate_all_cobb_angles, get_primary_cobb_angle
from scoliovis.classification import (
    determine_schroth_type, determine_severity, get_primary_curve_info
)
from scoliovis.visualization import draw_skeleton_overlay, image_to_base64
from exercises.recommendations import get_exercises_for_schroth_type
from utils.validation import (
    validate_image, validate_detection_results,
    ValidationError, ErrorCodes
)

router = APIRouter()


@router.post("/analyze", response_model=AnalysisResponse)
async def analyze_spine(request: AnalysisRequest):
    """
    Analyze a spine X-ray image and return comprehensive results.

    Returns:
    - Vertebrae detection (up to 17 vertebrae with 4 keypoints each)
    - Cobb angle measurements
    - Curve classification (location, direction)
    - Schroth type classification
    - Severity assessment
    - Personalized exercise recommendations
    - Annotated image with skeleton overlay
    """
    start_time = time.time()

    try:
        # 1. Validate and decode image
        image = validate_image(request.image)
        image_np = image_to_numpy(image)

        # 2. Get model and run inference
        model = get_model()
        if not model.is_loaded():
            raise HTTPException(
                status_code=503,
                detail="Model not loaded. Please try again later."
            )

        raw_outputs = model.predict(image)

        # 3. Filter and process detections
        filtered = filter_detections(raw_outputs)

        # 4. Validate detection results
        validate_detection_results(filtered)

        # 5. Extract vertebrae objects
        vertebrae = extract_vertebrae(filtered)

        # 6. Calculate Cobb angles
        cobb_angles = calculate_all_cobb_angles(vertebrae)
        primary_cobb = get_primary_cobb_angle(cobb_angles)

        # 7. Determine classifications
        schroth_type = determine_schroth_type(cobb_angles, vertebrae)
        severity = determine_severity(primary_cobb)
        curve_location, curve_direction = get_primary_curve_info(cobb_angles)

        # 8. Get exercise recommendations
        exercises = get_exercises_for_schroth_type(schroth_type, limit=6)

        # 9. Generate annotated image
        annotated_np = draw_skeleton_overlay(image_np, vertebrae, cobb_angles)
        annotated_base64 = image_to_base64(annotated_np)

        # 10. Calculate confidence
        confidence_score = calculate_average_confidence(vertebrae)

        # Calculate processing time
        processing_time = (time.time() - start_time) * 1000

        return AnalysisResponse(
            success=True,
            image_id=str(uuid.uuid4()),
            vertebrae=vertebrae,
            total_vertebrae_detected=len(vertebrae),
            cobb_angles=cobb_angles,
            primary_cobb_angle=primary_cobb,
            curve_location=curve_location,
            curve_direction=curve_direction,
            schroth_type=schroth_type,
            severity=severity,
            annotated_image=annotated_base64,
            exercises=exercises,
            confidence_score=round(confidence_score, 3),
            processing_time_ms=round(processing_time, 2)
        )

    except ValidationError as e:
        raise HTTPException(status_code=400, detail={
            "error": e.message,
            "error_code": e.error_code
        })

    except Exception as e:
        print(f"Analysis error: {str(e)}")
        raise HTTPException(status_code=500, detail={
            "error": f"Analysis failed: {str(e)}",
            "error_code": ErrorCodes.MODEL_ERROR
        })


@router.get("/health", response_model=HealthResponse)
async def health_check():
    """
    Check if the API and model are ready.
    """
    model = get_model()
    return HealthResponse(
        status="healthy" if model.is_loaded() else "initializing",
        model_loaded=model.is_loaded()
    )
