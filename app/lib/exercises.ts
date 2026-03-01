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

export interface TipWithExplanation {
  tip: string;
  explanation: string; // Scientific reasoning behind this tip
}

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
  tips: TipWithExplanation[];
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
    videoUrl: "https://www.youtube.com/watch?v=ja_P3YhmAlE",
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
      {
        tip: "Focus on the higher shoulder - don't work both sides equally",
        explanation: "Asymmetrical training is essential for postural correction. Research by Morningstar et al. (2005) shows that unilateral exercises targeting the imbalanced side produce better outcomes than bilateral exercises, as they directly address the muscle length-tension imbalances causing the asymmetry."
      },
      {
        tip: "The goal is to fatigue and release the overactive upper trap",
        explanation: "The upper trapezius often becomes hypertonic (overactive) in elevated shoulder postures. Post-isometric relaxation (PIR), where you contract then release a muscle, triggers autogenic inhibition via Golgi tendon organs, reducing muscle tone and allowing the shoulder to drop (Chaitow & DeLany, 2011)."
      },
      {
        tip: "Breathe normally throughout the exercise",
        explanation: "Holding your breath activates the sympathetic nervous system and increases muscle tension. Normal breathing maintains parasympathetic tone, which promotes muscle relaxation and better tissue response to stretching (Lehrer et al., 2010)."
      },
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
    videoUrl: "https://www.youtube.com/watch?v=cu1d-DH4s2U",
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
      {
        tip: "Never force the stretch - gentle sustained pressure is more effective",
        explanation: "Aggressive stretching triggers the muscle spindle stretch reflex, causing protective muscle contraction. Gentle sustained stretching (30+ seconds) allows the Golgi tendon organs to override this reflex, producing true muscle lengthening (Page et al., 2010). Studies show low-load prolonged stretching is superior for lasting flexibility gains."
      },
      {
        tip: "The anchoring hand on the chair seat is crucial for targeting the stretch",
        explanation: "Stabilizing the shoulder girdle prevents compensation and ensures the stretch targets the upper trapezius and levator scapulae specifically. Without anchoring, the entire shoulder complex can elevate, negating the stretch effect on the tight muscles (Neumann, 2017)."
      },
      {
        tip: "Perform this after the shoulder shrug exercise for better results",
        explanation: "Post-isometric relaxation (PIR) principle: contracting a muscle before stretching it reduces neural drive and increases stretch tolerance. The preceding shrug exercise pre-fatigues the upper trap, making it more receptive to subsequent stretching (Chaitow, 2006)."
      },
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
    videoUrl: "https://www.youtube.com/watch?v=maKLqBSn_Vo",
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
      {
        tip: "The movement should come from the shoulder blade, not the arm",
        explanation: "Scapulohumeral rhythm research shows the scapula must move independently of the arm for proper muscle activation. Focusing on scapular depression activates the lower trapezius (which depresses the scapula) rather than the arm muscles, directly addressing elevated shoulder posture (Kibler et al., 2013)."
      },
      {
        tip: "Keep your neck relaxed throughout",
        explanation: "Neck tension activates the levator scapulae and upper trapezius, which elevate the scapula - the opposite of what we want. Relaxing the neck ensures isolation of the lower trapezius for true scapular depression (Cools et al., 2007)."
      },
      {
        tip: "Progress by adding light resistance with a band",
        explanation: "Progressive overload is essential for strength gains. Once bodyweight becomes easy, adding resistance (starting light) continues to challenge the lower trapezius, promoting hypertrophy and increased force production capability (Kraemer & Ratamess, 2004)."
      },
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
    videoUrl: "https://www.youtube.com/watch?v=HW_Iv3GKFEU",
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
      {
        tip: "Hold onto something stable for balance",
        explanation: "Balance challenges recruit global stabilizer muscles which can interfere with isolating the quadratus lumborum. Holding support allows you to focus entirely on the hip drop movement without compensatory muscle activation (McGill, 2015)."
      },
      {
        tip: "The movement should come from the pelvis, not bending the spine",
        explanation: "Lateral pelvic tilt (hip hiking/dropping) specifically targets the quadratus lumborum and hip abductors. Spinal lateral flexion recruits different muscles and can reinforce the asymmetry rather than correct it. The pelvis should move as a unit while the spine stays neutral (Sahrmann, 2002)."
      },
      {
        tip: "Think of lengthening your waist on the tight side",
        explanation: "This cue promotes eccentric lengthening of the tight quadratus lumborum. Research shows that eccentric training is particularly effective for lengthening chronically shortened muscles while simultaneously building strength in the lengthened position (O'Sullivan et al., 2012)."
      },
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
    videoUrl: "https://www.youtube.com/watch?v=bNRn-zkSETo",
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
      {
        tip: "Use gravity - don't force the position",
        explanation: "Passive stretching using gravity allows for sustained low-load lengthening, which research shows is more effective for lasting flexibility changes than active forcing. This approach also reduces the risk of protective muscle guarding that occurs with aggressive stretching (Weppler & Magnusson, 2010)."
      },
      {
        tip: "A pillow under your bottom ribs can intensify the stretch",
        explanation: "Elevating the ribs creates additional lateral flexion, increasing the stretch on the quadratus lumborum and lateral hip structures. This follows the principle of positional release, where supporting tissues in a lengthened position enhances the stretch effect (Greenman, 2003)."
      },
      {
        tip: "Perform this stretch after sitting for long periods",
        explanation: "Prolonged sitting causes adaptive shortening of the hip flexors and quadratus lumborum. Stretching immediately after sitting counteracts this 'creep' phenomenon, where tissues adapt to sustained positions. Research shows post-sitting stretching prevents cumulative postural changes (McGill, 2015)."
      },
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
    videoUrl: "https://www.youtube.com/watch?v=AVAXhy6pl7o",
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
      {
        tip: "Place your hands on your hip bones to feel if you're staying level",
        explanation: "Proprioceptive feedback through hand placement enhances motor learning and body awareness. Research shows that tactile cues significantly improve movement quality and help the brain create accurate internal models of body position (Shumway-Cook & Woollacott, 2017)."
      },
      {
        tip: "The challenge is keeping the pelvis from rotating",
        explanation: "Anti-rotation is key for pelvic stability. When the pelvis rotates during single-leg exercises, it indicates weakness in the gluteus medius and deep hip rotators. Maintaining level hips trains these stabilizers essential for correcting hip height asymmetry (Reiman et al., 2012)."
      },
      {
        tip: "Progress by placing the planted foot on an unstable surface",
        explanation: "Unstable surfaces increase proprioceptive demand and force greater activation of stabilizer muscles. Studies show balance challenges significantly enhance gluteus medius recruitment, accelerating strength gains for pelvic stability (Boren et al., 2011)."
      },
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
    videoUrl: "https://www.youtube.com/watch?v=kBSUokzjXDY",
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
      {
        tip: "This is translation, not side-bending - think of sliding, not tilting",
        explanation: "The Schroth method distinguishes between translation (shifting the ribcage horizontally) and lateral flexion (bending). Translation corrects the actual trunk shift without creating compensatory curves elsewhere. This is a key principle in 3D scoliosis correction (Lehnert-Schroth, 2007)."
      },
      {
        tip: "Use a mirror to verify you're achieving midline alignment",
        explanation: "Visual feedback is crucial for motor relearning. Research shows that mirror-based feedback significantly improves postural correction accuracy because many patients have distorted body perception (proprioceptive errors) regarding their actual alignment (Weiss et al., 2006)."
      },
      {
        tip: "Practice this correction throughout the day during daily activities",
        explanation: "Motor learning research demonstrates that distributed practice (frequent short sessions) is superior to massed practice for skill acquisition. Integrating corrective postures into daily activities increases repetitions and promotes automaticity of the corrected position (Schmidt & Lee, 2011)."
      },
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
    videoUrl: "https://www.youtube.com/watch?v=ZZkgopVBPMg",
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
      {
        tip: "Only perform on the side opposite to your trunk shift",
        explanation: "Asymmetrical training is fundamental to scoliosis correction. The concave side (opposite to trunk shift) has weakened, lengthened muscles that need strengthening. Training bilaterally would strengthen the already dominant convex side, potentially worsening the asymmetry (Negrini et al., 2015)."
      },
      {
        tip: "Progress to straight legs as you get stronger",
        explanation: "Longer lever arms increase load on the lateral core muscles. Starting with bent knees reduces the moment arm, making the exercise accessible for beginners. Progression to straight legs follows the principle of progressive overload essential for continued strength gains (Ratamess et al., 2009)."
      },
      {
        tip: "Focus on the feeling of lifting your waist toward the ceiling",
        explanation: "Internal focus cues ('lift your waist') enhance proprioceptive awareness and muscle activation compared to external cues. This internal focus is particularly important for correcting scoliosis where patients often have poor awareness of their trunk position (Wulf, 2013)."
      },
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
    videoUrl: "https://www.youtube.com/watch?v=5BUbH62XiDc",
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
      {
        tip: "Keep your hips grounded - the stretch should be in the trunk",
        explanation: "Anchoring the pelvis isolates the stretch to the lateral trunk muscles (obliques, quadratus lumborum, latissimus dorsi). If the hips lift, the stretch dissipates across the hip and leg, reducing effectiveness for trunk asymmetry correction (Sahrmann, 2002)."
      },
      {
        tip: "Think of creating space between your ribs on the tight side",
        explanation: "This cue targets the intercostal muscles and promotes rib cage expansion on the concave side. In scoliosis, ribs on the concave side are compressed together. Creating 'space' helps restore normal rib spacing and improves thoracic mobility (Lehnert-Schroth, 2007)."
      },
      {
        tip: "Combine with deep breathing for better tissue release",
        explanation: "Deep breathing activates the parasympathetic nervous system, reducing muscle guarding. Additionally, diaphragmatic breathing creates internal pressure that assists with rib expansion and fascial release. Studies show breathing-enhanced stretching produces superior flexibility gains (Minvielle & Audiffren, 2019)."
      },
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
    videoUrl: "https://www.youtube.com/watch?v=YMdXXryKlko",
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
      {
        tip: "This takes practice - it may take weeks to feel effective",
        explanation: "Directional breathing is a complex motor skill requiring neuroplastic changes. Research on Schroth method shows patients typically need 4-6 weeks of consistent practice before they can reliably direct breath to specific zones. This is because it requires developing new neuromuscular pathways (Schreiber et al., 2015)."
      },
      {
        tip: "Work with a mirror or partner to verify you're expanding the right areas",
        explanation: "External feedback is critical for motor learning, especially for movements we can't see directly. Mirror or partner feedback provides knowledge of results (KR), which research shows accelerates skill acquisition by 40-60% compared to practice without feedback (Schmidt & Lee, 2011)."
      },
      {
        tip: "Combine with positional exercises for best results",
        explanation: "The Schroth method emphasizes combining rotational breathing with corrective positioning. Studies show the combination produces significantly better curve reduction than either technique alone, as positioning pre-tensions tissues while breathing mobilizes them (Weiss et al., 2016)."
      },
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
    videoUrl: "https://www.youtube.com/watch?v=dMe2wEY4Atg",
    instructions: [
      "Lie face down with arms extended out to the sides in a T position, palms down",
      "To stretch your RIGHT side: bend your RIGHT knee and bring it up toward your hip",
      "Slowly lift and cross your RIGHT leg over your body toward the LEFT side",
      "Let your right hip and lower back rotate, but keep your LEFT shoulder pressed firmly into the floor",
      "Your right knee should reach toward or touch the floor on your left side",
      "Feel the stretch through your right chest, obliques, and the front of your right hip",
      "Hold for 30-45 seconds while breathing slowly and deeply",
      "Return slowly, then repeat on the other side if needed for your curve pattern",
    ],
    tips: [
      {
        tip: "The shoulder opposite to your moving leg must stay glued to the floor",
        explanation: "This anchor point is what creates the rotational stretch through your trunk. If both shoulders lift, you're just rolling over rather than stretching. The fixed shoulder creates a pivot point that isolates the stretch to your thoracic spine and ribcage - exactly where rotation needs to be addressed in scoliosis (Stokes, 2002)."
      },
      {
        tip: "Move slowly and never force your knee to the floor",
        explanation: "Your spine rotates through small joints called facets that can be irritated by aggressive movement. The stretch should build gradually over 10-15 seconds as your muscles relax. If you feel pinching or sharp pain in your lower back, you've gone too far - back off and use a pillow under your knee."
      },
      {
        tip: "Use a pillow under your knee if the stretch is too intense",
        explanation: "Placing a pillow where your knee lands reduces how far you rotate, making the stretch gentler. This is especially helpful when starting out or if you have tight hip flexors. You can gradually use a thinner pillow or remove it as your mobility improves over weeks."
      },
      {
        tip: "Focus on the side that's tighter - you likely only need one side",
        explanation: "Unlike general stretches done equally on both sides, scoliosis correction is asymmetrical. Your curve rotates your trunk one direction, so you typically only need to stretch the tight/convex side. Stretching both sides equally would maintain the asymmetry rather than correct it."
      },
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
    videoUrl: "https://www.youtube.com/watch?v=BM0Reyg5gXM",
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
      {
        tip: "Keep your lower back stable - movement should come from mid-back only",
        explanation: "The thoracic spine is designed for rotation while the lumbar spine is not. Stabilizing the lower back ensures rotation occurs at the thoracic vertebrae, where improved mobility can help correct rotational components of scoliosis. Lumbar rotation can cause disc and facet joint problems (Neumann, 2017)."
      },
      {
        tip: "Don't rush - focus on feeling each vertebra rotate",
        explanation: "Slow, mindful movement enhances proprioceptive input and allows for segmental mobilization. Research shows that conscious attention to spinal segments improves motor control and helps identify specific areas of restriction that need additional focus (O'Sullivan, 2005)."
      },
      {
        tip: "Exhale as you rotate up, inhale as you return",
        explanation: "Exhaling during the effort phase (rotation) engages the deep core muscles and facilitates greater range of motion. The diaphragm and pelvic floor work synergistically with trunk rotation; coordinating breath optimizes this relationship (Hodges & Gandevia, 2000)."
      },
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
    videoUrl: "https://www.youtube.com/watch?v=gYgKwIuwr3A",
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
      {
        tip: "If you can't keep full contact, reduce the range of motion",
        explanation: "Maintaining wall contact ensures proper scapular mechanics. If contact is lost, compensatory movements occur (shoulder elevation, excessive lumbar lordosis). Reducing range maintains quality, and research shows partial range with proper form produces better outcomes than full range with compensation (Kibler et al., 2013)."
      },
      {
        tip: "Think of wrapping your scapulas around your ribcage",
        explanation: "This cue promotes scapular protraction and posterior tilt, which are controlled by the serratus anterior. In scapular winging, the serratus anterior is weak or inhibited. This mental image helps activate this muscle and improves scapular positioning against the ribcage (Ludewig & Reynolds, 2009)."
      },
      {
        tip: "Add extra sets focusing on the more prominent scapula side",
        explanation: "Asymmetrical scapular prominence requires asymmetrical training. EMG studies show that focusing attention on a specific side increases muscle activation on that side. Extra sets on the prominent side helps balance strength and control between sides (Cools et al., 2007)."
      },
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
    videoUrl: "https://www.youtube.com/watch?v=bvuy6vBfgkE",
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
      {
        tip: "The arm stays straight - all movement comes from the shoulder blade",
        explanation: "Keeping the elbow locked isolates the serratus anterior by eliminating triceps contribution. The serratus anterior's primary action is scapular protraction (punching movement). This isolation is essential for targeting the specific muscle weakness causing scapular winging (Decker et al., 1999)."
      },
      {
        tip: "Start with no weight until you feel the correct muscles working",
        explanation: "Neuromuscular re-education must precede strength training. If you can't feel the serratus anterior working, you're likely compensating with other muscles. Research shows that establishing the mind-muscle connection first leads to significantly better muscle activation during subsequent loaded exercises (Calatayud et al., 2016)."
      },
      {
        tip: "This exercise is about quality, not weight - keep it light",
        explanation: "The serratus anterior is a stabilizer muscle, not a prime mover. Heavy loads cause larger muscles (pecs, anterior deltoid) to dominate. Light weight with high repetitions (15-20) matches the serratus anterior's muscle fiber composition and functional role as an endurance stabilizer (Ludewig et al., 2004)."
      },
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
    videoUrl: "https://www.youtube.com/watch?v=f-a3F4sciOE",
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
      {
        tip: "Lead with your shoulder blades, not your arms",
        explanation: "The lower trapezius initiates scapular retraction and depression before arm elevation. Leading with the arms recruits upper trapezius and deltoids, missing the target muscle. This sequencing (scapula first, then arm) is called scapulohumeral rhythm and is essential for shoulder health (Kibler et al., 2013)."
      },
      {
        tip: "Keep your neck relaxed and forehead down",
        explanation: "Neck extension activates the upper trapezius, which can overpower the lower trapezius you're trying to target. Keeping the forehead down maintains cervical neutrality and ensures the lower trapezius does the work. EMG studies confirm significantly better lower trap activation with neutral neck position (Cools et al., 2007)."
      },
      {
        tip: "Perform extra reps on the prominent scapula side if asymmetry is significant",
        explanation: "Unilateral emphasis is necessary for asymmetrical conditions. The prominent scapula indicates weakness of the serratus anterior and lower trapezius on that side. Extra volume on the affected side accelerates strength balance between sides, following principles of corrective exercise (Clark & Lucett, 2011)."
      },
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
    videoUrl: "https://www.youtube.com/watch?v=wQylqaCl8Zo",
    instructions: [
      "Sit or stand with good posture, looking straight ahead",
      "Without tilting your head up or down, glide your chin straight back",
      "Imagine making a double chin or a string pulling your head back",
      "Keep your eyes and nose level throughout",
      "Hold the retracted position for 5 seconds",
      "Release and repeat",
    ],
    tips: [
      {
        tip: "This is a horizontal movement, not looking up or down",
        explanation: "Pure cervical retraction (chin tuck) strengthens the deep neck flexors while avoiding upper trapezius activation that occurs with neck flexion. Forward head posture causes deep neck flexor weakness and upper trapezius dominance; this precise movement addresses the root cause (Jull et al., 2008)."
      },
      {
        tip: "You should feel a stretch at the base of your skull",
        explanation: "The stretch at the occiput indicates lengthening of the suboccipital muscles, which become shortened with forward head posture. These small muscles have the highest density of proprioceptors in the body and significantly influence posture and balance when properly lengthened (McPartland et al., 1997)."
      },
      {
        tip: "Perform every hour when working at a computer",
        explanation: "Postural muscles fatigue after approximately 20-30 minutes of static positioning, leading to progressive forward head drift. Hourly chin tucks 'reset' posture before significant drift occurs and prevent cumulative strain. This frequency is supported by ergonomic research on sustained postures (Straker et al., 2008)."
      },
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
    videoUrl: "https://www.youtube.com/watch?v=M_ooIhKYs7c",
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
      {
        tip: "If you can't maintain contact, don't go as high",
        explanation: "Loss of wall contact indicates compensation - either thoracic kyphosis increasing, lumbar lordosis increasing, or scapular winging. Stopping at the point of contact loss ensures you're working within your current mobility limits while avoiding reinforcement of dysfunctional movement patterns (Sahrmann, 2002)."
      },
      {
        tip: "Pay attention to which side tends to lose contact first",
        explanation: "Asymmetrical loss of contact reveals the tighter or weaker side. In scoliosis, one side often has different restrictions than the other. Identifying your asymmetry helps you focus additional mobility work on that side, making your corrective exercise program more specific and effective (Lehnert-Schroth, 2007)."
      },
      {
        tip: "This is a great warm-up before other postural exercises",
        explanation: "Wall angels increase blood flow to the shoulder girdle, activate scapular stabilizers, and improve thoracic mobility - preparing the body for more challenging exercises. Research shows that movement preparation exercises improve subsequent exercise performance and reduce injury risk (Bishop, 2003)."
      },
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
    videoUrl: "https://www.youtube.com/watch?v=kqnua4rHVVA",
    instructions: [
      "Start on hands and knees, hands under shoulders, knees under hips",
      "Cow: Inhale, drop your belly, lift your chest and tailbone, look up",
      "Cat: Exhale, round your spine up toward the ceiling, tuck chin to chest",
      "Move slowly through each position, feeling each vertebra",
      "Focus on creating even movement through your entire spine",
      "Pay attention to any areas that feel stuck or don't move as well",
    ],
    tips: [
      {
        tip: "Move with your breath - don't rush",
        explanation: "Breathing coordinates with spinal movement: inhale during extension (cow), exhale during flexion (cat). This natural coordination activates the deep stabilizers and creates intra-abdominal pressure changes that assist spinal mobility. Rushed movements bypass these benefits and can cause strain (McGill, 2015)."
      },
      {
        tip: "Notice if one side of your spine moves differently than the other",
        explanation: "Asymmetrical spinal movement is common in scoliosis and reveals areas of restriction. Awareness of these differences is the first step in correction. Research on motor learning shows that conscious attention to movement asymmetries accelerates correction compared to unfocused practice (Wulf, 2013)."
      },
      {
        tip: "This is about mobility, not strength - keep movements smooth and controlled",
        explanation: "Cat-cow targets spinal segmental mobility and proprioception, not muscle strength. Quick or forceful movements bypass the slow-twitch stabilizers and can cause joint irritation. Smooth, controlled movements allow each vertebral segment to move sequentially, which is the goal of this exercise (Bogduk, 2012)."
      },
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
    videoUrl: "https://www.youtube.com/watch?v=I5xbsA71v1A",
    instructions: [
      "Lie on your back with arms pointing to ceiling and knees bent at 90 degrees",
      "Press your low back firmly into the floor - this is your anchor",
      "Slowly extend one arm overhead and the opposite leg out straight",
      "Keep your low back pressed into the floor throughout",
      "Return to start and repeat with opposite arm and leg",
      "If your back arches, you've gone too far - reduce range of motion",
    ],
    tips: [
      {
        tip: "Quality over quantity - stop if you can't keep your back flat",
        explanation: "The flat back indicates proper core stabilization. When the back arches, the deep stabilizers (transverse abdominis, multifidus) have failed and global muscles take over. Continuing with an arched back trains the wrong pattern and can cause low back strain. Quality movement builds the correct motor program (McGill, 2015)."
      },
      {
        tip: "Move slowly with control - this isn't a speed exercise",
        explanation: "Slow movement requires continuous muscle activation and challenges stability throughout the range. Fast movements use momentum, reducing muscle work and allowing compensation. Research shows that slow tempo exercises produce superior strength gains in stabilizer muscles compared to fast movements (Westcott et al., 2001)."
      },
      {
        tip: "Exhale as you extend, inhale as you return",
        explanation: "Exhaling during the effort phase (limb extension) activates the transverse abdominis and increases intra-abdominal pressure, enhancing spinal stability. This breathing pattern coordinates the diaphragm and core muscles, which work as a functional unit for spinal protection (Hodges & Gandevia, 2000)."
      },
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
    videoUrl: "https://www.youtube.com/watch?v=wiFNA3sqjCA",
    instructions: [
      "Start on hands and knees with spine in neutral position",
      "Engage your core by gently drawing belly button toward spine",
      "Slowly extend one arm forward and the opposite leg back",
      "Keep your hips and shoulders level - don't rotate",
      "Hold the extended position for 3-5 seconds",
      "Return to start with control and repeat on other side",
    ],
    tips: [
      {
        tip: "Place a foam roller or water bottle on your low back - don't let it fall",
        explanation: "External feedback objects provide immediate knowledge of results (KR) about trunk stability. If the object moves, the core isn't maintaining position. Research shows external feedback significantly accelerates motor learning compared to internal cues alone, especially for core stability exercises (Schmidt & Lee, 2011)."
      },
      {
        tip: "Look down to keep your neck in neutral alignment",
        explanation: "Looking up extends the cervical spine, which creates a chain reaction extending the thoracic and lumbar spine. Neutral neck position (looking down) keeps the entire spine in optimal alignment and ensures the exercise challenges trunk stability rather than spinal extension endurance (Sahrmann, 2002)."
      },
      {
        tip: "Focus on length - reach long through fingertips and heel",
        explanation: "Reaching creates axial elongation, which activates the deep stabilizers and reduces compressive load on the spine. This lengthening cue also prevents 'hiking' the hip or shoulder, a common compensation that would reduce the anti-rotation challenge of the exercise (Richardson et al., 2004)."
      },
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
    videoUrl: "https://www.youtube.com/watch?v=ZIQjHtghzqw",
    instructions: [
      "Lie on your back with knees bent, feet flat on the floor",
      "Find your neutral spine - slight natural curve in low back",
      "Posterior tilt: Flatten your low back into the floor by tilting pelvis back",
      "Anterior tilt: Arch your low back by tilting pelvis forward",
      "Move slowly between these two positions",
      "Notice if one direction feels tighter or harder than the other",
    ],
    tips: [
      {
        tip: "This builds awareness - notice your habitual pelvic position",
        explanation: "Many people are unaware of their pelvic position because proprioceptive feedback from this area is often poor. Research shows that postural awareness exercises significantly improve the ability to identify and correct pelvic malalignment. This body awareness is foundational for all subsequent postural corrections (O'Sullivan, 2005)."
      },
      {
        tip: "The movement should be in your pelvis, not your legs",
        explanation: "Isolating pelvic movement from leg movement trains the lumbopelvic dissociation necessary for proper movement. If the legs move instead of the pelvis, hip flexors and extensors are doing the work instead of the core muscles. This specificity ensures you develop control of the pelvis independent of the legs (Sahrmann, 2002)."
      },
      {
        tip: "Breathe normally throughout the movement",
        explanation: "Breath-holding (Valsalva maneuver) increases intra-abdominal pressure artificially and masks true core control. Normal breathing forces the deep stabilizers to maintain pelvic control without this artificial support, building real functional stability that transfers to daily activities (McGill, 2015)."
      },
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
