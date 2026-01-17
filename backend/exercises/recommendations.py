from typing import List, Optional
from api.schemas import Exercise, SchrothType
from .database import EXERCISE_DATABASE


def get_exercises_for_schroth_type(
    schroth_type: SchrothType,
    difficulty: Optional[str] = None,
    limit: int = 6
) -> List[Exercise]:
    """
    Get recommended exercises for a specific Schroth type.

    Args:
        schroth_type: The Schroth classification (3C, 3CP, 4C, 4CP)
        difficulty: Optional filter by difficulty level
        limit: Maximum number of exercises to return

    Returns:
        List of Exercise objects personalized for the curve pattern
    """
    exercises: List[Exercise] = []

    # Get type-specific exercises
    type_key = schroth_type.value if isinstance(schroth_type, SchrothType) else str(schroth_type)

    if type_key in EXERCISE_DATABASE:
        exercises.extend(EXERCISE_DATABASE[type_key])

    # Add general exercises that apply to all types
    if "general" in EXERCISE_DATABASE:
        for exercise in EXERCISE_DATABASE["general"]:
            # Check if this exercise applies to the current type
            if type_key in exercise.schroth_types or not exercise.schroth_types:
                exercises.append(exercise)

    # Filter by difficulty if specified
    if difficulty:
        exercises = [e for e in exercises if e.difficulty == difficulty]

    # Remove duplicates (by id) while preserving order
    seen_ids = set()
    unique_exercises = []
    for exercise in exercises:
        if exercise.id not in seen_ids:
            seen_ids.add(exercise.id)
            unique_exercises.append(exercise)

    # Return limited number
    return unique_exercises[:limit]


def get_exercises_by_target_area(
    target_area: str,
    schroth_type: Optional[SchrothType] = None
) -> List[Exercise]:
    """
    Get exercises targeting a specific body area.

    Args:
        target_area: Area to target (thoracic, lumbar, pelvis, full_spine)
        schroth_type: Optional filter by Schroth type

    Returns:
        List of exercises for the specified area
    """
    exercises: List[Exercise] = []

    for type_key, type_exercises in EXERCISE_DATABASE.items():
        for exercise in type_exercises:
            if exercise.target_area == target_area:
                if schroth_type is None:
                    exercises.append(exercise)
                elif schroth_type.value in exercise.schroth_types:
                    exercises.append(exercise)

    # Remove duplicates
    seen_ids = set()
    unique_exercises = []
    for exercise in exercises:
        if exercise.id not in seen_ids:
            seen_ids.add(exercise.id)
            unique_exercises.append(exercise)

    return unique_exercises


def get_exercise_progression(
    schroth_type: SchrothType
) -> dict:
    """
    Get a structured progression of exercises for a Schroth type.

    Returns:
        Dictionary with exercises grouped by difficulty
    """
    all_exercises = get_exercises_for_schroth_type(schroth_type, limit=20)

    progression = {
        "beginner": [],
        "intermediate": [],
        "advanced": []
    }

    for exercise in all_exercises:
        if exercise.difficulty in progression:
            progression[exercise.difficulty].append(exercise)

    return progression
