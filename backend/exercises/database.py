from typing import List, Dict
from api.schemas import Exercise

# Exercise database organized by Schroth type
EXERCISE_DATABASE: Dict[str, List[Exercise]] = {
    "3C": [
        Exercise(
            id="3c_side_shift",
            name="Side Shift with Arm Reach",
            description="Elongate the thoracic spine while shifting away from the curve to reduce thoracic convexity.",
            target_area="thoracic",
            schroth_types=["3C", "3CP"],
            duration="30 seconds",
            repetitions="3 sets each side",
            difficulty="beginner",
            instructions=[
                "Stand with feet hip-width apart, weight evenly distributed",
                "Reach the arm on the concave (collapsed) side overhead",
                "Shift your ribcage away from the thoracic curve",
                "Hold the position while breathing deeply into the concave side",
                "Focus on elongating and de-rotating the spine"
            ]
        ),
        Exercise(
            id="3c_wall_derotation",
            name="Wall-Assisted De-rotation",
            description="Use the wall to support spinal de-rotation and correct thoracic rotation.",
            target_area="thoracic",
            schroth_types=["3C"],
            duration="45 seconds",
            repetitions="5 repetitions",
            difficulty="intermediate",
            instructions=[
                "Stand sideways to the wall, curve side facing the wall",
                "Place your forearm on the wall at shoulder height",
                "Rotate your ribcage away from the wall",
                "Maintain elongation through the entire spine",
                "Breathe deeply into the concave (collapsed) areas"
            ]
        ),
        Exercise(
            id="3c_prone_extension",
            name="Prone Extension with Correction",
            description="Strengthen back muscles while maintaining corrected spinal position.",
            target_area="thoracic",
            schroth_types=["3C"],
            duration="10 seconds hold",
            repetitions="8-10 repetitions",
            difficulty="intermediate",
            instructions=[
                "Lie face down on a firm surface",
                "Place arms in a goal post position (elbows at 90 degrees)",
                "Lift chest slightly while de-rotating the thoracic spine",
                "Focus on lifting the concave side higher",
                "Hold briefly, then lower with control"
            ]
        )
    ],
    "3CP": [
        Exercise(
            id="3cp_pelvic_correction",
            name="Pelvic Shift Correction",
            description="Correct unbalanced pelvis while addressing the thoracic curve pattern.",
            target_area="pelvis",
            schroth_types=["3CP"],
            duration="30 seconds",
            repetitions="3 sets",
            difficulty="intermediate",
            instructions=[
                "Stand with feet hip-width apart",
                "Shift your pelvis toward the deviated side to center it",
                "Simultaneously reach the opposite arm overhead",
                "Create length through the waist on the concave side",
                "Hold the corrected position and breathe"
            ]
        ),
        Exercise(
            id="3cp_hip_hike",
            name="Hip Hike Exercise",
            description="Strengthen hip muscles to support pelvic correction.",
            target_area="pelvis",
            schroth_types=["3CP", "4CP"],
            duration="5 seconds hold",
            repetitions="10-12 each side",
            difficulty="beginner",
            instructions=[
                "Stand on a step with one leg hanging off the edge",
                "Keep the standing leg straight",
                "Lower the hanging hip by tilting the pelvis",
                "Then lift the hip by contracting the standing side",
                "Control the movement through the full range"
            ]
        ),
        Exercise(
            id="3cp_side_lying",
            name="Side-Lying Correction",
            description="Use gravity to assist spinal correction while lying on your side.",
            target_area="thoracic",
            schroth_types=["3CP"],
            duration="2-3 minutes",
            repetitions="1-2 times daily",
            difficulty="beginner",
            instructions=[
                "Lie on your side with the thoracic convexity facing up",
                "Place a small rolled towel under your waist",
                "Reach your top arm overhead to elongate",
                "Focus on breathing into the collapsed areas",
                "Allow gravity to help correct the curve"
            ]
        )
    ],
    "4C": [
        Exercise(
            id="4c_lumbar_elongation",
            name="Lumbar Elongation Stretch",
            description="Create length in the lumbar spine while stabilizing the thoracic region.",
            target_area="lumbar",
            schroth_types=["4C", "4CP"],
            duration="30 seconds",
            repetitions="3 sets each side",
            difficulty="beginner",
            instructions=[
                "Lie on your side with the lumbar curve facing up",
                "Place a small towel roll under your waist for support",
                "Reach your top arm overhead",
                "Press your bottom hip down toward your feet",
                "Feel the stretch along the concave (collapsed) side"
            ]
        ),
        Exercise(
            id="4c_cat_cow_modified",
            name="Modified Cat-Cow for Double Curves",
            description="Mobilize the spine with awareness of both curve regions.",
            target_area="full_spine",
            schroth_types=["4C"],
            duration="1 minute",
            repetitions="8-10 cycles",
            difficulty="beginner",
            instructions=[
                "Start on hands and knees in tabletop position",
                "As you round the spine (cat), focus on the thoracic region",
                "As you arch (cow), focus on lumbar elongation",
                "Move slowly and coordinate with breath",
                "Emphasize de-rotation in both positions"
            ]
        ),
        Exercise(
            id="4c_quadruped_reach",
            name="Quadruped Opposite Reach",
            description="Strengthen core while practicing spinal elongation and balance.",
            target_area="full_spine",
            schroth_types=["4C"],
            duration="5 seconds hold",
            repetitions="10 each side",
            difficulty="intermediate",
            instructions=[
                "Start on hands and knees",
                "Extend opposite arm and leg simultaneously",
                "Focus on keeping the spine long and neutral",
                "Avoid rotation or lateral shift",
                "Hold briefly, then return with control"
            ]
        )
    ],
    "4CP": [
        Exercise(
            id="4cp_hip_correction",
            name="Hip Shift with Lumbar De-rotation",
            description="Correct pelvis imbalance while addressing the lumbar curve pattern.",
            target_area="lumbar",
            schroth_types=["4CP"],
            duration="45 seconds",
            repetitions="3 sets",
            difficulty="intermediate",
            instructions=[
                "Stand with feet hip-width apart",
                "Shift your hips away from the lumbar convexity",
                "Rotate the lumbar spine toward neutral",
                "Maintain the pelvic correction throughout",
                "Focus on breathing into the concave lumbar area"
            ]
        ),
        Exercise(
            id="4cp_seated_correction",
            name="Seated Pelvic-Lumbar Correction",
            description="Practice spinal correction in a seated position for daily activities.",
            target_area="lumbar",
            schroth_types=["4CP"],
            duration="Hold during sitting",
            repetitions="Practice frequently",
            difficulty="beginner",
            instructions=[
                "Sit on a firm chair with feet flat",
                "Feel both sit bones equally weighted",
                "Shift pelvis to correct the imbalance",
                "Elongate through the lumbar spine",
                "Maintain this position during daily sitting"
            ]
        ),
        Exercise(
            id="4cp_standing_correction",
            name="Standing Correction with Support",
            description="Practice full spinal correction using a wall for feedback.",
            target_area="full_spine",
            schroth_types=["4CP"],
            duration="1 minute",
            repetitions="5 times daily",
            difficulty="intermediate",
            instructions=[
                "Stand with your back against a wall",
                "Feel the areas that don't touch the wall",
                "Shift pelvis to level it",
                "Press the concave areas toward the wall",
                "Breathe and maintain the corrected posture"
            ]
        )
    ],
    "general": [
        Exercise(
            id="general_rab",
            name="Rotational Angular Breathing (RAB)",
            description="Core Schroth breathing technique that expands collapsed areas of the ribcage.",
            target_area="full_spine",
            schroth_types=["3C", "3CP", "4C", "4CP"],
            duration="5 minutes",
            repetitions="10 breath cycles",
            difficulty="beginner",
            instructions=[
                "Identify your concave (collapsed) areas",
                "Place your hands on these areas for feedback",
                "Inhale deeply, directing breath into the collapsed areas",
                "Feel your ribs expand outward under your hands",
                "Exhale slowly while maintaining the expanded position"
            ]
        ),
        Exercise(
            id="general_elongation",
            name="Active Elongation",
            description="Create maximum length through the spine while maintaining corrections.",
            target_area="full_spine",
            schroth_types=["3C", "3CP", "4C", "4CP"],
            duration="30 seconds",
            repetitions="5-8 repetitions",
            difficulty="beginner",
            instructions=[
                "Stand or sit with good posture",
                "Imagine a string pulling the crown of your head upward",
                "Lengthen your neck and spine without arching",
                "Keep shoulders relaxed and down",
                "Maintain the elongation while breathing normally"
            ]
        ),
        Exercise(
            id="general_awareness",
            name="Posture Awareness Check",
            description="Regular self-checks to maintain corrected posture throughout the day.",
            target_area="full_spine",
            schroth_types=["3C", "3CP", "4C", "4CP"],
            duration="30 seconds",
            repetitions="Hourly throughout day",
            difficulty="beginner",
            instructions=[
                "Set regular reminders to check your posture",
                "Notice if you've returned to your curve pattern",
                "Reset your pelvis position",
                "Elongate through your spine",
                "Take one deep breath into your concave areas"
            ]
        )
    ]
}
