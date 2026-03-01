"use client";

import { motion } from "framer-motion";

// Types matching the breathing instructions
interface HighlightZone {
  side: "left" | "right";
  region: "upper" | "lower";
  intensity: "primary" | "secondary";
}

interface ExpansionArrow {
  position: "upper-left" | "upper-right" | "lower-left" | "lower-right";
  direction: "posterior" | "lateral" | "posterolateral";
}

interface BreathingVisualizer2DProps {
  phase: "inhale" | "exhale" | "hold" | "rest";
  progress: number;
  highlightZones: HighlightZone[];
  expansionArrows: ExpansionArrow[];
  derotationDirection: "clockwise" | "counterclockwise";
}

// Design system colors
const COLORS = {
  primary: "#3F9B61",
  primaryLight: "#4CAF73",
  primaryMuted: "rgba(63, 155, 97, 0.2)",
  bone: "#E8E4DC",
  boneStroke: "#C9C4B8",
  boneDark: "#D4CFC3",
  spine: "#D9D4C8",
  spineStroke: "#B8B3A7",
  muted: "#6B7280",
};

export default function BreathingVisualizer2D({
  phase,
  progress,
  highlightZones,
  expansionArrows,
  derotationDirection,
}: BreathingVisualizer2DProps) {
  // Calculate breathing scale
  const getBreathScale = () => {
    if (phase === "rest") return 1;
    if (phase === "inhale") return 1 + progress * 0.08;
    if (phase === "hold") return 1.08;
    if (phase === "exhale") return 1.08 - progress * 0.08;
    return 1;
  };

  const breathScale = getBreathScale();

  // Check if zone is highlighted
  const isZoneHighlighted = (side: "left" | "right", region: "upper" | "lower") => {
    return highlightZones.find((z) => z.side === side && z.region === region);
  };

  // Get arrow for position
  const getArrow = (position: ExpansionArrow["position"]) => {
    return expansionArrows.find((a) => a.position === position);
  };

  // De-rotation angle
  const getRotation = () => {
    if (phase !== "exhale") return 0;
    const maxRotation = 2;
    const sign = derotationDirection === "clockwise" ? 1 : -1;
    return sign * maxRotation * progress;
  };

  // Rib paths - anatomically accurate curves from spine to sternum
  const generateRibPath = (
    ribIndex: number,
    side: "left" | "right",
    scale: number = 1
  ) => {
    const isLeft = side === "left";
    const sideMultiplier = isLeft ? -1 : 1;

    // Rib dimensions vary by position (upper ribs are shorter, middle ribs longest)
    const ribLengths = [52, 58, 65, 70, 72, 72, 70, 65, 58, 50, 40, 30];
    const ribLength = ribLengths[ribIndex] * scale;

    // Y positions for each rib (from top)
    const ribYPositions = [62, 76, 90, 104, 118, 132, 146, 160, 174, 188, 200, 210];
    const y = ribYPositions[ribIndex];

    // Rib curvature - starts at spine, curves outward and forward
    const spineX = 100;
    const endX = spineX + (sideMultiplier * ribLength);
    const controlX = spineX + (sideMultiplier * ribLength * 0.6);
    const slopeDown = ribIndex * 2; // Lower ribs slope down more

    return `M${spineX} ${y} Q${controlX} ${y + slopeDown * 0.3} ${endX} ${y + slopeDown}`;
  };

  // Sternum path
  const sternumPath = "M100 55 L100 58 L104 62 L104 180 L102 190 L100 195 L98 190 L96 180 L96 62 L100 58 Z";

  return (
    <div className="relative w-full h-full min-h-[300px] rounded-[16px] overflow-hidden bg-gradient-to-b from-light to-white flex items-center justify-center">
      <motion.svg
        viewBox="0 0 200 280"
        className="w-full h-full max-w-[280px] max-h-[380px]"
        animate={{ rotate: getRotation() }}
        transition={{ duration: 0.3, ease: "easeOut" }}
      >
        <defs>
          {/* Glow filter for highlights */}
          <filter id="glow" x="-50%" y="-50%" width="200%" height="200%">
            <feGaussianBlur stdDeviation="2" result="coloredBlur" />
            <feMerge>
              <feMergeNode in="coloredBlur" />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>

          {/* Bone gradient */}
          <linearGradient id="boneGradient" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor={COLORS.bone} />
            <stop offset="100%" stopColor={COLORS.boneDark} />
          </linearGradient>

          {/* Highlighted bone gradient */}
          <linearGradient id="highlightGradient" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor={COLORS.primaryLight} />
            <stop offset="100%" stopColor={COLORS.primary} />
          </linearGradient>
        </defs>

        {/* Spine / Vertebrae */}
        <g>
          {/* Cervical vertebrae hint */}
          {[0, 1, 2].map((i) => (
            <rect
              key={`cervical-${i}`}
              x="96"
              y={35 + i * 8}
              width="8"
              height="6"
              rx="2"
              fill={COLORS.spine}
              stroke={COLORS.spineStroke}
              strokeWidth="0.5"
            />
          ))}

          {/* Thoracic vertebrae (12) */}
          {Array.from({ length: 12 }).map((_, i) => (
            <rect
              key={`thoracic-${i}`}
              x="95"
              y={60 + i * 14}
              width="10"
              height="10"
              rx="2"
              fill={COLORS.spine}
              stroke={COLORS.spineStroke}
              strokeWidth="0.5"
            />
          ))}

          {/* Lumbar vertebrae hint */}
          {[0, 1, 2].map((i) => (
            <rect
              key={`lumbar-${i}`}
              x="94"
              y={230 + i * 12}
              width="12"
              height="9"
              rx="2"
              fill={COLORS.spine}
              stroke={COLORS.spineStroke}
              strokeWidth="0.5"
            />
          ))}
        </g>

        {/* Sternum */}
        <path
          d={sternumPath}
          fill={COLORS.bone}
          stroke={COLORS.boneStroke}
          strokeWidth="1"
        />

        {/* Clavicles */}
        <path
          d="M100 55 Q80 50 55 58"
          fill="none"
          stroke={COLORS.boneStroke}
          strokeWidth="4"
          strokeLinecap="round"
        />
        <path
          d="M100 55 Q120 50 145 58"
          fill="none"
          stroke={COLORS.boneStroke}
          strokeWidth="4"
          strokeLinecap="round"
        />

        {/* Scapulae hints */}
        <ellipse cx="45" cy="85" rx="15" ry="25" fill={COLORS.bone} stroke={COLORS.boneStroke} strokeWidth="0.5" opacity="0.5" />
        <ellipse cx="155" cy="85" rx="15" ry="25" fill={COLORS.bone} stroke={COLORS.boneStroke} strokeWidth="0.5" opacity="0.5" />

        {/* Ribs - Left side */}
        {Array.from({ length: 12 }).map((_, i) => {
          const isUpper = i < 6;
          const zone = isZoneHighlighted("left", isUpper ? "upper" : "lower");
          const isHighlighted = !!zone;
          const isPrimary = zone?.intensity === "primary";
          const scale = isHighlighted ? breathScale : 1;

          return (
            <motion.path
              key={`rib-left-${i}`}
              d={generateRibPath(i, "left", 1)}
              fill="none"
              stroke={isHighlighted ? COLORS.primary : COLORS.boneStroke}
              strokeWidth={isHighlighted ? (isPrimary ? "4" : "3") : "2.5"}
              strokeLinecap="round"
              filter={isHighlighted ? "url(#glow)" : undefined}
              animate={{
                d: generateRibPath(i, "left", scale),
                opacity: isHighlighted ? 1 : 0.8,
              }}
              transition={{ duration: 0.3, ease: "easeOut" }}
            />
          );
        })}

        {/* Ribs - Right side */}
        {Array.from({ length: 12 }).map((_, i) => {
          const isUpper = i < 6;
          const zone = isZoneHighlighted("right", isUpper ? "upper" : "lower");
          const isHighlighted = !!zone;
          const isPrimary = zone?.intensity === "primary";
          const scale = isHighlighted ? breathScale : 1;

          return (
            <motion.path
              key={`rib-right-${i}`}
              d={generateRibPath(i, "right", 1)}
              fill="none"
              stroke={isHighlighted ? COLORS.primary : COLORS.boneStroke}
              strokeWidth={isHighlighted ? (isPrimary ? "4" : "3") : "2.5"}
              strokeLinecap="round"
              filter={isHighlighted ? "url(#glow)" : undefined}
              animate={{
                d: generateRibPath(i, "right", scale),
                opacity: isHighlighted ? 1 : 0.8,
              }}
              transition={{ duration: 0.3, ease: "easeOut" }}
            />
          );
        })}

        {/* Costal cartilage - connecting ribs to sternum (ribs 1-7) */}
        {Array.from({ length: 7 }).map((_, i) => {
          const y = 62 + i * 14 + i * 2;
          const endY = 65 + i * 16;
          return (
            <g key={`cartilage-${i}`}>
              <path
                d={`M${100 - 52 + i * 5} ${y + i * 2} Q${100 - 25} ${endY} 96 ${endY + 5}`}
                fill="none"
                stroke={COLORS.boneDark}
                strokeWidth="1.5"
                strokeLinecap="round"
                opacity="0.6"
              />
              <path
                d={`M${100 + 52 - i * 5} ${y + i * 2} Q${100 + 25} ${endY} 104 ${endY + 5}`}
                fill="none"
                stroke={COLORS.boneDark}
                strokeWidth="1.5"
                strokeLinecap="round"
                opacity="0.6"
              />
            </g>
          );
        })}

        {/* Pelvis hint */}
        <path
          d="M70 260 Q85 250 100 255 Q115 250 130 260 L125 270 Q100 265 75 270 Z"
          fill={COLORS.bone}
          stroke={COLORS.boneStroke}
          strokeWidth="1"
          opacity="0.6"
        />

        {/* Zone highlight overlays */}
        {highlightZones.map((zone) => {
          const isLeft = zone.side === "left";
          const isUpper = zone.region === "upper";
          const cx = isLeft ? 55 : 145;
          const cy = isUpper ? 95 : 165;
          const isPrimary = zone.intensity === "primary";

          return (
            <motion.ellipse
              key={`zone-${zone.side}-${zone.region}`}
              cx={cx}
              cy={cy}
              rx="35"
              ry="45"
              fill={COLORS.primaryMuted}
              opacity="0.4"
              animate={{
                rx: 35 + (phase === "inhale" ? progress * 8 : phase === "hold" ? 8 : 0),
                ry: 45 + (phase === "inhale" ? progress * 5 : phase === "hold" ? 5 : 0),
                opacity: isPrimary ? 0.5 : 0.3,
              }}
              transition={{ duration: 0.3, ease: "easeOut" }}
            />
          );
        })}

        {/* Expansion arrows */}
        {expansionArrows.map((arrow) => {
          const isLeft = arrow.position.includes("left");
          const isUpper = arrow.position.includes("upper");
          const zone = isZoneHighlighted(
            isLeft ? "left" : "right",
            isUpper ? "upper" : "lower"
          );

          if (!zone || (phase !== "inhale" && phase !== "hold")) return null;

          const baseX = isLeft ? 25 : 175;
          const baseY = isUpper ? 95 : 165;

          // Arrow direction
          let angle = isLeft ? 180 : 0;
          if (arrow.direction === "posterior") {
            angle += isLeft ? -25 : 25;
          } else if (arrow.direction === "posterolateral") {
            angle += isLeft ? -12 : 12;
          }

          const length = 18 + (phase === "inhale" ? progress * 8 : 8);
          const endX = baseX + Math.cos((angle * Math.PI) / 180) * length;
          const endY = baseY + Math.sin((angle * Math.PI) / 180) * length;

          // Arrow head points
          const headLength = 6;
          const headAngle = 25;
          const angle1 = angle + 180 - headAngle;
          const angle2 = angle + 180 + headAngle;
          const head1X = endX + Math.cos((angle1 * Math.PI) / 180) * headLength;
          const head1Y = endY + Math.sin((angle1 * Math.PI) / 180) * headLength;
          const head2X = endX + Math.cos((angle2 * Math.PI) / 180) * headLength;
          const head2Y = endY + Math.sin((angle2 * Math.PI) / 180) * headLength;

          return (
            <motion.g
              key={`arrow-${arrow.position}`}
              animate={{
                x: phase === "inhale" ? (isLeft ? -progress * 5 : progress * 5) : 0,
              }}
              transition={{ duration: 0.3, ease: "easeOut" }}
            >
              <line
                x1={baseX}
                y1={baseY}
                x2={endX}
                y2={endY}
                stroke={COLORS.primary}
                strokeWidth="2.5"
                strokeLinecap="round"
                filter="url(#glow)"
              />
              <path
                d={`M${endX} ${endY} L${head1X} ${head1Y} M${endX} ${endY} L${head2X} ${head2Y}`}
                stroke={COLORS.primary}
                strokeWidth="2.5"
                strokeLinecap="round"
                filter="url(#glow)"
              />
            </motion.g>
          );
        })}
      </motion.svg>

      {/* Zone indicators overlay */}
      <div className="absolute top-3 left-3 space-y-1">
        <div className="flex items-center gap-2">
          <div
            className={`flex items-center gap-1.5 px-2 py-1 rounded-full backdrop-blur-sm text-xs ${
              isZoneHighlighted("left", "upper")
                ? "bg-primary/20 text-primary font-medium"
                : "bg-dark/10 text-muted"
            }`}
          >
            <div
              className={`w-2 h-2 rounded-full ${
                isZoneHighlighted("left", "upper") ? "bg-primary" : "bg-muted/30"
              }`}
            />
            UL
          </div>
          <div
            className={`flex items-center gap-1.5 px-2 py-1 rounded-full backdrop-blur-sm text-xs ${
              isZoneHighlighted("right", "upper")
                ? "bg-primary/20 text-primary font-medium"
                : "bg-dark/10 text-muted"
            }`}
          >
            UR
            <div
              className={`w-2 h-2 rounded-full ${
                isZoneHighlighted("right", "upper") ? "bg-primary" : "bg-muted/30"
              }`}
            />
          </div>
        </div>
        <div className="flex items-center gap-2">
          <div
            className={`flex items-center gap-1.5 px-2 py-1 rounded-full backdrop-blur-sm text-xs ${
              isZoneHighlighted("left", "lower")
                ? "bg-primary/20 text-primary font-medium"
                : "bg-dark/10 text-muted"
            }`}
          >
            <div
              className={`w-2 h-2 rounded-full ${
                isZoneHighlighted("left", "lower") ? "bg-primary" : "bg-muted/30"
              }`}
            />
            LL
          </div>
          <div
            className={`flex items-center gap-1.5 px-2 py-1 rounded-full backdrop-blur-sm text-xs ${
              isZoneHighlighted("right", "lower")
                ? "bg-primary/20 text-primary font-medium"
                : "bg-dark/10 text-muted"
            }`}
          >
            LR
            <div
              className={`w-2 h-2 rounded-full ${
                isZoneHighlighted("right", "lower") ? "bg-primary" : "bg-muted/30"
              }`}
            />
          </div>
        </div>
      </div>

      {/* Phase indicator */}
      <div className="absolute bottom-3 left-3">
        <div
          className={`px-3 py-1.5 rounded-full backdrop-blur-sm text-xs font-medium transition-all duration-300 ${
            phase === "inhale"
              ? "bg-primary/20 text-primary"
              : phase === "exhale"
              ? "bg-dark/10 text-dark"
              : "bg-muted/10 text-muted"
          }`}
        >
          {phase === "inhale" && "Expanding"}
          {phase === "exhale" && "De-rotating"}
          {phase === "hold" && "Holding"}
          {phase === "rest" && "Ready"}
        </div>
      </div>
    </div>
  );
}
