import time
import uuid
import numpy as np
from fastapi import APIRouter, HTTPException

from .schemas import (
    AnalysisRequest, AnalysisResponse, ErrorResponse, HealthResponse,
    Severity, ImageOrientation,
    OrientationDetectionRequest, OrientationDetectionResponse,
    OrientationDetectionResult,
    PhotoAnalysisRequest, PhotoAnalysisResponse, AsymmetryMetrics, RiskLevel,
    LandmarkPosition, LandmarkPositions, RecalculateMetricsRequest
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
from scoliovis.orientation import (
    detect_lr_marker, flip_image_horizontal, draw_marker_highlight
)
from exercises.recommendations import get_exercises_for_schroth_type
from utils.validation import (
    validate_image, validate_detection_results,
    ValidationError, ErrorCodes
)

router = APIRouter()


@router.post("/detect-orientation", response_model=OrientationDetectionResponse)
async def detect_orientation(request: OrientationDetectionRequest):
    """
    Detect L/R marker orientation on an X-ray image.

    Returns:
    - Detected marker (if any)
    - Suggested orientation
    - Preview image with marker highlighted
    """
    try:
        # Validate and decode image
        image = validate_image(request.image)
        image_np = image_to_numpy(image)

        # Detect marker
        detection_result = detect_lr_marker(image)

        # Create preview image
        if detection_result.detected_marker:
            preview_np = draw_marker_highlight(image_np, detection_result.detected_marker)
        else:
            preview_np = image_np

        preview_base64 = image_to_base64(preview_np)

        return OrientationDetectionResponse(
            success=True,
            detection_result=detection_result,
            preview_image=preview_base64
        )

    except ValidationError as e:
        raise HTTPException(status_code=400, detail={
            "error": e.message,
            "error_code": e.error_code
        })

    except Exception as e:
        print(f"Orientation detection error: {str(e)}")
        raise HTTPException(status_code=500, detail={
            "error": f"Orientation detection failed: {str(e)}",
            "error_code": ErrorCodes.MODEL_ERROR
        })


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

        # 2. Handle image flipping if user requested
        if request.image_flipped:
            image = flip_image_horizontal(image)

        image_np = image_to_numpy(image)

        # 3. Determine orientation to use
        if request.confirmed_orientation:
            orientation = request.confirmed_orientation
            orientation_confidence = 1.0  # User confirmed
        else:
            # Auto-detect orientation
            detection_result = detect_lr_marker(image)
            orientation = detection_result.suggested_orientation
            orientation_confidence = detection_result.confidence

        # 4. Get model and run inference
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

        # 6. Calculate Cobb angles (with orientation for correct left/right)
        cobb_angles = calculate_all_cobb_angles(vertebrae, orientation)
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
            processing_time_ms=round(processing_time, 2),
            orientation_used=orientation,
            orientation_confidence=round(orientation_confidence, 3)
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


@router.post("/analyze-photo", response_model=PhotoAnalysisResponse)
async def analyze_photo(request: PhotoAnalysisRequest):
    """
    Analyze a back photo for scoliosis screening indicators.

    This is a SCREENING TOOL ONLY, not a diagnostic tool.
    It uses pose estimation to detect postural asymmetries that may indicate scoliosis.

    Returns:
    - Asymmetry metrics (shoulder/hip height differences, trunk shift, rotation)
    - Risk level assessment (LOW, MEDIUM, HIGH)
    - Human-readable risk factors
    - Recommendations based on findings
    - Annotated image with pose overlay
    """
    from photo_analysis import (
        analyze_back_photo,
        validate_photo_for_analysis,
        draw_pose_overlay
    )
    from photo_analysis.visualization import image_to_base64
    from photo_analysis.mediapipe_analyzer import RiskLevel as AnalyzerRiskLevel

    start_time = time.time()

    try:
        # 1. Validate and decode image
        image = validate_image(request.image)

        # 2. Validate photo is suitable for analysis
        validation_result = validate_photo_for_analysis(image)
        if not validation_result.is_valid:
            raise ValidationError(
                message=validation_result.error_message or "Invalid photo",
                error_code=ErrorCodes.INVALID_IMAGE_FORMAT
            )

        # 3. Run analysis
        result = analyze_back_photo(image)

        # 4. Generate annotated image
        annotated_np = draw_pose_overlay(
            image,
            result.landmarks,
            result.metrics,
            result.risk_level
        )
        annotated_base64 = image_to_base64(annotated_np)

        # 5. Calculate processing time
        processing_time = (time.time() - start_time) * 1000

        # 6. Convert risk level enum
        risk_level_map = {
            AnalyzerRiskLevel.LOW: RiskLevel.LOW,
            AnalyzerRiskLevel.MEDIUM: RiskLevel.MEDIUM,
            AnalyzerRiskLevel.HIGH: RiskLevel.HIGH,
        }

        # 7. Extract landmark positions for manual adjustment
        from photo_analysis.mediapipe_analyzer import (
            PoseLandmark, estimate_derived_landmarks
        )

        derived = estimate_derived_landmarks(result.landmarks)
        landmark_positions = LandmarkPositions(
            left_shoulder=LandmarkPosition(
                x=result.landmarks[PoseLandmark.LEFT_SHOULDER].x,
                y=result.landmarks[PoseLandmark.LEFT_SHOULDER].y
            ),
            right_shoulder=LandmarkPosition(
                x=result.landmarks[PoseLandmark.RIGHT_SHOULDER].x,
                y=result.landmarks[PoseLandmark.RIGHT_SHOULDER].y
            ),
            left_hip=LandmarkPosition(
                x=result.landmarks[PoseLandmark.LEFT_HIP].x,
                y=result.landmarks[PoseLandmark.LEFT_HIP].y
            ),
            right_hip=LandmarkPosition(
                x=result.landmarks[PoseLandmark.RIGHT_HIP].x,
                y=result.landmarks[PoseLandmark.RIGHT_HIP].y
            ),
            left_axilla=LandmarkPosition(
                x=derived.left_axilla[0],
                y=derived.left_axilla[1]
            ),
            right_axilla=LandmarkPosition(
                x=derived.right_axilla[0],
                y=derived.right_axilla[1]
            ),
            left_waist=LandmarkPosition(
                x=derived.left_waist[0],
                y=derived.left_waist[1]
            ),
            right_waist=LandmarkPosition(
                x=derived.right_waist[0],
                y=derived.right_waist[1]
            ),
        )

        # 8. Encode original image for landmark editor
        original_base64 = image_to_base64(np.array(image))

        return PhotoAnalysisResponse(
            success=True,
            image_id=str(uuid.uuid4()),
            metrics=AsymmetryMetrics(
                shoulder_height_diff_pct=result.metrics.shoulder_height_diff_pct,
                hip_height_diff_pct=result.metrics.hip_height_diff_pct,
                trunk_shift_pct=result.metrics.trunk_shift_pct,
                waist_height_diff_pct=result.metrics.waist_height_diff_pct,
                axilla_height_diff_pct=result.metrics.axilla_height_diff_pct,
                shoulder_rotation_score=result.metrics.shoulder_rotation_score,
                hip_rotation_score=result.metrics.hip_rotation_score,
                scapula_prominence_diff=result.metrics.scapula_prominence_diff,
                hai_score=result.metrics.hai_score,
                overall_asymmetry_score=result.metrics.overall_asymmetry_score,
                higher_shoulder=result.metrics.higher_shoulder,
                higher_hip=result.metrics.higher_hip
            ),
            risk_level=risk_level_map[result.risk_level],
            risk_factors=result.risk_factors,
            recommendations=result.recommendations,
            annotated_image=annotated_base64,
            original_image=original_base64,
            landmarks=landmark_positions,
            image_width=image.width,
            image_height=image.height,
            landmark_confidence=round(result.landmark_confidence, 3),
            processing_time_ms=round(processing_time, 2)
        )

    except ValidationError as e:
        raise HTTPException(status_code=400, detail={
            "error": e.message,
            "error_code": e.error_code
        })

    except ValueError as e:
        # From analyze_back_photo when no pose detected
        raise HTTPException(status_code=400, detail={
            "error": str(e),
            "error_code": ErrorCodes.NO_SPINE_DETECTED
        })

    except Exception as e:
        print(f"Photo analysis error: {str(e)}")
        raise HTTPException(status_code=500, detail={
            "error": f"Photo analysis failed: {str(e)}",
            "error_code": ErrorCodes.MODEL_ERROR
        })


@router.post("/recalculate-metrics")
async def recalculate_metrics(request: RecalculateMetricsRequest):
    """
    Recalculate asymmetry metrics from manually adjusted landmark positions.

    This endpoint allows users to correct landmark positions and get updated measurements.
    """
    from photo_analysis.mediapipe_analyzer import (
        Landmark, AsymmetryMetrics as AnalyzerMetrics,
        assess_risk_level, PoseLandmark
    )
    from photo_analysis.mediapipe_analyzer import RiskLevel as AnalyzerRiskLevel

    try:
        lm = request.landmarks
        w = request.image_width
        h = request.image_height

        # ============================================================
        # Calculate metrics from manually adjusted landmarks
        # Using percentage-based measurements (camera-distance independent)
        # ============================================================

        # Height differences (in pixels)
        shoulder_height_diff_px = (lm.right_shoulder.y - lm.left_shoulder.y) * h
        hip_height_diff_px = (lm.right_hip.y - lm.left_hip.y) * h
        waist_height_diff_px = (lm.right_waist.y - lm.left_waist.y) * h
        axilla_height_diff_px = (lm.right_axilla.y - lm.left_axilla.y) * h

        # Trunk shift
        shoulder_mid_x = (lm.left_shoulder.x + lm.right_shoulder.x) / 2
        hip_mid_x = (lm.left_hip.x + lm.right_hip.x) / 2
        trunk_shift_px = (shoulder_mid_x - hip_mid_x) * w

        # Reference measurements
        torso_height_px = abs(
            ((lm.left_hip.y + lm.right_hip.y) / 2) -
            ((lm.left_shoulder.y + lm.right_shoulder.y) / 2)
        ) * h
        shoulder_width_px = abs(lm.right_shoulder.x - lm.left_shoulder.x) * w

        # Calculate percentages (camera-distance independent)
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

        # HAI calculation
        if torso_height_px > 0:
            total_height_asymmetry = (
                abs(shoulder_height_diff_px) +
                abs(axilla_height_diff_px) +
                abs(waist_height_diff_px)
            )
            hai_score = min(100, (total_height_asymmetry / torso_height_px) * 100)
        else:
            hai_score = 0.0

        # Overall asymmetry score (weighted, using percentages)
        score = 0.0
        score += min(20, (shoulder_height_diff_pct / 2.5) * 20)
        score += min(20, (axilla_height_diff_pct / 2.5) * 20)
        score += min(20, (waist_height_diff_pct / 2.5) * 20)
        score += min(25, (trunk_shift_pct / 5.0) * 25)
        overall_asymmetry_score = min(100, score)

        # Determine which side is higher (from viewer's perspective)
        # In image coordinates: lower Y = higher position on screen
        # If shoulder_height_diff_px > 0: MediaPipe left is higher
        # For BACK PHOTOS, swap to viewer's perspective:
        # - MediaPipe "left" (subject's left) appears on RIGHT side of image
        # - MediaPipe "right" (subject's right) appears on LEFT side of image
        SIDE_THRESHOLD = 0.5  # Threshold in percentage to consider as "different"

        if shoulder_height_diff_pct >= SIDE_THRESHOLD:
            # Swap: subject's left = viewer's right
            higher_shoulder = "right" if shoulder_height_diff_px > 0 else "left"
        else:
            higher_shoulder = None

        if hip_height_diff_pct >= SIDE_THRESHOLD:
            higher_hip = "right" if hip_height_diff_px > 0 else "left"
        else:
            higher_hip = None

        # Create metrics object
        metrics = AnalyzerMetrics(
            shoulder_height_diff_px=round(shoulder_height_diff_px, 1),
            hip_height_diff_px=round(hip_height_diff_px, 1),
            trunk_shift_px=round(trunk_shift_px, 1),
            waist_height_diff_px=round(waist_height_diff_px, 1),
            axilla_height_diff_px=round(axilla_height_diff_px, 1),
            scapula_prominence_diff=0.0,  # Can't calculate from 2D positions
            shoulder_rotation_score=0.0,  # Can't calculate from 2D positions
            hip_rotation_score=0.0,  # Can't calculate from 2D positions
            hai_score=round(hai_score, 1),
            overall_asymmetry_score=round(overall_asymmetry_score, 1),
            shoulder_height_diff_pct=round(shoulder_height_diff_pct, 1),
            hip_height_diff_pct=round(hip_height_diff_pct, 1),
            trunk_shift_pct=round(trunk_shift_pct, 1),
            waist_height_diff_pct=round(waist_height_diff_pct, 1),
            axilla_height_diff_pct=round(axilla_height_diff_pct, 1),
            higher_shoulder=higher_shoulder,
            higher_hip=higher_hip
        )

        # Assess risk level
        risk_level, risk_factors, recommendations = assess_risk_level(metrics)

        # Convert risk level enum
        risk_level_map = {
            AnalyzerRiskLevel.LOW: RiskLevel.LOW,
            AnalyzerRiskLevel.MEDIUM: RiskLevel.MEDIUM,
            AnalyzerRiskLevel.HIGH: RiskLevel.HIGH,
        }

        response_metrics = {
            "shoulder_height_diff_pct": metrics.shoulder_height_diff_pct,
            "hip_height_diff_pct": metrics.hip_height_diff_pct,
            "trunk_shift_pct": metrics.trunk_shift_pct,
            "waist_height_diff_pct": metrics.waist_height_diff_pct,
            "axilla_height_diff_pct": metrics.axilla_height_diff_pct,
            "shoulder_rotation_score": metrics.shoulder_rotation_score,
            "hip_rotation_score": metrics.hip_rotation_score,
            "scapula_prominence_diff": metrics.scapula_prominence_diff,
            "hai_score": metrics.hai_score,
            "overall_asymmetry_score": metrics.overall_asymmetry_score,
            "higher_shoulder": metrics.higher_shoulder,
            "higher_hip": metrics.higher_hip,
        }

        return {
            "success": True,
            "metrics": response_metrics,
            "risk_level": risk_level_map[risk_level].value,  # Convert enum to string
            "risk_factors": risk_factors,
            "recommendations": recommendations
        }

    except Exception as e:
        print(f"Recalculate metrics error: {str(e)}")
        raise HTTPException(status_code=500, detail={
            "error": f"Failed to recalculate metrics: {str(e)}",
            "error_code": "CALCULATION_ERROR"
        })
