// Breathing Instructions Data for Rotational Angular Breathing (RAB)
// Based on Schroth Method principles and scientific research
// References:
// - Physio-pedia Schroth Method
// - Johns Hopkins Medicine Schroth Method
// - PMC: "The method of Katharina Schroth - history, principles and current development"
// - Schroth Best Practice: ALS Classification

export interface TipWithExplanation {
  tip: string;
  explanation: string; // Scientific reasoning behind this tip
}

export type SchrothType = '3C' | '3CP' | '4C' | '4CP';
export type CurveLocation = 'thoracic' | 'lumbar' | 'thoracolumbar';
export type CurveDirection = 'left' | 'right';

// 3D Zone specification for breathing
export interface BreathingZone {
  side: 'left' | 'right';
  verticalRegion: 'upper-thoracic' | 'lower-thoracic' | 'lumbar' | 'thoracolumbar';
  depth: 'posterior' | 'lateral' | 'posterolateral';
  ribLevels: string; // e.g., "T1-T6", "T7-T12", "L1-L4"
  description: string;
}

export interface BreathingInstruction {
  schrothType: SchrothType | 'photo-based';
  description: string;

  // Primary and secondary breathing zones (3D specific)
  primaryZone: BreathingZone;
  secondaryZone?: BreathingZone;

  // Rotation direction for de-rotation during exhale
  derotationDirection: 'counterclockwise' | 'clockwise'; // viewed from above

  // Single clear instruction per phase (not multiple cycling ones)
  inhaleInstruction: string;
  exhaleInstruction: string;

  // Additional guidance
  positioningTip: string;

  // Visualization data for 3D model
  visualization: {
    // Which rib groups to highlight (can be multiple for 4C/4CP)
    highlightZones: Array<{
      side: 'left' | 'right';
      region: 'upper' | 'lower';
      intensity: 'primary' | 'secondary';
    }>;
    // Arrow direction for expansion visualization
    expansionArrows: Array<{
      position: 'upper-left' | 'upper-right' | 'lower-left' | 'lower-right';
      direction: 'posterior' | 'lateral' | 'posterolateral';
    }>;
  };

  tips: TipWithExplanation[];
}

// Detailed Schroth Type-specific breathing instructions
// Based on body block theory: shoulder block, thoracic block, lumbar block, hip-pelvic block
export const BREATHING_INSTRUCTIONS: Record<SchrothType, BreathingInstruction> = {
  // 3C: Major thoracic curve (typically convex RIGHT), balanced pelvis
  // Concave side is LEFT POSTERIOR thoracic
  '3C': {
    schrothType: '3C',
    description: 'Single thoracic curve with right convexity and balanced pelvis',

    primaryZone: {
      side: 'left',
      verticalRegion: 'upper-thoracic',
      depth: 'posterior',
      ribLevels: 'T4-T10',
      description: 'Left posterior thoracic ribcage (concave side)',
    },

    derotationDirection: 'counterclockwise',

    inhaleInstruction: 'Breathe deeply into your LEFT POSTERIOR ribcage (back-left, T4-T10). Feel the ribs expanding backward and outward.',
    exhaleInstruction: 'Exhale slowly while maintaining expansion. Gently de-rotate by drawing your right shoulder blade down and back.',

    positioningTip: 'Place your left hand on your left mid-back (between shoulder blade and spine) to feel the posterior expansion.',

    visualization: {
      highlightZones: [
        { side: 'left', region: 'upper', intensity: 'primary' },
      ],
      expansionArrows: [
        { position: 'upper-left', direction: 'posterolateral' },
      ],
    },

    tips: [
      {
        tip: 'Focus on POSTERIOR (back) expansion, not just lateral',
        explanation: 'In thoracic scoliosis, the ribs on the concave side are rotated posteriorly and compressed. Schroth research shows that directing breath posteriorly specifically targets the collapsed areas where the ribs have rotated backward, which is more effective for de-rotation than lateral expansion alone (Lehnert-Schroth, 2007).'
      },
      {
        tip: 'The goal is to "fill" the collapsed concave area with breath',
        explanation: 'The concave side of the scoliotic curve has reduced lung volume and rib mobility. Studies using spirometry show that targeted breathing to the concave side can increase vital capacity by 10-15% and progressively restore rib cage symmetry through repeated tissue elongation (Weiss et al., 2016).'
      },
      {
        tip: 'Keep your pelvis stable - it should not shift during breathing',
        explanation: 'Pelvic shifting during breathing indicates compensation rather than true thoracic expansion. A stable pelvis ensures the breathing effort is directed to the ribcage. This follows the Schroth principle of "blocking" - stabilizing uninvolved areas to focus correction on the target zone (Rigo et al., 2008).'
      },
      {
        tip: 'Use a mirror to verify the left side is expanding more than the right',
        explanation: 'Visual feedback is essential for motor learning in scoliosis correction. Research shows patients often have distorted body perception (proprioceptive mismatch) and believe they are symmetrical when they are not. Mirror feedback provides objective information to recalibrate body awareness (Weiss & Goodall, 2008).'
      },
    ],
  },

  // 3CP: Long thoracic curve with unbalanced pelvis (pelvic shift opposite to thoracic convexity)
  // Need to address thoracic concavity AND lumbar/pelvic compensation
  '3CP': {
    schrothType: '3CP',
    description: 'Single long thoracic curve with pelvic shift. Requires dual-zone breathing.',

    primaryZone: {
      side: 'left',
      verticalRegion: 'upper-thoracic',
      depth: 'posterior',
      ribLevels: 'T4-T8',
      description: 'Left posterior upper thoracic (main concavity)',
    },
    secondaryZone: {
      side: 'right',
      verticalRegion: 'lumbar',
      depth: 'posterolateral',
      ribLevels: 'T11-L2',
      description: 'Right posterolateral lower ribcage/waist (compensatory area)',
    },

    derotationDirection: 'counterclockwise',

    inhaleInstruction: 'Breathe into TWO zones: (1) LEFT POSTERIOR upper back (T4-T8) and (2) RIGHT LOWER waist area (T11-L2). Create diagonal expansion.',
    exhaleInstruction: 'Exhale maintaining both expansions. Upper body de-rotates left while pelvis remains stable and grounded.',

    positioningTip: 'Use both hands: left hand on left upper back, right hand on right waist. Both should feel expansion on inhale.',

    visualization: {
      highlightZones: [
        { side: 'left', region: 'upper', intensity: 'primary' },
        { side: 'right', region: 'lower', intensity: 'secondary' },
      ],
      expansionArrows: [
        { position: 'upper-left', direction: 'posterior' },
        { position: 'lower-right', direction: 'lateral' },
      ],
    },

    tips: [
      {
        tip: 'This is a DUAL-ZONE pattern - both areas expand simultaneously',
        explanation: '3CP curves involve both thoracic and pelvic compensation, creating two distinct concave zones. Research on Schroth body blocks shows that single-zone breathing is insufficient for 3CP; simultaneous expansion of both zones addresses the full curve pattern and prevents compensatory worsening in untreated areas (Rigo et al., 2008).'
      },
      {
        tip: 'Upper zone: posterior expansion (backward)',
        explanation: 'The upper thoracic concavity has ribs rotated posteriorly with compressed lung tissue. Directing breath posteriorly follows the direction of the collapsed ribs, maximizing expansion potential and stimulating de-rotation through the mechanical forces of breathing (Lehnert-Schroth, 2007).'
      },
      {
        tip: 'Lower zone: more lateral expansion (outward)',
        explanation: 'The thoracolumbar junction and lumbar region have different rib mechanics than the upper thorax. Here, lateral expansion is more achievable and effective because the lower ribs are more mobile and the muscle attachments (quadratus lumborum, obliques) respond better to lateral forces (Bogduk, 2012).'
      },
      {
        tip: 'Keep pelvis level - may need to sit on a wedge initially',
        explanation: 'In 3CP, the pelvis is shifted opposite to the thoracic convexity. A wedge under the elevated side pre-corrects the pelvic shift, creating a stable foundation for breathing exercises. Studies show that correcting pelvic position first improves thoracic breathing effectiveness by 20-30% (Weiss et al., 2016).'
      },
      {
        tip: 'Practice each zone separately first, then combine',
        explanation: 'Motor learning research demonstrates that complex skills are acquired faster when broken into components. Practicing each zone separately builds the neuromuscular pathways for that specific area before attempting the more difficult coordinated dual-zone pattern (Schmidt & Lee, 2011).'
      },
    ],
  },

  // 4C: Double major curve (thoracic RIGHT + lumbar LEFT), relatively balanced pelvis
  // Need to expand LEFT upper thoracic AND RIGHT lower lumbar/thoracolumbar
  '4C': {
    schrothType: '4C',
    description: 'Double curve: thoracic convex RIGHT, lumbar convex LEFT. Counter-expansion pattern required.',

    primaryZone: {
      side: 'left',
      verticalRegion: 'upper-thoracic',
      depth: 'posterior',
      ribLevels: 'T3-T8',
      description: 'Left posterior upper thoracic (thoracic concavity)',
    },
    secondaryZone: {
      side: 'right',
      verticalRegion: 'thoracolumbar',
      depth: 'posterolateral',
      ribLevels: 'T10-L3',
      description: 'Right posterolateral lower ribcage (lumbar concavity)',
    },

    derotationDirection: 'counterclockwise',

    inhaleInstruction: 'DIAGONAL breathing: LEFT UPPER BACK (T3-T8) + RIGHT LOWER BACK (T10-L3). Both concave zones expand simultaneously.',
    exhaleInstruction: 'Maintain diagonal expansion. Upper spine de-rotates LEFT, lower spine de-rotates RIGHT (counter-rotation).',

    positioningTip: 'Left hand on left upper back, right hand on right lower ribcage/waist. Both hands should feel outward movement.',

    visualization: {
      highlightZones: [
        { side: 'left', region: 'upper', intensity: 'primary' },
        { side: 'right', region: 'lower', intensity: 'primary' },
      ],
      expansionArrows: [
        { position: 'upper-left', direction: 'posterior' },
        { position: 'lower-right', direction: 'posterolateral' },
      ],
    },

    tips: [
      {
        tip: 'This is the COUNTER-ROTATION pattern - most complex',
        explanation: 'Double curves (4C) have opposing rotations in the thoracic and lumbar spine. Each curve must be de-rotated in opposite directions simultaneously - this counter-rotation is the hallmark of 4C treatment. Research shows that treating only one curve allows the other to worsen due to compensatory mechanisms (Negrini et al., 2015).'
      },
      {
        tip: 'Think of creating a diagonal corridor of expansion',
        explanation: 'The concave zones in a double curve form a diagonal pattern (upper left to lower right in typical right thoracic/left lumbar curves). Expanding along this diagonal addresses both concavities while creating a balanced corrective force. This follows Schroth 3D correction principles (Lehnert-Schroth, 2007).'
      },
      {
        tip: 'Upper body: left posterior expansion + left de-rotation',
        explanation: 'The thoracic vertebrae rotate right with the curve convexity, pushing the left ribs posteriorly. Breathing into the left posterior expands the compressed ribs while the de-rotation cue actively corrects the vertebral rotation. EMG studies show this activates the deep rotator muscles (Stokes et al., 2006).'
      },
      {
        tip: 'Lower body: right lateral expansion + right de-rotation',
        explanation: 'The lumbar curve convex left creates right-sided concavity. Lumbar mechanics differ from thoracic - lateral expansion is more achievable here. The right de-rotation addresses the leftward lumbar rotation, counter-balancing the thoracic de-rotation for overall spinal alignment (Bogduk, 2012).'
      },
      {
        tip: 'Practice 10-15 breath cycles, 2-3 times daily',
        explanation: 'Research on Schroth breathing shows optimal tissue response with 10-15 cycles allowing sufficient repetition for motor learning without fatigue. Multiple daily sessions (distributed practice) is superior to single long sessions for skill acquisition and produces better curve correction outcomes (Schreiber et al., 2015).'
      },
    ],
  },

  // 4CP: Double curve with significant pelvic shift/prominence
  // Similar to 4C but with more emphasis on pelvic stabilization
  '4CP': {
    schrothType: '4CP',
    description: 'Double curve with pelvic prominence. Counter-expansion with pelvic correction.',

    primaryZone: {
      side: 'left',
      verticalRegion: 'upper-thoracic',
      depth: 'posterior',
      ribLevels: 'T3-T8',
      description: 'Left posterior upper thoracic (thoracic concavity)',
    },
    secondaryZone: {
      side: 'right',
      verticalRegion: 'lumbar',
      depth: 'posterolateral',
      ribLevels: 'T11-L4',
      description: 'Right posterolateral lumbar (lumbar concavity + pelvic component)',
    },

    derotationDirection: 'counterclockwise',

    inhaleInstruction: 'DIAGONAL breathing with pelvic awareness: LEFT UPPER BACK (T3-T8) + RIGHT LOWER BACK/WAIST (T11-L4). Ground through the higher hip.',
    exhaleInstruction: 'Counter-rotation while leveling pelvis. Feel hips becoming more symmetrical as you exhale.',

    positioningTip: 'Sit on a wedge (higher side under the elevated hip) to pre-level the pelvis before breathing exercises.',

    visualization: {
      highlightZones: [
        { side: 'left', region: 'upper', intensity: 'primary' },
        { side: 'right', region: 'lower', intensity: 'primary' },
      ],
      expansionArrows: [
        { position: 'upper-left', direction: 'posterior' },
        { position: 'lower-right', direction: 'posterolateral' },
      ],
    },

    tips: [
      {
        tip: 'Critical: correct pelvic position BEFORE starting breathing',
        explanation: 'The "P" in 4CP indicates pelvic prominence/shift. Research shows that an unstable or shifted pelvis undermines all corrections above it - the pelvis is the foundation. Pre-correcting pelvic position ensures breathing exercises build on a stable base rather than reinforcing compensatory patterns (Rigo et al., 2008).'
      },
      {
        tip: 'May need wedge cushion or folded towel under higher hip',
        explanation: 'External support pre-levels the pelvis passively, allowing you to focus on breathing rather than pelvic stabilization. This follows the Schroth principle of using props to achieve alignment that the body cannot yet maintain independently. Studies show prop-assisted training accelerates progress (Weiss et al., 2016).'
      },
      {
        tip: 'Same diagonal pattern as 4C, but with pelvic focus',
        explanation: 'The breathing mechanics are identical to 4C, but awareness must extend to the pelvis. The pelvic component means each exhale should reinforce pelvic correction. Research shows that combined trunk-pelvis awareness produces superior outcomes for 4CP compared to trunk-only focus (Negrini et al., 2015).'
      },
      {
        tip: 'Ground through the higher hip side during exhale',
        explanation: 'Grounding (pressing down) through the higher hip activates the gluteus medius and hip stabilizers on that side, creating a counter-force to the pelvic shift. This neuromuscular activation during exhale trains the body to maintain pelvic correction automatically (Reiman et al., 2012).'
      },
      {
        tip: 'Check hip symmetry in mirror throughout exercise',
        explanation: 'Pelvic position changes during breathing exercises as fatigue sets in or attention wanders. Mirror feedback provides continuous visual information about pelvic position, allowing immediate correction. This real-time feedback is essential for maintaining the pelvic component of 4CP correction (Weiss & Goodall, 2008).'
      },
    ],
  },
};

// Instructions for photo-based users (no X-ray data)
export function getPhotoBasedInstructions(
  higherShoulder?: 'left' | 'right',
  trunkShiftDirection?: 'left' | 'right'
): BreathingInstruction {
  // Assumption: higher shoulder typically indicates convex side
  // Expand the opposite (concave) side
  const expandSide: 'left' | 'right' = higherShoulder === 'right' ? 'left' : 'right';
  const derotationDirection: 'clockwise' | 'counterclockwise' = expandSide === 'left' ? 'counterclockwise' : 'clockwise';

  return {
    schrothType: 'photo-based',
    description: 'Adapted instructions based on postural assessment. For precise zone targeting, X-ray analysis is recommended.',

    primaryZone: {
      side: expandSide,
      verticalRegion: 'upper-thoracic',
      depth: 'posterolateral',
      ribLevels: 'T4-T10',
      description: `${expandSide.charAt(0).toUpperCase() + expandSide.slice(1)} posterolateral thoracic ribcage`,
    },

    derotationDirection,

    inhaleInstruction: `Breathe into your ${expandSide.toUpperCase()} POSTEROLATERAL ribcage (back-${expandSide} area, T4-T10). Feel the ribs expanding backward and outward.`,
    exhaleInstruction: `Exhale slowly while gently de-rotating. Draw your ${higherShoulder || 'higher'} shoulder down and back.`,

    positioningTip: `Place your hand on your ${expandSide} mid-back to feel the expansion. The ${expandSide} side should expand more than the other.`,

    visualization: {
      highlightZones: [
        { side: expandSide, region: 'upper', intensity: 'primary' },
      ],
      expansionArrows: [
        { position: expandSide === 'left' ? 'upper-left' : 'upper-right', direction: 'posterolateral' },
      ],
    },

    tips: [
      {
        tip: 'This is an estimated focus zone based on your shoulder asymmetry',
        explanation: 'Research shows strong correlation between shoulder height asymmetry and thoracic curve direction (higher shoulder typically on convex side). Photo-based assessment provides a reasonable starting point, though X-ray confirmation allows for precise zone targeting based on actual curve apex location (POTSI research, Amendt et al., 1990).'
      },
      {
        tip: 'For precise Schroth classification and dual-zone instructions, get an X-ray analysis',
        explanation: 'X-rays reveal the exact vertebral levels involved, presence of secondary curves, and rotation degree - information not visible in photos. Schroth classification (3C, 3CP, 4C, 4CP) requires this data for optimal exercise prescription. Studies show X-ray-guided programs have 30-40% better outcomes (Negrini et al., 2015).'
      },
      {
        tip: `Focus on POSTERIOR (back) expansion of the ${expandSide} side`,
        explanation: 'Posterior expansion targets the most collapsed area of the concave ribcage. In scoliosis, the ribs on the concave side are rotated backward and compressed. Breathing into this posterior zone provides the greatest mechanical advantage for rib cage and spinal de-rotation (Lehnert-Schroth, 2007).'
      },
      {
        tip: 'If you have a double curve, you may need to address both upper and lower zones',
        explanation: 'Double curves (S-shaped) occur in approximately 30% of scoliosis cases. Single-zone breathing only addresses part of the problem and can worsen the untreated curve through compensation. If exercises feel ineffective, consider X-ray analysis to rule out a secondary curve (Rigo et al., 2008).'
      },
    ],
  };
}

// Get instructions based on curve direction (for X-ray users without Schroth classification)
export function getInstructionsByCurveDirection(
  curveLocation: CurveLocation,
  curveDirection: CurveDirection
): BreathingInstruction {
  const expandSide: 'left' | 'right' = curveDirection === 'right' ? 'left' : 'right';
  const derotationDirection: 'clockwise' | 'counterclockwise' = expandSide === 'left' ? 'counterclockwise' : 'clockwise';

  const verticalRegion: BreathingZone['verticalRegion'] =
    curveLocation === 'thoracic' ? 'upper-thoracic' :
    curveLocation === 'lumbar' ? 'lumbar' : 'thoracolumbar';

  const ribLevels =
    curveLocation === 'thoracic' ? 'T4-T10' :
    curveLocation === 'lumbar' ? 'T11-L4' : 'T8-L2';

  const regionDescriptor =
    curveLocation === 'thoracic' ? 'upper/mid back' :
    curveLocation === 'lumbar' ? 'lower back/waist' : 'mid-lower back';

  return {
    schrothType: 'photo-based',
    description: `${curveLocation.charAt(0).toUpperCase() + curveLocation.slice(1)} curve with ${curveDirection} convexity`,

    primaryZone: {
      side: expandSide,
      verticalRegion,
      depth: 'posterolateral',
      ribLevels,
      description: `${expandSide.charAt(0).toUpperCase() + expandSide.slice(1)} posterolateral ${curveLocation} region`,
    },

    derotationDirection,

    inhaleInstruction: `Breathe into your ${expandSide.toUpperCase()} POSTERIOR ${regionDescriptor} (${ribLevels}). This is your concave (collapsed) zone.`,
    exhaleInstruction: `Exhale while maintaining expansion. Gently de-rotate by drawing your ${curveDirection} shoulder down and back.`,

    positioningTip: `Your curve is convex to the ${curveDirection}. Place hand on ${expandSide} ${regionDescriptor} to feel posterior expansion.`,

    visualization: {
      highlightZones: [
        {
          side: expandSide,
          region: curveLocation === 'lumbar' ? 'lower' : 'upper',
          intensity: 'primary'
        },
      ],
      expansionArrows: [
        {
          position: curveLocation === 'lumbar'
            ? (expandSide === 'left' ? 'lower-left' : 'lower-right')
            : (expandSide === 'left' ? 'upper-left' : 'upper-right'),
          direction: 'posterolateral'
        },
      ],
    },

    tips: [
      {
        tip: `Your ${curveLocation} curve is convex to the ${curveDirection}`,
        explanation: 'The convexity direction determines which side is collapsed (concave) and needs expansion. The X-ray confirms this orientation, allowing precise targeting. Understanding your curve direction helps you visualize what you are correcting during each breathing exercise (Lehnert-Schroth, 2007).'
      },
      {
        tip: `Focus on expanding the ${expandSide} POSTERIOR ${regionDescriptor}`,
        explanation: 'The concave side opposite the convexity has compressed ribs and reduced lung volume. Research shows targeted expansion of this zone increases vital capacity and mechanically de-rotates the spine. Posterior focus is essential because ribs on the concave side are rotated backward (Weiss et al., 2016).'
      },
      {
        tip: 'For double curves, both upper and lower zones may need attention',
        explanation: 'Many scoliosis cases involve compensatory secondary curves. If your X-ray shows only one curve but you have asymmetry at another level, a second curve may exist. Double curves require the more complex 4C/4CP breathing patterns for optimal correction (Rigo et al., 2008).'
      },
      {
        tip: 'Consistency is key - practice daily for best results',
        explanation: 'Research demonstrates that scoliosis-specific exercises must be performed regularly to produce results. Studies show that 90-180 minutes weekly, distributed across daily sessions, produces measurable Cobb angle reduction and improved quality of life after 4-6 months (Schreiber et al., 2015; Negrini et al., 2015).'
      },
    ],
  };
}

// YouTube tutorial link
export const RAB_TUTORIAL_URL = 'https://www.youtube.com/watch?v=t1tllI5TUY4';

// Default breathing settings
export const DEFAULT_BREATHING_SETTINGS = {
  inhaleDuration: 4, // seconds
  exhaleDuration: 4, // seconds
  holdDuration: 0,   // seconds (can be enabled)
  totalCycles: 10,
};

// Helper to get formatted zone description for UI
export function getZoneDescription(zone: BreathingZone): string {
  const sideLabel = zone.side.toUpperCase();
  const depthLabel = zone.depth === 'posterior' ? 'BACK' :
                     zone.depth === 'lateral' ? 'SIDE' : 'BACK-SIDE';
  const regionLabel = zone.verticalRegion === 'upper-thoracic' ? 'UPPER' :
                      zone.verticalRegion === 'lower-thoracic' ? 'MID' :
                      zone.verticalRegion === 'lumbar' ? 'LOWER' : 'MID-LOWER';

  return `${sideLabel} ${depthLabel} ${regionLabel} ribcage (${zone.ribLevels})`;
}

// Helper to check if instruction has dual zones
export function hasDualZones(instruction: BreathingInstruction): boolean {
  return instruction.secondaryZone !== undefined;
}
