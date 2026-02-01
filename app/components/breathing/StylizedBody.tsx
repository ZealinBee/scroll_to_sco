"use client";

import { useRef, useMemo } from "react";
import { useFrame } from "@react-three/fiber";
import * as THREE from "three";

// Types matching the breathing instructions
interface HighlightZone {
  side: 'left' | 'right';
  region: 'upper' | 'lower';
  intensity: 'primary' | 'secondary';
}

interface ExpansionArrow {
  position: 'upper-left' | 'upper-right' | 'lower-left' | 'lower-right';
  direction: 'posterior' | 'lateral' | 'posterolateral';
}

interface StylizedBodyProps {
  phase: "inhale" | "exhale" | "hold" | "rest";
  progress: number; // 0-1 within current phase
  highlightZones: HighlightZone[];
  expansionArrows: ExpansionArrow[];
  derotationDirection: "clockwise" | "counterclockwise";
}

// Anatomically accurate bone colors
const COLORS = {
  primary: "#3F9B61",
  primaryLight: "#4CAF73",
  primaryDark: "#357F50",
  bone: "#F5F0E8",       // Natural bone white
  boneDark: "#D9CFC0",   // Bone shadow
  boneHighlight: "#FFFEF5", // Bone highlight
  cartilage: "#E8E4DC",  // Costal cartilage (slightly blue-white)
  spine: "#EDE8E0",      // Vertebrae
  marrow: "#F8C8A8",     // Slight warmth in center
};

// Anatomically accurate rib with proper curvature
function AnatomicalRib({
  side,
  ribNumber,
  yPosition,
  baseWidth,
  isHighlighted,
  highlightIntensity,
  expansionScale,
  expansionDirection,
  phase,
}: {
  side: "left" | "right";
  ribNumber: number; // 1-12
  yPosition: number;
  baseWidth: number;
  isHighlighted: boolean;
  highlightIntensity: 'primary' | 'secondary' | null;
  expansionScale: number;
  expansionDirection: 'posterior' | 'lateral' | 'posterolateral' | null;
  phase: string;
}) {
  const meshRef = useRef<THREE.Mesh>(null);
  const isFloating = ribNumber >= 11; // Ribs 11-12 are floating (no costal cartilage)
  const isTrue = ribNumber <= 7; // Ribs 1-7 are true ribs (attach directly to sternum)

  // Rib geometry varies by position - upper ribs are more horizontal, lower ribs slope more
  const ribGeometry = useMemo(() => {
    const sideMultiplier = side === "left" ? -1 : 1;

    // Ribs have different angles based on position
    const slopeAngle = ribNumber * 0.03; // Increases as we go down
    const posteriorCurve = 0.15 + (ribNumber * 0.008); // Back curve increases slightly
    const ribLength = baseWidth * (1 - (Math.abs(ribNumber - 6) * 0.03)); // Middle ribs are widest

    // True anatomical rib path - curves from spine, around to front
    // Start: Costovertebral joint (at spine)
    // Middle: Curves posterolaterally then anterolaterally
    // End: Costochondral junction (where cartilage begins) or floating

    const points = [];
    const segments = 32;

    for (let i = 0; i <= segments; i++) {
      const t = i / segments;

      // X: Lateral extension with S-curve
      const lateralProgress = Math.sin(t * Math.PI * 0.5);
      const x = sideMultiplier * lateralProgress * ribLength;

      // Y: Slight downward slope
      const y = -t * slopeAngle * 0.3;

      // Z: Posterior curve (back) then forward
      // Maximum posterior point is around t=0.3
      const posteriorPeak = 0.3;
      let z;
      if (t < posteriorPeak) {
        z = -t / posteriorPeak * posteriorCurve; // Curve backward
      } else {
        const forwardProgress = (t - posteriorPeak) / (1 - posteriorPeak);
        z = -posteriorCurve + forwardProgress * (posteriorCurve + (isFloating ? 0 : 0.15)); // Curve forward (less for floating ribs)
      }

      points.push(new THREE.Vector3(x, y, z));
    }

    const curve = new THREE.CatmullRomCurve3(points);

    // Rib cross-section varies - flattened oval, wider at back
    const ribThickness = 0.018 - (ribNumber * 0.0008); // Upper ribs are slightly thicker
    const tubeGeometry = new THREE.TubeGeometry(curve, 32, ribThickness, 8, false);

    return tubeGeometry;
  }, [side, ribNumber, baseWidth, isFloating]);

  // Animate expansion
  useFrame(() => {
    if (meshRef.current) {
      let targetScaleX = 1;
      let targetScaleZ = 1;

      if (isHighlighted && expansionScale > 1) {
        const expansionAmount = expansionScale - 1;

        if (expansionDirection === 'posterior') {
          targetScaleZ = 1 + expansionAmount * 1.5; // Strong posterior
          targetScaleX = 1 + expansionAmount * 0.3;
        } else if (expansionDirection === 'lateral') {
          targetScaleX = 1 + expansionAmount * 1.3; // Strong lateral
          targetScaleZ = 1 + expansionAmount * 0.4;
        } else if (expansionDirection === 'posterolateral') {
          targetScaleX = 1 + expansionAmount * 0.9;
          targetScaleZ = 1 + expansionAmount * 1.1;
        }
      }

      // Smooth interpolation
      meshRef.current.scale.x += (targetScaleX - meshRef.current.scale.x) * 0.15;
      meshRef.current.scale.z += (targetScaleZ - meshRef.current.scale.z) * 0.15;
    }
  });

  // Bone material with highlighting
  const color = isHighlighted
    ? highlightIntensity === 'primary' ? COLORS.primary : COLORS.primaryLight
    : COLORS.bone;

  const emissiveColor = isHighlighted ? COLORS.primary : "#000000";
  const emissiveIntensity = isHighlighted
    ? (highlightIntensity === 'primary' ? 0.3 : 0.15)
    : 0;

  return (
    <group position={[0, yPosition, 0]}>
      {/* Main rib bone */}
      <mesh ref={meshRef} geometry={ribGeometry}>
        <meshStandardMaterial
          color={color}
          emissive={emissiveColor}
          emissiveIntensity={emissiveIntensity}
          roughness={0.7}
          metalness={0.1}
        />
      </mesh>

      {/* Costal cartilage for true and false ribs (not floating) */}
      {!isFloating && (
        <CartilageConnection
          side={side}
          ribNumber={ribNumber}
          baseWidth={baseWidth}
          isHighlighted={isHighlighted}
        />
      )}
    </group>
  );
}

// Costal cartilage connecting ribs to sternum
function CartilageConnection({
  side,
  ribNumber,
  baseWidth,
  isHighlighted,
}: {
  side: "left" | "right";
  ribNumber: number;
  baseWidth: number;
  isHighlighted: boolean;
}) {
  const sideMultiplier = side === "left" ? -1 : 1;
  const ribLength = baseWidth * (1 - (Math.abs(ribNumber - 6) * 0.03));

  // Cartilage connects rib end to sternum
  const startX = sideMultiplier * ribLength;
  const endX = sideMultiplier * 0.05; // Near sternum
  const slopeAngle = ribNumber * 0.03;

  const geometry = useMemo(() => {
    const curve = new THREE.QuadraticBezierCurve3(
      new THREE.Vector3(startX, -slopeAngle * 0.3, 0.15),
      new THREE.Vector3((startX + endX) / 2, -slopeAngle * 0.15, 0.2),
      new THREE.Vector3(endX, 0, 0.18)
    );
    return new THREE.TubeGeometry(curve, 12, 0.012, 6, false);
  }, [startX, endX, slopeAngle]);

  return (
    <mesh geometry={geometry}>
      <meshStandardMaterial
        color={isHighlighted ? COLORS.primaryLight : COLORS.cartilage}
        transparent
        opacity={0.7}
        roughness={0.8}
      />
    </mesh>
  );
}

// Anatomically accurate vertebra
function Vertebra({
  yPosition,
  type,
  index,
}: {
  yPosition: number;
  type: 'cervical' | 'thoracic' | 'lumbar';
  index: number;
}) {
  // Vertebrae size varies by region
  const size = type === 'lumbar' ? 0.055 : type === 'thoracic' ? 0.045 : 0.035;

  return (
    <group position={[0, yPosition, -0.08]}>
      {/* Vertebral body (centrum) */}
      <mesh>
        <cylinderGeometry args={[size, size * 1.1, 0.04, 12]} />
        <meshStandardMaterial color={COLORS.spine} roughness={0.8} />
      </mesh>

      {/* Spinous process (back protrusion) */}
      <mesh position={[0, 0, -0.04]} rotation={[0.3, 0, 0]}>
        <coneGeometry args={[0.015, 0.05, 6]} />
        <meshStandardMaterial color={COLORS.spine} roughness={0.8} />
      </mesh>

      {/* Transverse processes (side protrusions) */}
      <mesh position={[-0.04, 0, -0.02]} rotation={[0, 0, Math.PI / 2]}>
        <coneGeometry args={[0.01, 0.03, 6]} />
        <meshStandardMaterial color={COLORS.spine} roughness={0.8} />
      </mesh>
      <mesh position={[0.04, 0, -0.02]} rotation={[0, 0, -Math.PI / 2]}>
        <coneGeometry args={[0.01, 0.03, 6]} />
        <meshStandardMaterial color={COLORS.spine} roughness={0.8} />
      </mesh>
    </group>
  );
}

// Full spine with all vertebrae
function Spine() {
  const vertebrae = useMemo(() => {
    const result: { y: number; type: 'cervical' | 'thoracic' | 'lumbar'; index: number }[] = [];

    // Lumbar (L1-L5) - bottom
    for (let i = 0; i < 5; i++) {
      result.push({ y: -0.55 + i * 0.07, type: 'lumbar', index: 5 - i });
    }

    // Thoracic (T1-T12)
    for (let i = 0; i < 12; i++) {
      result.push({ y: -0.2 + i * 0.065, type: 'thoracic', index: 12 - i });
    }

    // Cervical (C1-C7) - top
    for (let i = 0; i < 7; i++) {
      result.push({ y: 0.6 + i * 0.05, type: 'cervical', index: 7 - i });
    }

    return result;
  }, []);

  return (
    <group>
      {vertebrae.map((v, i) => (
        <Vertebra key={i} yPosition={v.y} type={v.type} index={v.index} />
      ))}

      {/* Intervertebral discs visualization */}
      {vertebrae.slice(0, -1).map((v, i) => (
        <mesh key={`disc-${i}`} position={[0, v.y + 0.032, -0.08]}>
          <cylinderGeometry args={[0.035, 0.035, 0.015, 12]} />
          <meshStandardMaterial color="#B8D4E8" transparent opacity={0.5} />
        </mesh>
      ))}
    </group>
  );
}

// Sternum (breastbone)
function Sternum() {
  const geometry = useMemo(() => {
    // Sternum shape - manubrium at top, body, xiphoid process at bottom
    const shape = new THREE.Shape();
    shape.moveTo(-0.05, 0.3);   // Top left of manubrium
    shape.lineTo(0.05, 0.3);    // Top right
    shape.lineTo(0.06, 0.25);   // Notch
    shape.lineTo(0.04, 0.2);    // Body start
    shape.lineTo(0.035, -0.15); // Body tapers
    shape.lineTo(0.015, -0.22); // Xiphoid
    shape.lineTo(0, -0.25);     // Xiphoid tip
    shape.lineTo(-0.015, -0.22);
    shape.lineTo(-0.035, -0.15);
    shape.lineTo(-0.04, 0.2);
    shape.lineTo(-0.06, 0.25);
    shape.closePath();

    const extrudeSettings = { depth: 0.025, bevelEnabled: true, bevelThickness: 0.005, bevelSize: 0.005 };
    return new THREE.ExtrudeGeometry(shape, extrudeSettings);
  }, []);

  return (
    <mesh geometry={geometry} position={[0, 0.35, 0.18]} rotation={[-0.1, 0, 0]}>
      <meshStandardMaterial color={COLORS.bone} roughness={0.7} />
    </mesh>
  );
}

// Scapula (shoulder blade)
function Scapula({ side }: { side: 'left' | 'right' }) {
  const sideMultiplier = side === 'left' ? -1 : 1;

  const geometry = useMemo(() => {
    // Simplified triangular scapula shape
    const shape = new THREE.Shape();
    shape.moveTo(0, 0.15);      // Superior angle
    shape.lineTo(0.08, 0);      // Spine of scapula
    shape.lineTo(0.05, -0.12);  // Inferior angle
    shape.lineTo(-0.02, -0.08); // Medial border
    shape.closePath();

    const extrudeSettings = { depth: 0.015, bevelEnabled: true, bevelThickness: 0.003, bevelSize: 0.003 };
    return new THREE.ExtrudeGeometry(shape, extrudeSettings);
  }, []);

  return (
    <group position={[sideMultiplier * 0.25, 0.55, -0.12]}>
      <mesh geometry={geometry} scale={[sideMultiplier, 1, 1]} rotation={[0.2, sideMultiplier * 0.3, 0]}>
        <meshStandardMaterial color={COLORS.bone} roughness={0.7} side={THREE.DoubleSide} />
      </mesh>

      {/* Acromion process */}
      <mesh position={[sideMultiplier * 0.1, 0.08, 0.02]}>
        <sphereGeometry args={[0.025, 8, 8]} />
        <meshStandardMaterial color={COLORS.bone} roughness={0.7} />
      </mesh>
    </group>
  );
}

// Clavicle (collarbone)
function Clavicle({ side }: { side: 'left' | 'right' }) {
  const sideMultiplier = side === 'left' ? -1 : 1;

  const geometry = useMemo(() => {
    // S-curved clavicle
    const curve = new THREE.CubicBezierCurve3(
      new THREE.Vector3(0, 0, 0),
      new THREE.Vector3(sideMultiplier * 0.08, 0, 0.03),
      new THREE.Vector3(sideMultiplier * 0.15, -0.02, 0.01),
      new THREE.Vector3(sideMultiplier * 0.22, -0.03, -0.02)
    );
    return new THREE.TubeGeometry(curve, 16, 0.012, 8, false);
  }, [sideMultiplier]);

  return (
    <mesh geometry={geometry} position={[0, 0.72, 0.12]}>
      <meshStandardMaterial color={COLORS.bone} roughness={0.7} />
    </mesh>
  );
}

// Pelvis
function Pelvis() {
  return (
    <group position={[0, -0.65, 0]}>
      {/* Sacrum */}
      <mesh position={[0, 0.05, -0.05]}>
        <coneGeometry args={[0.08, 0.15, 6]} />
        <meshStandardMaterial color={COLORS.bone} roughness={0.7} />
      </mesh>

      {/* Iliac crests - wing-like hip bones */}
      {(['left', 'right'] as const).map(side => {
        const sideMultiplier = side === 'left' ? -1 : 1;
        return (
          <group key={side}>
            {/* Ilium */}
            <mesh position={[sideMultiplier * 0.15, 0.08, 0]} rotation={[0.1, sideMultiplier * 0.4, sideMultiplier * 0.3]}>
              <sphereGeometry args={[0.12, 12, 12]} />
              <meshStandardMaterial color={COLORS.bone} roughness={0.7} />
            </mesh>

            {/* Iliac crest curve */}
            <mesh position={[sideMultiplier * 0.22, 0.12, 0.02]}>
              <capsuleGeometry args={[0.03, 0.08, 4, 8]} />
              <meshStandardMaterial color={COLORS.bone} roughness={0.7} />
            </mesh>
          </group>
        );
      })}
    </group>
  );
}

// Skull (simplified)
function Skull() {
  return (
    <group position={[0, 0.95, 0]}>
      {/* Cranium */}
      <mesh position={[0, 0.08, -0.02]}>
        <sphereGeometry args={[0.1, 16, 16]} />
        <meshStandardMaterial color={COLORS.bone} roughness={0.7} />
      </mesh>

      {/* Face/jaw area */}
      <mesh position={[0, -0.02, 0.05]}>
        <sphereGeometry args={[0.06, 12, 12]} />
        <meshStandardMaterial color={COLORS.bone} roughness={0.7} />
      </mesh>

      {/* Mandible */}
      <mesh position={[0, -0.08, 0.04]} rotation={[0.2, 0, 0]}>
        <capsuleGeometry args={[0.025, 0.06, 4, 8]} />
        <meshStandardMaterial color={COLORS.bone} roughness={0.7} />
      </mesh>
    </group>
  );
}

// Expansion direction arrow
function ExpansionArrow({
  position,
  direction,
  isActive,
  phase,
  progress,
}: {
  position: 'upper-left' | 'upper-right' | 'lower-left' | 'lower-right';
  direction: 'posterior' | 'lateral' | 'posterolateral';
  isActive: boolean;
  phase: string;
  progress: number;
}) {
  const meshRef = useRef<THREE.Group>(null);

  // Position the arrow based on zone
  const [baseX, baseY] = useMemo(() => {
    switch (position) {
      case 'upper-left': return [-0.35, 0.35];
      case 'upper-right': return [0.35, 0.35];
      case 'lower-left': return [-0.35, 0];
      case 'lower-right': return [0.35, 0];
    }
  }, [position]);

  // Arrow direction rotation
  const rotation = useMemo(() => {
    const isLeft = position.includes('left');
    switch (direction) {
      case 'posterior': return [0, isLeft ? Math.PI / 4 : -Math.PI / 4, Math.PI / 2];
      case 'lateral': return [0, isLeft ? Math.PI / 2 : -Math.PI / 2, Math.PI / 2];
      case 'posterolateral': return [0, isLeft ? Math.PI / 3 : -Math.PI / 3, Math.PI / 2];
    }
  }, [direction, position]);

  // Animate arrow pulse
  useFrame(() => {
    if (meshRef.current && isActive) {
      const pulse = phase === 'inhale' ? Math.sin(progress * Math.PI) * 0.3 : 0;
      meshRef.current.scale.setScalar(1 + pulse);
    }
  });

  if (!isActive) return null;

  return (
    <group ref={meshRef} position={[baseX, baseY, 0.1]} rotation={rotation as [number, number, number]}>
      {/* Arrow shaft */}
      <mesh position={[0, 0.04, 0]}>
        <cylinderGeometry args={[0.008, 0.008, 0.08, 8]} />
        <meshStandardMaterial color={COLORS.primary} emissive={COLORS.primary} emissiveIntensity={0.5} />
      </mesh>

      {/* Arrow head */}
      <mesh position={[0, 0.09, 0]}>
        <coneGeometry args={[0.02, 0.04, 8]} />
        <meshStandardMaterial color={COLORS.primary} emissive={COLORS.primary} emissiveIntensity={0.5} />
      </mesh>
    </group>
  );
}

// Full ribcage with all ribs
function Ribcage({
  phase,
  progress,
  highlightZones,
  expansionArrows,
}: {
  phase: "inhale" | "exhale" | "hold" | "rest";
  progress: number;
  highlightZones: HighlightZone[];
  expansionArrows: ExpansionArrow[];
}) {
  // Calculate breathing scale
  const breathingScale = useMemo(() => {
    if (phase === "rest") return 1;
    if (phase === "inhale") return 1 + progress * 0.2;
    if (phase === "hold") return 1.2;
    if (phase === "exhale") return 1.2 - progress * 0.2;
    return 1;
  }, [phase, progress]);

  // Rib configuration - 12 pairs
  const ribConfig = useMemo(() => {
    const config = [];
    for (let i = 1; i <= 12; i++) {
      const yPos = 0.55 - (i - 1) * 0.075;
      const isUpper = i <= 6;
      config.push({ ribNumber: i, yPos, isUpper, baseWidth: 0.45 });
    }
    return config;
  }, []);

  // Get highlight and expansion info for a rib
  const getRibInfo = (side: 'left' | 'right', isUpper: boolean) => {
    const region = isUpper ? 'upper' : 'lower';
    const zone = highlightZones.find(z => z.side === side && z.region === region);
    const position = `${isUpper ? 'upper' : 'lower'}-${side}` as ExpansionArrow['position'];
    const arrow = expansionArrows.find(a => a.position === position);

    const isHighlighted = !!zone;
    const intensity = zone?.intensity || null;

    // Calculate expansion scale
    let expansionScale = 1;
    if (isHighlighted && (phase === 'inhale' || phase === 'hold')) {
      const baseExpansion = breathingScale;
      const intensityBonus = intensity === 'primary' ? 0.12 : 0.06;
      expansionScale = baseExpansion + (phase === 'inhale' ? intensityBonus * progress : intensityBonus);
    }

    return { isHighlighted, intensity, expansionScale, expansionDirection: arrow?.direction || null };
  };

  return (
    <group>
      {/* Sternum */}
      <Sternum />

      {/* All ribs */}
      {ribConfig.map(({ ribNumber, yPos, isUpper, baseWidth }) => (
        <group key={ribNumber}>
          {(['left', 'right'] as const).map(side => {
            const info = getRibInfo(side, isUpper);
            return (
              <AnatomicalRib
                key={`${side}-${ribNumber}`}
                side={side}
                ribNumber={ribNumber}
                yPosition={yPos}
                baseWidth={baseWidth}
                isHighlighted={info.isHighlighted}
                highlightIntensity={info.intensity}
                expansionScale={info.expansionScale}
                expansionDirection={info.expansionDirection}
                phase={phase}
              />
            );
          })}
        </group>
      ))}

      {/* Expansion direction arrows */}
      {expansionArrows.map((arrow, i) => {
        const position = arrow.position;
        const isUpper = position.includes('upper');
        const side = position.includes('left') ? 'left' : 'right';
        const region = isUpper ? 'upper' : 'lower';
        const zone = highlightZones.find(z => z.side === side && z.region === region);

        return (
          <ExpansionArrow
            key={i}
            position={position}
            direction={arrow.direction}
            isActive={!!zone && (phase === 'inhale' || phase === 'hold')}
            phase={phase}
            progress={progress}
          />
        );
      })}
    </group>
  );
}

// Main component
export default function StylizedBody({
  phase,
  progress,
  highlightZones,
  expansionArrows,
  derotationDirection,
}: StylizedBodyProps) {
  const groupRef = useRef<THREE.Group>(null);

  // De-rotation animation during exhale
  useFrame(() => {
    if (groupRef.current) {
      let targetRotation = 0;
      if (phase === "exhale") {
        const maxRotation = 0.1; // ~6 degrees
        const sign = derotationDirection === "clockwise" ? 1 : -1;
        targetRotation = sign * maxRotation * progress;
      }
      groupRef.current.rotation.y += (targetRotation - groupRef.current.rotation.y) * 0.08;
    }
  });

  return (
    // Rotate 180 degrees to show BACK view (for Schroth breathing exercises)
    <group rotation={[0, Math.PI, 0]}>
      <group ref={groupRef} position={[0, -0.2, 0]}>
        {/* Spine */}
        <Spine />

      {/* Ribcage */}
      <Ribcage
        phase={phase}
        progress={progress}
        highlightZones={highlightZones}
        expansionArrows={expansionArrows}
      />

      {/* Shoulder girdle */}
      <Scapula side="left" />
      <Scapula side="right" />
      <Clavicle side="left" />
      <Clavicle side="right" />

      {/* Pelvis */}
      <Pelvis />

      {/* Skull */}
      <Skull />
      </group>
    </group>
  );
}
