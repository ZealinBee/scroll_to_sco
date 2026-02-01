// Breathing Instructions Data for Rotational Angular Breathing (RAB)
// Based on Schroth Method principles and scientific research
// References:
// - Physio-pedia Schroth Method
// - Johns Hopkins Medicine Schroth Method
// - PMC: "The method of Katharina Schroth - history, principles and current development"
// - Schroth Best Practice: ALS Classification

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

  tips: string[];
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
      'Focus on POSTERIOR (back) expansion, not just lateral',
      'The goal is to "fill" the collapsed concave area with breath',
      'Keep your pelvis stable - it should not shift during breathing',
      'Use a mirror to verify the left side is expanding more than the right',
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
      'This is a DUAL-ZONE pattern - both areas expand simultaneously',
      'Upper zone: posterior expansion (backward)',
      'Lower zone: more lateral expansion (outward)',
      'Keep pelvis level - may need to sit on a wedge initially',
      'Practice each zone separately first, then combine',
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
      'This is the COUNTER-ROTATION pattern - most complex',
      'Think of creating a diagonal corridor of expansion',
      'Upper body: left posterior expansion + left de-rotation',
      'Lower body: right lateral expansion + right de-rotation',
      'Practice 10-15 breath cycles, 2-3 times daily',
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
      'Critical: correct pelvic position BEFORE starting breathing',
      'May need wedge cushion or folded towel under higher hip',
      'Same diagonal pattern as 4C, but with pelvic focus',
      'Ground through the higher hip side during exhale',
      'Check hip symmetry in mirror throughout exercise',
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
      'This is an estimated focus zone based on your shoulder asymmetry',
      'For precise Schroth classification and dual-zone instructions, get an X-ray analysis',
      `Focus on POSTERIOR (back) expansion of the ${expandSide} side`,
      'If you have a double curve, you may need to address both upper and lower zones',
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
      `Your ${curveLocation} curve is convex to the ${curveDirection}`,
      `Focus on expanding the ${expandSide} POSTERIOR ${regionDescriptor}`,
      'For double curves, both upper and lower zones may need attention',
      'Consistency is key - practice daily for best results',
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
