/**
 * Exercise Database for Scoliosis and Postural Asymmetry Correction
 *
 * Research basis:
 * - Schroth Method (Lehnert-Schroth, 2007): 3D scoliosis treatment approach
 * - SOSORT Guidelines (Negrini et al., 2015): Evidence-based conservative treatment
 * - POTSI/TRACE studies: Photo-based asymmetry correlations to spinal curves
 * - Postural correction research (Morningstar et al., 2005)
 *
 * Exercises are categorized by:
 * - Target asymmetry type (shoulder, hip, trunk, rotation)
 * - Body region affected
 * - Difficulty level
 */

export interface Exercise {
  id: string;
  name: string;
  description: string;
  targetAreas: string[];
  targetAsymmetries: AsymmetryType[];
  difficulty: "beginner" | "intermediate" | "advanced";
  duration: string;
  repetitions: string;
  frequency: string;
  instructions: string[];
  tips: string[];
  contraindications?: string[];
  videoUrl?: string;
  imageUrl?: string;
}

export type AsymmetryType =
  | "shoulder_height"
  | "hip_height"
  | "trunk_shift"
  | "shoulder_rotation"
  | "hip_rotation"
  | "scapula_prominence"
  | "waist_asymmetry"
  | "general_posture";

export interface AsymmetryProfile {
  shoulderHeightDiff: number; // percentage of torso height
  hipHeightDiff: number;
  trunkShift: number;
  shoulderRotation: number; // 0-1 scale
  hipRotation: number;
  scapulaProminence: number;
  waistAsymmetry: number;
  overallScore: number;
  riskLevel: "LOW" | "MEDIUM" | "HIGH";
  // Which side is higher/more prominent
  higherShoulder?: "left" | "right";
  higherHip?: "left" | "right";
  trunkShiftDirection?: "left" | "right";
}

// Threshold values for determining significance (based on POTSI research)
export const THRESHOLDS = {
  shoulderHeight: { mild: 2, moderate: 5, significant: 8 }, // % of torso height
  hipHeight: { mild: 1.5, moderate: 3, significant: 5 },
  trunkShift: { mild: 2, moderate: 4, significant: 6 },
  rotation: { mild: 0.15, moderate: 0.3, significant: 0.5 }, // 0-1 scale
  scapula: { mild: 5, moderate: 10, significant: 15 }, // mm difference
  waist: { mild: 3, moderate: 6, significant: 10 },
};

/**
 * Comprehensive exercise database
 * Each exercise is designed based on Schroth principles and postural correction research
 */
export const EXERCISES: Exercise[] = [
  // ====================================
  // SHOULDER HEIGHT CORRECTION EXERCISES
  // ====================================
  {
    id: "shoulder-shrug-release",
    name: "Shoulder Shrug & Release",
    description:
      "Targeted release for elevated shoulder tension. Helps normalize shoulder height by releasing the upper trapezius on the elevated side.",
    targetAreas: ["Upper Trapezius", "Levator Scapulae", "Neck"],
    targetAsymmetries: ["shoulder_height", "general_posture"],
    difficulty: "beginner",
    duration: "2-3 minutes",
    repetitions: "10 shrugs, hold release 30 seconds",
    frequency: "2-3x daily",
    instructions: [
      "Stand or sit with good posture, arms relaxed at sides",
      "Shrug ONLY the elevated (higher) shoulder up toward your ear",
      "Hold the shrug for 5 seconds, squeezing the muscle",
      "Release slowly and let the shoulder drop completely",
      "At the bottom, actively press the shoulder down toward the floor",
      "Hold this depressed position for 5 seconds",
      "Repeat 10 times on the elevated side only",
    ],
    tips: [
      "Focus on the higher shoulder - don't work both sides equally",
      "The goal is to fatigue and release the overactive upper trap",
      "Breathe normally throughout the exercise",
    ],
  },
  {
    id: "lateral-neck-stretch",
    name: "Lateral Neck Stretch",
    description:
      "Stretches the upper trapezius and scalenes on the elevated shoulder side to help reduce muscle tension causing shoulder elevation.",
    targetAreas: ["Upper Trapezius", "Scalenes", "Neck"],
    targetAsymmetries: ["shoulder_height"],
    difficulty: "beginner",
    duration: "2 minutes",
    repetitions: "Hold 30-45 seconds, 3 times",
    frequency: "2-3x daily",
    instructions: [
      "Sit tall on a chair, holding the seat with your hand on the elevated shoulder side",
      "Tilt your head away from the elevated shoulder (ear toward opposite shoulder)",
      "Gently use your opposite hand on top of your head to deepen the stretch",
      "Keep the shoulder pressed down by gripping the chair seat",
      "You should feel a stretch along the side of your neck and top of the shoulder",
      "Hold for 30-45 seconds, breathing deeply",
      "Repeat 3 times, only on the elevated shoulder side",
    ],
    tips: [
      "Never force the stretch - gentle sustained pressure is more effective",
      "The anchoring hand on the chair seat is crucial for targeting the stretch",
      "Perform this after the shoulder shrug exercise for better results",
    ],
  },
  {
    id: "scapular-depression-exercise",
    name: "Scapular Depression",
    description:
      "Strengthens the lower trapezius to help pull down the elevated shoulder. Essential for long-term shoulder height correction.",
    targetAreas: ["Lower Trapezius", "Serratus Anterior"],
    targetAsymmetries: ["shoulder_height", "scapula_prominence"],
    difficulty: "beginner",
    duration: "3-4 minutes",
    repetitions: "15 reps, 3 sets",
    frequency: "Daily",
    instructions: [
      "Stand with your back against a wall, arms at your sides",
      "Slide the elevated shoulder down the wall as far as possible",
      "Imagine putting your shoulder blade into your back pocket",
      "Hold the depressed position for 5 seconds",
      "Slowly release back to neutral",
      "Focus on feeling the lower trapezius (mid-back) engage",
      "Perform 15 reps, 3 sets, only on the elevated shoulder side",
    ],
    tips: [
      "The movement should come from the shoulder blade, not the arm",
      "Keep your neck relaxed throughout",
      "Progress by adding light resistance with a band",
    ],
  },

  // ====================================
  // HIP HEIGHT CORRECTION EXERCISES
  // ====================================
  {
    id: "hip-hike-correction",
    name: "Hip Hike Correction",
    description:
      "Targets the quadratus lumborum to correct functional leg length difference caused by hip hiking. Key exercise for pelvic alignment.",
    targetAreas: ["Quadratus Lumborum", "Obliques", "Hip Abductors"],
    targetAsymmetries: ["hip_height", "waist_asymmetry"],
    difficulty: "beginner",
    duration: "3-4 minutes",
    repetitions: "12 reps, 3 sets",
    frequency: "Daily",
    instructions: [
      "Stand on a step or thick book with your higher hip side leg on the step",
      "Let the other leg hang freely off the edge",
      "Keeping both legs straight, slowly lower your hanging hip toward the floor",
      "You should feel a stretch on the higher hip side of your low back",
      "Hold the lowered position for 3 seconds",
      "Then use your side muscles to pull the hanging hip back up",
      "This strengthens the opposite side while stretching the tight side",
    ],
    tips: [
      "Hold onto something stable for balance",
      "The movement should come from the pelvis, not bending the spine",
      "Think of lengthening your waist on the tight side",
    ],
  },
  {
    id: "side-lying-hip-stretch",
    name: "Side-Lying Hip Stretch",
    description:
      "Stretches the tight quadratus lumborum and lateral hip structures on the elevated hip side to restore pelvic symmetry.",
    targetAreas: ["Quadratus Lumborum", "Tensor Fasciae Latae", "IT Band"],
    targetAsymmetries: ["hip_height", "waist_asymmetry"],
    difficulty: "beginner",
    duration: "3-4 minutes",
    repetitions: "Hold 45-60 seconds, 3 times",
    frequency: "2x daily",
    instructions: [
      "Lie on your side with the higher hip facing up",
      "Bend your bottom leg for stability",
      "Straighten your top leg and let it hang off the back edge of the bed/couch",
      "Let gravity pull the leg down and back",
      "Reach your top arm overhead to increase the stretch on the side",
      "You should feel a stretch from your hip to your ribs",
      "Hold for 45-60 seconds, breathing into the stretch",
    ],
    tips: [
      "Use gravity - don't force the position",
      "A pillow under your bottom ribs can intensify the stretch",
      "Perform this stretch after sitting for long periods",
    ],
  },
  {
    id: "single-leg-glute-bridge",
    name: "Single Leg Glute Bridge",
    description:
      "Strengthens the hip abductors and gluteals on the lower hip side to help lift and stabilize the pelvis.",
    targetAreas: ["Gluteus Medius", "Gluteus Maximus", "Core"],
    targetAsymmetries: ["hip_height", "hip_rotation"],
    difficulty: "intermediate",
    duration: "4-5 minutes",
    repetitions: "12 reps, 3 sets",
    frequency: "3-4x per week",
    instructions: [
      "Lie on your back with knees bent, feet flat on the floor",
      "Extend the leg on your higher hip side straight up toward the ceiling",
      "Keep your pelvis level - don't let the unsupported side drop",
      "Press through your planted foot to lift your hips off the ground",
      "Squeeze your glute at the top and hold for 3 seconds",
      "Lower slowly with control",
      "Perform all reps on the lower hip side to strengthen it",
    ],
    tips: [
      "Place your hands on your hip bones to feel if you're staying level",
      "The challenge is keeping the pelvis from rotating",
      "Progress by placing the planted foot on an unstable surface",
    ],
  },

  // ====================================
  // TRUNK SHIFT CORRECTION EXERCISES
  // ====================================
  {
    id: "lateral-trunk-shift-correction",
    name: "Lateral Trunk Shift Correction",
    description:
      "Self-correction exercise to shift the trunk back toward midline. A foundational Schroth-based movement for lateral deviations.",
    targetAreas: ["Obliques", "Quadratus Lumborum", "Paraspinals"],
    targetAsymmetries: ["trunk_shift", "waist_asymmetry"],
    difficulty: "intermediate",
    duration: "3-4 minutes",
    repetitions: "10-15 holds of 10 seconds",
    frequency: "Multiple times daily",
    instructions: [
      "Stand in front of a mirror to monitor your alignment",
      "Identify which direction your trunk shifts (the opposite of center)",
      "Place your hand on your hip on the side trunk shifts toward",
      "Gently press your hip in while shifting your ribcage opposite",
      "Imagine bringing your ribs directly over your pelvis",
      "Keep your shoulders level - don't lean, translate",
      "Hold the corrected position for 10 seconds, breathing normally",
    ],
    tips: [
      "This is translation, not side-bending - think of sliding, not tilting",
      "Use a mirror to verify you're achieving midline alignment",
      "Practice this correction throughout the day during daily activities",
    ],
  },
  {
    id: "side-plank-lift",
    name: "Modified Side Plank Lift",
    description:
      "Strengthens the lateral core on the concave side (where trunk shifts away from) to help pull the spine toward midline.",
    targetAreas: ["Obliques", "Quadratus Lumborum", "Gluteus Medius"],
    targetAsymmetries: ["trunk_shift", "waist_asymmetry", "general_posture"],
    difficulty: "intermediate",
    duration: "4-5 minutes",
    repetitions: "8-12 reps, 3 sets each side",
    frequency: "3-4x per week",
    instructions: [
      "Lie on the side OPPOSITE to where your trunk shifts",
      "Prop yourself up on your forearm with elbow under shoulder",
      "Keep your knees bent at 90 degrees (modified position)",
      "Lift your hips off the ground, creating a straight line from knees to shoulders",
      "At the top, actively lift your ribcage away from the floor",
      "Hold for 5 seconds, focusing on the side muscles",
      "Lower with control and repeat",
    ],
    tips: [
      "Only perform on the side opposite to your trunk shift",
      "Progress to straight legs as you get stronger",
      "Focus on the feeling of lifting your waist toward the ceiling",
    ],
  },
  {
    id: "seated-lateral-flexion",
    name: "Seated Lateral Flexion Stretch",
    description:
      "Stretches the convex side (where trunk shifts toward) to reduce muscle tightness pulling the trunk off-center.",
    targetAreas: ["Obliques", "Latissimus Dorsi", "Quadratus Lumborum"],
    targetAsymmetries: ["trunk_shift", "waist_asymmetry"],
    difficulty: "beginner",
    duration: "2-3 minutes",
    repetitions: "Hold 30-45 seconds, 4 times",
    frequency: "2-3x daily",
    instructions: [
      "Sit on a chair with feet flat on the floor",
      "Place the hand on the side your trunk shifts toward on the chair seat",
      "Reach your opposite arm up and over your head",
      "Side-bend away from the shift direction, reaching long through your fingertips",
      "Press down through your anchoring hand to deepen the stretch",
      "You should feel a stretch from your hip to your armpit on the shift side",
      "Hold and breathe into the tight areas for 30-45 seconds",
    ],
    tips: [
      "Keep your hips grounded - the stretch should be in the trunk",
      "Think of creating space between your ribs on the tight side",
      "Combine with deep breathing for better tissue release",
    ],
  },

  // ====================================
  // ROTATION CORRECTION EXERCISES
  // ====================================
  {
    id: "rotational-breathing",
    name: "Schroth Rotational Breathing",
    description:
      "The signature Schroth technique using targeted breathing to de-rotate the spine and ribcage. Essential for any rotational component.",
    targetAreas: ["Intercostals", "Diaphragm", "Paraspinals", "Ribs"],
    targetAsymmetries: [
      "shoulder_rotation",
      "hip_rotation",
      "scapula_prominence",
    ],
    difficulty: "intermediate",
    duration: "5-10 minutes",
    repetitions: "10-15 breath cycles",
    frequency: "Daily, multiple sessions ideal",
    instructions: [
      "Lie on your back with knees bent, or sit in a supported position",
      "Identify your convex side (the side that rotates backward/is more prominent)",
      "Place your hand on the ribs on the convex side (usually the back ribs)",
      "As you inhale, direct your breath into that hand - imagine filling a balloon there",
      "Feel your ribs expand outward and backward against your hand",
      "The goal is to expand the collapsed areas of the ribcage",
      "Exhale slowly, maintaining the expansion as long as possible",
      "Repeat for 10-15 breath cycles",
    ],
    tips: [
      "This takes practice - it may take weeks to feel effective",
      "Work with a mirror or partner to verify you're expanding the right areas",
      "Combine with positional exercises for best results",
    ],
  },
  {
    id: "prone-trunk-rotation-stretch",
    name: "Prone Trunk Rotation Stretch",
    description:
      "Stretches the rotated trunk structures to help restore symmetrical alignment. Targets the tight rotator muscles.",
    targetAreas: ["Obliques", "Paraspinals", "Chest", "Shoulders"],
    targetAsymmetries: ["shoulder_rotation", "hip_rotation"],
    difficulty: "beginner",
    duration: "3-4 minutes",
    repetitions: "Hold 30-45 seconds, 3-4 times",
    frequency: "Daily",
    instructions: [
      "Lie face down with arms extended out to the sides (T position)",
      "Identify which way your trunk rotates (which shoulder is forward)",
      "Bend the knee on the forward shoulder side",
      "Slowly roll that knee across your body toward the opposite side",
      "Let your hip rotate but keep both shoulders on the ground",
      "You should feel a stretch through your chest and trunk on the forward side",
      "Hold for 30-45 seconds, breathing deeply",
    ],
    tips: [
      "Keep the opposite shoulder pinned to the floor",
      "The stretch should feel gradual - don't force the rotation",
      "Place a pillow under the rotating knee for a gentler stretch",
    ],
  },
  {
    id: "thoracic-rotation-mobilization",
    name: "Thoracic Rotation Mobilization",
    description:
      "Active mobility exercise to improve thoracic rotation symmetry and reduce rotational restriction in the mid-back.",
    targetAreas: ["Thoracic Spine", "Ribs", "Obliques"],
    targetAsymmetries: ["shoulder_rotation", "scapula_prominence"],
    difficulty: "beginner",
    duration: "3-4 minutes",
    repetitions: "10 reps each direction, 2 sets",
    frequency: "Daily",
    instructions: [
      "Start on hands and knees with hands under shoulders, knees under hips",
      "Place one hand behind your head with elbow pointing out",
      "Rotate your upper back, bringing that elbow toward the ceiling",
      "Follow your elbow with your eyes",
      "Pause at the top of the rotation for 2 seconds",
      "Return to start and repeat",
      "Perform extra repetitions rotating TOWARD the side that is restricted",
    ],
    tips: [
      "Keep your lower back stable - movement should come from mid-back only",
      "Don't rush - focus on feeling each vertebra rotate",
      "Exhale as you rotate up, inhale as you return",
    ],
  },

  // ====================================
  // SCAPULA PROMINENCE EXERCISES
  // ====================================
  {
    id: "scapular-wall-slides",
    name: "Scapular Wall Slides",
    description:
      "Strengthens the serratus anterior and lower trapezius to improve scapular positioning and reduce prominence (winging).",
    targetAreas: ["Serratus Anterior", "Lower Trapezius", "Rhomboids"],
    targetAsymmetries: ["scapula_prominence", "shoulder_rotation"],
    difficulty: "beginner",
    duration: "3-4 minutes",
    repetitions: "12-15 reps, 3 sets",
    frequency: "Daily",
    instructions: [
      "Stand with your back against a wall, feet 6 inches away",
      "Press your entire spine and head against the wall",
      "Bring arms up with elbows bent at 90 degrees (goalpost position)",
      "Press your forearms and backs of hands against the wall",
      "Slowly slide your arms up the wall, keeping everything in contact",
      "Only go as high as you can while maintaining wall contact",
      "Focus on pressing the prominent scapula flat against the wall throughout",
    ],
    tips: [
      "If you can't keep full contact, reduce the range of motion",
      "Think of wrapping your scapulas around your ribcage",
      "Add extra sets focusing on the more prominent scapula side",
    ],
  },
  {
    id: "serratus-punch",
    name: "Serratus Punch",
    description:
      "Isolated serratus anterior strengthening to pull the prominent scapula flat against the ribcage. Critical for scapular winging.",
    targetAreas: ["Serratus Anterior"],
    targetAsymmetries: ["scapula_prominence"],
    difficulty: "beginner",
    duration: "3-4 minutes",
    repetitions: "15-20 reps, 3 sets",
    frequency: "Daily",
    instructions: [
      "Lie on your back with knees bent",
      "Hold a light weight or water bottle in the hand on the prominent scapula side",
      "Extend your arm straight up toward the ceiling",
      "Without bending your elbow, punch the weight straight up toward the ceiling",
      "Feel your shoulder blade wrap around your ribcage",
      "Hold the protracted position for 2 seconds",
      "Lower your shoulder blade back down with control",
      "Perform all reps on the prominent scapula side",
    ],
    tips: [
      "The arm stays straight - all movement comes from the shoulder blade",
      "Start with no weight until you feel the correct muscles working",
      "This exercise is about quality, not weight - keep it light",
    ],
  },
  {
    id: "prone-y-raise",
    name: "Prone Y Raise",
    description:
      "Strengthens the lower trapezius to improve scapular depression and retraction, helping reduce scapular prominence.",
    targetAreas: ["Lower Trapezius", "Middle Trapezius", "Rhomboids"],
    targetAsymmetries: ["scapula_prominence", "shoulder_height"],
    difficulty: "intermediate",
    duration: "3-4 minutes",
    repetitions: "10-12 reps, 3 sets",
    frequency: "3-4x per week",
    instructions: [
      "Lie face down on a bench or mat with arms hanging down",
      "Turn thumbs to point up toward the ceiling",
      "Lift your arms up and out at 45-degree angles (forming a Y shape)",
      "Focus on initiating the movement by squeezing shoulder blades down and together",
      "Lift only to shoulder height - no higher",
      "Hold the top position for 3 seconds",
      "Lower with control and repeat",
    ],
    tips: [
      "Lead with your shoulder blades, not your arms",
      "Keep your neck relaxed and forehead down",
      "Perform extra reps on the prominent scapula side if asymmetry is significant",
    ],
  },

  // ====================================
  // GENERAL POSTURAL EXERCISES
  // ====================================
  {
    id: "chin-tucks",
    name: "Chin Tucks",
    description:
      "Foundational postural exercise to correct forward head posture, which often accompanies spinal asymmetries.",
    targetAreas: ["Deep Neck Flexors", "Upper Cervical Spine"],
    targetAsymmetries: ["general_posture"],
    difficulty: "beginner",
    duration: "2-3 minutes",
    repetitions: "10-15 reps, hold 5 seconds each",
    frequency: "Multiple times daily",
    instructions: [
      "Sit or stand with good posture, looking straight ahead",
      "Without tilting your head up or down, glide your chin straight back",
      "Imagine making a double chin or a string pulling your head back",
      "Keep your eyes and nose level throughout",
      "Hold the retracted position for 5 seconds",
      "Release and repeat",
    ],
    tips: [
      "This is a horizontal movement, not looking up or down",
      "You should feel a stretch at the base of your skull",
      "Perform every hour when working at a computer",
    ],
  },
  {
    id: "wall-angels",
    name: "Wall Angels",
    description:
      "Full upper body postural exercise that improves thoracic mobility, scapular control, and shoulder positioning simultaneously.",
    targetAreas: [
      "Thoracic Spine",
      "Scapular Stabilizers",
      "Rotator Cuff",
      "Chest",
    ],
    targetAsymmetries: [
      "shoulder_rotation",
      "scapula_prominence",
      "general_posture",
    ],
    difficulty: "beginner",
    duration: "3-4 minutes",
    repetitions: "10-15 reps, 2 sets",
    frequency: "Daily",
    instructions: [
      "Stand with your back against a wall, feet 6 inches away",
      "Press your low back, upper back, and head against the wall",
      "Bring arms up with elbows bent at 90 degrees, backs of hands on wall",
      "Slowly slide arms up the wall while keeping everything in contact",
      "Go as high as you can while maintaining full contact",
      "Slowly slide arms back down to starting position",
      "Focus on keeping both sides equally pressed against the wall",
    ],
    tips: [
      "If you can't maintain contact, don't go as high",
      "Pay attention to which side tends to lose contact first",
      "This is a great warm-up before other postural exercises",
    ],
  },
  {
    id: "cat-cow-stretch",
    name: "Cat-Cow Stretch",
    description:
      "Gentle spinal mobility exercise that helps maintain flexibility and teaches segmental spinal movement awareness.",
    targetAreas: ["Entire Spine", "Core", "Paraspinals"],
    targetAsymmetries: ["general_posture"],
    difficulty: "beginner",
    duration: "2-3 minutes",
    repetitions: "10-15 cycles",
    frequency: "Daily",
    instructions: [
      "Start on hands and knees, hands under shoulders, knees under hips",
      "Cow: Inhale, drop your belly, lift your chest and tailbone, look up",
      "Cat: Exhale, round your spine up toward the ceiling, tuck chin to chest",
      "Move slowly through each position, feeling each vertebra",
      "Focus on creating even movement through your entire spine",
      "Pay attention to any areas that feel stuck or don't move as well",
    ],
    tips: [
      "Move with your breath - don't rush",
      "Notice if one side of your spine moves differently than the other",
      "This is about mobility, not strength - keep movements smooth and controlled",
    ],
  },
  {
    id: "dead-bug",
    name: "Dead Bug",
    description:
      "Core stability exercise that teaches you to maintain spinal position while moving your limbs. Foundational for all postural work.",
    targetAreas: ["Deep Core", "Transverse Abdominis", "Hip Flexors"],
    targetAsymmetries: ["trunk_shift", "hip_rotation", "general_posture"],
    difficulty: "beginner",
    duration: "4-5 minutes",
    repetitions: "10 reps each side, 2-3 sets",
    frequency: "Daily",
    instructions: [
      "Lie on your back with arms pointing to ceiling and knees bent at 90 degrees",
      "Press your low back firmly into the floor - this is your anchor",
      "Slowly extend one arm overhead and the opposite leg out straight",
      "Keep your low back pressed into the floor throughout",
      "Return to start and repeat with opposite arm and leg",
      "If your back arches, you've gone too far - reduce range of motion",
    ],
    tips: [
      "Quality over quantity - stop if you can't keep your back flat",
      "Move slowly with control - this isn't a speed exercise",
      "Exhale as you extend, inhale as you return",
    ],
  },
  {
    id: "bird-dog",
    name: "Bird Dog",
    description:
      "Anti-rotation core exercise that builds stability while challenging you to maintain spinal alignment during movement.",
    targetAreas: [
      "Core",
      "Gluteals",
      "Back Extensors",
      "Scapular Stabilizers",
    ],
    targetAsymmetries: [
      "trunk_shift",
      "hip_rotation",
      "shoulder_rotation",
      "general_posture",
    ],
    difficulty: "beginner",
    duration: "4-5 minutes",
    repetitions: "10 reps each side, 2-3 sets",
    frequency: "Daily",
    instructions: [
      "Start on hands and knees with spine in neutral position",
      "Engage your core by gently drawing belly button toward spine",
      "Slowly extend one arm forward and the opposite leg back",
      "Keep your hips and shoulders level - don't rotate",
      "Hold the extended position for 3-5 seconds",
      "Return to start with control and repeat on other side",
    ],
    tips: [
      "Place a foam roller or water bottle on your low back - don't let it fall",
      "Look down to keep your neck in neutral alignment",
      "Focus on length - reach long through fingertips and heel",
    ],
  },
  {
    id: "pelvic-tilts",
    name: "Pelvic Tilts",
    description:
      "Foundational exercise to develop awareness of pelvic position and control, essential for addressing hip-related asymmetries.",
    targetAreas: ["Lower Abdominals", "Lower Back", "Hip Flexors"],
    targetAsymmetries: ["hip_height", "hip_rotation", "general_posture"],
    difficulty: "beginner",
    duration: "2-3 minutes",
    repetitions: "15-20 reps, 2 sets",
    frequency: "Daily",
    instructions: [
      "Lie on your back with knees bent, feet flat on the floor",
      "Find your neutral spine - slight natural curve in low back",
      "Posterior tilt: Flatten your low back into the floor by tilting pelvis back",
      "Anterior tilt: Arch your low back by tilting pelvis forward",
      "Move slowly between these two positions",
      "Notice if one direction feels tighter or harder than the other",
    ],
    tips: [
      "This builds awareness - notice your habitual pelvic position",
      "The movement should be in your pelvis, not your legs",
      "Breathe normally throughout the movement",
    ],
  },
];

/**
 * Get exercises for a specific asymmetry profile
 * Returns prioritized exercises based on the person's specific findings
 */
export function getRecommendedExercises(profile: AsymmetryProfile): Exercise[] {
  const prioritizedExercises: {
    exercise: Exercise;
    priority: number;
    reasons: string[];
  }[] = [];

  for (const exercise of EXERCISES) {
    let priority = 0;
    const reasons: string[] = [];

    // Check each asymmetry type this exercise targets
    for (const targetType of exercise.targetAsymmetries) {
      switch (targetType) {
        case "shoulder_height":
          if (profile.shoulderHeightDiff >= THRESHOLDS.shoulderHeight.mild) {
            priority +=
              profile.shoulderHeightDiff >= THRESHOLDS.shoulderHeight.significant
                ? 30
                : profile.shoulderHeightDiff >= THRESHOLDS.shoulderHeight.moderate
                  ? 20
                  : 10;
            reasons.push("Addresses shoulder height difference");
          }
          break;

        case "hip_height":
          if (profile.hipHeightDiff >= THRESHOLDS.hipHeight.mild) {
            priority +=
              profile.hipHeightDiff >= THRESHOLDS.hipHeight.significant
                ? 30
                : profile.hipHeightDiff >= THRESHOLDS.hipHeight.moderate
                  ? 20
                  : 10;
            reasons.push("Addresses hip height difference");
          }
          break;

        case "trunk_shift":
          if (profile.trunkShift >= THRESHOLDS.trunkShift.mild) {
            priority +=
              profile.trunkShift >= THRESHOLDS.trunkShift.significant
                ? 30
                : profile.trunkShift >= THRESHOLDS.trunkShift.moderate
                  ? 20
                  : 10;
            reasons.push("Addresses trunk shift");
          }
          break;

        case "shoulder_rotation":
          if (profile.shoulderRotation >= THRESHOLDS.rotation.mild) {
            priority +=
              profile.shoulderRotation >= THRESHOLDS.rotation.significant
                ? 25
                : profile.shoulderRotation >= THRESHOLDS.rotation.moderate
                  ? 15
                  : 8;
            reasons.push("Addresses shoulder rotation");
          }
          break;

        case "hip_rotation":
          if (profile.hipRotation >= THRESHOLDS.rotation.mild) {
            priority +=
              profile.hipRotation >= THRESHOLDS.rotation.significant
                ? 25
                : profile.hipRotation >= THRESHOLDS.rotation.moderate
                  ? 15
                  : 8;
            reasons.push("Addresses hip rotation");
          }
          break;

        case "scapula_prominence":
          if (profile.scapulaProminence >= THRESHOLDS.scapula.mild) {
            priority +=
              profile.scapulaProminence >= THRESHOLDS.scapula.significant
                ? 25
                : profile.scapulaProminence >= THRESHOLDS.scapula.moderate
                  ? 15
                  : 8;
            reasons.push("Addresses scapula prominence");
          }
          break;

        case "waist_asymmetry":
          if (profile.waistAsymmetry >= THRESHOLDS.waist.mild) {
            priority +=
              profile.waistAsymmetry >= THRESHOLDS.waist.significant
                ? 20
                : profile.waistAsymmetry >= THRESHOLDS.waist.moderate
                  ? 12
                  : 6;
            reasons.push("Addresses waist asymmetry");
          }
          break;

        case "general_posture":
          // Always add some priority for general posture exercises
          priority += 5;
          reasons.push("Improves overall posture");
          break;
      }
    }

    // Boost priority based on overall risk level
    if (priority > 0) {
      if (profile.riskLevel === "HIGH") {
        priority *= 1.5;
      } else if (profile.riskLevel === "MEDIUM") {
        priority *= 1.2;
      }

      // Favor beginner exercises for general recommendation
      if (exercise.difficulty === "beginner") {
        priority += 5;
      }

      prioritizedExercises.push({ exercise, priority, reasons });
    }
  }

  // Sort by priority and return top exercises
  prioritizedExercises.sort((a, b) => b.priority - a.priority);

  return prioritizedExercises.map((p) => p.exercise);
}

/**
 * Create an asymmetry profile from photo analysis metrics
 */
export function createAsymmetryProfile(
  metrics: {
    shoulder_height_diff_pct: number;
    hip_height_diff_pct: number;
    trunk_shift_pct: number;
    shoulder_rotation_score: number;
    hip_rotation_score: number;
    scapula_prominence_diff: number;
    waist_height_diff_pct: number;
    overall_asymmetry_score: number;
    higher_shoulder?: "left" | "right" | null;
    higher_hip?: "left" | "right" | null;
  },
  riskLevel: "LOW" | "MEDIUM" | "HIGH"
): AsymmetryProfile {
  return {
    shoulderHeightDiff: Math.abs(metrics.shoulder_height_diff_pct),
    hipHeightDiff: Math.abs(metrics.hip_height_diff_pct),
    trunkShift: Math.abs(metrics.trunk_shift_pct),
    shoulderRotation: metrics.shoulder_rotation_score,
    hipRotation: metrics.hip_rotation_score,
    scapulaProminence: Math.abs(metrics.scapula_prominence_diff),
    waistAsymmetry: Math.abs(metrics.waist_height_diff_pct),
    overallScore: metrics.overall_asymmetry_score,
    riskLevel,
    // Use explicit side from backend if available, otherwise fallback to sign-based detection
    // Note: For back photos, we use viewer's perspective (subject's left = viewer's right)
    higherShoulder: metrics.higher_shoulder ?? (metrics.shoulder_height_diff_pct > 0 ? "right" : "left"),
    higherHip: metrics.higher_hip ?? (metrics.hip_height_diff_pct > 0 ? "right" : "left"),
    trunkShiftDirection: metrics.trunk_shift_pct > 0 ? "right" : "left",
  };
}

/**
 * Parse duration string (e.g., "3-4 minutes") to get average minutes
 */
function parseDuration(duration: string): number {
  const match = duration.match(/(\d+)(?:-(\d+))?\s*min/i);
  if (match) {
    const min = parseInt(match[1]);
    const max = match[2] ? parseInt(match[2]) : min;
    return (min + max) / 2;
  }
  return 3; // default 3 minutes
}

/**
 * Get a daily routine based on the asymmetry profile
 * Returns a structured routine with warm-up, main exercises, and cool-down
 * @param profile - User's asymmetry profile
 * @param targetDuration - Target duration in minutes (from user preferences)
 */
export function getDailyRoutine(profile: AsymmetryProfile, targetDuration?: number): {
  warmup: Exercise[];
  main: Exercise[];
  cooldown: Exercise[];
  estimatedTime: number;
} {
  const recommended = getRecommendedExercises(profile);
  const usedIds = new Set<string>();

  // Helper to add exercise and track used IDs
  const addExercise = (exercise: Exercise) => {
    usedIds.add(exercise.id);
    return exercise;
  };

  // Helper to check if exercise is not yet used
  const isNotUsed = (e: Exercise) => !usedIds.has(e.id);

  // Warm-up: General mobility exercises (exclude stretches for cooldown)
  const warmupCandidates = recommended.filter(
    (e) =>
      e.targetAsymmetries.includes("general_posture") &&
      e.difficulty === "beginner" &&
      !e.name.toLowerCase().includes("stretch") &&
      !e.id.includes("stretch")
  );
  const warmup = warmupCandidates.slice(0, 2).map(addExercise);

  // Cool-down: Stretching exercises (reserve these, don't include in main)
  const cooldownCandidates = recommended.filter(
    (e) =>
      isNotUsed(e) &&
      (e.name.toLowerCase().includes("stretch") || e.id.includes("stretch"))
  );
  const cooldown = cooldownCandidates.slice(0, 2).map(addExercise);

  // Main: Targeted exercises for specific asymmetries (exclude already used)
  const mainCandidates = recommended.filter(
    (e) =>
      isNotUsed(e) &&
      (!e.targetAsymmetries.includes("general_posture") ||
        e.targetAsymmetries.length > 1)
  );

  // Calculate how many main exercises we can fit
  const warmupTime = warmup.reduce((t, e) => t + parseDuration(e.duration), 0);
  const cooldownTime = cooldown.reduce((t, e) => t + parseDuration(e.duration), 0);
  const availableForMain = targetDuration
    ? Math.max(0, targetDuration - warmupTime - cooldownTime)
    : 20; // default ~20 min for main if no target

  // Add main exercises until we reach target duration
  const main: Exercise[] = [];
  let mainTime = 0;

  for (const exercise of mainCandidates) {
    const exerciseTime = parseDuration(exercise.duration);
    if (targetDuration && mainTime + exerciseTime > availableForMain && main.length >= 3) {
      break; // Stop if we'd exceed target (but ensure at least 3 exercises)
    }
    main.push(addExercise(exercise));
    mainTime += exerciseTime;

    // Cap at reasonable number if no target duration
    if (!targetDuration && main.length >= 5) break;
  }

  // Fill warmup if needed with beginner exercises not yet used
  while (warmup.length < 2) {
    const next = recommended.find(
      (e) => isNotUsed(e) && e.difficulty === "beginner"
    );
    if (next) {
      warmup.push(addExercise(next));
    } else {
      break;
    }
  }

  // Calculate actual total time
  const estimatedTime = Math.round(
    warmup.reduce((t, e) => t + parseDuration(e.duration), 0) +
    main.reduce((t, e) => t + parseDuration(e.duration), 0) +
    cooldown.reduce((t, e) => t + parseDuration(e.duration), 0)
  );

  return { warmup, main, cooldown, estimatedTime };
}
