"use client";

import { Suspense, useState } from "react";
import { Canvas } from "@react-three/fiber";
import { OrbitControls, Environment, ContactShadows } from "@react-three/drei";
import { Loader2, RotateCcw, ZoomIn, ZoomOut } from "lucide-react";
import StylizedBody from "./StylizedBody";

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

interface BreathingVisualizer3DProps {
  phase: "inhale" | "exhale" | "hold" | "rest";
  progress: number; // 0-1 within current phase
  highlightZones: HighlightZone[];
  expansionArrows: ExpansionArrow[];
  derotationDirection: "clockwise" | "counterclockwise";
}

// Loading fallback for Suspense
function LoadingFallback() {
  return (
    <mesh>
      <sphereGeometry args={[0.5, 16, 16]} />
      <meshStandardMaterial color="#3F9B61" wireframe />
    </mesh>
  );
}

export default function BreathingVisualizer3D({
  phase,
  progress,
  highlightZones,
  expansionArrows,
  derotationDirection,
}: BreathingVisualizer3DProps) {
  const [zoom, setZoom] = useState(1);

  const handleZoomIn = () => setZoom((prev) => Math.min(prev + 0.2, 2));
  const handleZoomOut = () => setZoom((prev) => Math.max(prev - 0.2, 0.5));
  const handleResetView = () => setZoom(1);

  // Determine which zones need emphasis for the indicator
  const hasUpperLeft = highlightZones.some(z => z.side === 'left' && z.region === 'upper');
  const hasUpperRight = highlightZones.some(z => z.side === 'right' && z.region === 'upper');
  const hasLowerLeft = highlightZones.some(z => z.side === 'left' && z.region === 'lower');
  const hasLowerRight = highlightZones.some(z => z.side === 'right' && z.region === 'lower');

  return (
    <div className="relative w-full h-full min-h-[300px] rounded-[16px] overflow-hidden bg-gradient-to-b from-light to-white">
      {/* 3D Canvas */}
      <Canvas
        camera={{
          position: [0, 0.3, 3 / zoom],
          fov: 45,
          near: 0.1,
          far: 100,
        }}
        shadows
        dpr={[1, 2]}
        style={{ background: "transparent" }}
      >
        {/* Lighting */}
        <ambientLight intensity={0.5} />
        <directionalLight
          position={[5, 5, 5]}
          intensity={0.8}
          castShadow
          shadow-mapSize={[1024, 1024]}
        />
        <directionalLight position={[-3, 3, -3]} intensity={0.3} />

        {/* Environment for reflections */}
        <Environment preset="studio" />

        {/* Ground shadow */}
        <ContactShadows
          position={[0, -0.9, 0]}
          opacity={0.4}
          scale={3}
          blur={2}
          far={1.5}
        />

        {/* Suspense for loading */}
        <Suspense fallback={<LoadingFallback />}>
          {/* Main body model */}
          <StylizedBody
            phase={phase}
            progress={progress}
            highlightZones={highlightZones}
            expansionArrows={expansionArrows}
            derotationDirection={derotationDirection}
          />
        </Suspense>

        {/* Camera controls - limited rotation */}
        <OrbitControls
          enablePan={false}
          enableZoom={false}
          minPolarAngle={Math.PI / 4}
          maxPolarAngle={Math.PI / 1.5}
          minAzimuthAngle={-Math.PI / 3}
          maxAzimuthAngle={Math.PI / 3}
        />
      </Canvas>

      {/* Loading overlay */}
      <div className="absolute inset-0 flex items-center justify-center pointer-events-none opacity-0 transition-opacity duration-300">
        <div className="flex items-center gap-2 text-muted">
          <Loader2 size={20} className="animate-spin" />
          <span className="text-sm">Loading 3D model...</span>
        </div>
      </div>

      {/* View controls */}
      <div className="absolute bottom-3 right-3 flex items-center gap-1">
        <button
          onClick={handleZoomOut}
          className="p-2 rounded-[12px] bg-white/70 backdrop-blur-sm border border-white/50 hover:bg-white/90 transition-all duration-200"
          title="Zoom out"
        >
          <ZoomOut size={16} className="text-dark" />
        </button>
        <button
          onClick={handleResetView}
          className="p-2 rounded-[12px] bg-white/70 backdrop-blur-sm border border-white/50 hover:bg-white/90 transition-all duration-200"
          title="Reset view"
        >
          <RotateCcw size={16} className="text-dark" />
        </button>
        <button
          onClick={handleZoomIn}
          className="p-2 rounded-[12px] bg-white/70 backdrop-blur-sm border border-white/50 hover:bg-white/90 transition-all duration-200"
          title="Zoom in"
        >
          <ZoomIn size={16} className="text-dark" />
        </button>
      </div>

      {/* Zone indicators - showing which zones are being targeted */}
      <div className="absolute top-3 left-3 space-y-1">
        <div className="flex items-center gap-2">
          {/* Upper zones */}
          <div className={`flex items-center gap-1.5 px-2 py-1 rounded-full backdrop-blur-sm text-xs ${
            hasUpperLeft ? 'bg-primary/20 text-primary font-medium' : 'bg-dark/10 text-muted'
          }`}>
            <div className={`w-2 h-2 rounded-full ${hasUpperLeft ? 'bg-primary' : 'bg-muted/30'}`} />
            UL
          </div>
          <div className={`flex items-center gap-1.5 px-2 py-1 rounded-full backdrop-blur-sm text-xs ${
            hasUpperRight ? 'bg-primary/20 text-primary font-medium' : 'bg-dark/10 text-muted'
          }`}>
            UR
            <div className={`w-2 h-2 rounded-full ${hasUpperRight ? 'bg-primary' : 'bg-muted/30'}`} />
          </div>
        </div>
        <div className="flex items-center gap-2">
          {/* Lower zones */}
          <div className={`flex items-center gap-1.5 px-2 py-1 rounded-full backdrop-blur-sm text-xs ${
            hasLowerLeft ? 'bg-primary/20 text-primary font-medium' : 'bg-dark/10 text-muted'
          }`}>
            <div className={`w-2 h-2 rounded-full ${hasLowerLeft ? 'bg-primary' : 'bg-muted/30'}`} />
            LL
          </div>
          <div className={`flex items-center gap-1.5 px-2 py-1 rounded-full backdrop-blur-sm text-xs ${
            hasLowerRight ? 'bg-primary/20 text-primary font-medium' : 'bg-dark/10 text-muted'
          }`}>
            LR
            <div className={`w-2 h-2 rounded-full ${hasLowerRight ? 'bg-primary' : 'bg-muted/30'}`} />
          </div>
        </div>
      </div>

      {/* Phase indicator overlay */}
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

      {/* Instruction hint */}
      <div className="absolute top-3 right-3">
        <div className="px-3 py-1.5 rounded-full bg-white/70 backdrop-blur-sm text-xs text-muted">
          Drag to rotate view
        </div>
      </div>
    </div>
  );
}
