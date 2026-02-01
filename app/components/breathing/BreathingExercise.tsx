"use client";

import { useState, useEffect, useCallback, useMemo, useRef } from "react";
import { BookOpen, Activity, Camera, CameraOff } from "lucide-react";
import dynamic from "next/dynamic";
import TutorialMode from "./TutorialMode";
import CurveTypeDisplay from "./CurveTypeDisplay";
import BreathingTimer, {
  BreathingSettings,
  BreathingPhase,
} from "./BreathingTimer";
import BreathingInstructions from "./BreathingInstructions";
import CameraOverlay from "./CameraOverlay";
import {
  BREATHING_INSTRUCTIONS,
  getPhotoBasedInstructions,
  getInstructionsByCurveDirection,
  DEFAULT_BREATHING_SETTINGS,
  SchrothType,
  BreathingInstruction,
} from "@/app/lib/breathing-instructions";

// Dynamically import 3D visualizer to avoid SSR issues
const BreathingVisualizer3D = dynamic(() => import("./BreathingVisualizer3D"), {
  ssr: false,
  loading: () => (
    <div className="w-full h-[300px] rounded-[16px] bg-dark/5 flex items-center justify-center">
      <div className="text-muted text-sm">Loading 3D visualizer...</div>
    </div>
  ),
});

interface XrayAnalysisData {
  curve_location: string;
  curve_direction: string;
  schroth_type: SchrothType;
  severity: string;
  primary_cobb_angle: number;
}

interface PhotoAnalysisData {
  metrics?: {
    shoulder_height_diff_pct: number;
    hip_height_diff_pct: number;
    trunk_shift_pct: number;
    shoulder_rotation_score: number;
    hip_rotation_score: number;
    overall_asymmetry_score: number;
  };
  riskLevel?: "LOW" | "MEDIUM" | "HIGH";
}

interface BreathingExerciseProps {
  analysisType: "xray" | "photo" | null;
  xrayData?: XrayAnalysisData;
  photoData?: PhotoAnalysisData;
}

export default function BreathingExercise({
  analysisType,
  xrayData,
  photoData,
}: BreathingExerciseProps) {
  // Mode state
  const [mode, setMode] = useState<"tutorial" | "exercise">("tutorial");

  // Breathing state
  const [phase, setPhase] = useState<BreathingPhase>("ready");
  const [phaseProgress, setPhaseProgress] = useState(0);
  const [currentCycle, setCurrentCycle] = useState(1);
  const [isPlaying, setIsPlaying] = useState(false);
  const [settings, setSettings] = useState<BreathingSettings>({
    inhaleDuration: DEFAULT_BREATHING_SETTINGS.inhaleDuration,
    exhaleDuration: DEFAULT_BREATHING_SETTINGS.exhaleDuration,
    totalCycles: DEFAULT_BREATHING_SETTINGS.totalCycles,
  });

  // Camera state
  const [cameraEnabled, setCameraEnabled] = useState(false);

  // Timer refs
  const timerRef = useRef<NodeJS.Timeout | null>(null);
  const startTimeRef = useRef<number>(0);

  // Determine breathing instruction based on analysis data
  const instruction: BreathingInstruction = useMemo(() => {
    if (analysisType === "xray" && xrayData) {
      // First try to use Schroth type
      if (xrayData.schroth_type && BREATHING_INSTRUCTIONS[xrayData.schroth_type]) {
        return BREATHING_INSTRUCTIONS[xrayData.schroth_type];
      }
      // Fall back to curve direction
      if (xrayData.curve_location && xrayData.curve_direction) {
        return getInstructionsByCurveDirection(
          xrayData.curve_location as any,
          xrayData.curve_direction as any
        );
      }
    }

    if (analysisType === "photo" && photoData?.metrics) {
      // Determine higher shoulder from metrics
      const higherShoulder: "left" | "right" | undefined =
        photoData.metrics.shoulder_height_diff_pct > 0 ? "right" : "left";
      const trunkShiftDirection: "left" | "right" | undefined =
        photoData.metrics.trunk_shift_pct > 0 ? "right" : "left";

      return getPhotoBasedInstructions(higherShoulder, trunkShiftDirection);
    }

    // Default to 3C (most common pattern)
    return BREATHING_INSTRUCTIONS["3C"];
  }, [analysisType, xrayData, photoData]);

  // Get photo data for display
  const photoDisplayData = useMemo(() => {
    if (!photoData?.metrics) return undefined;
    return {
      higherShoulder:
        (photoData.metrics.shoulder_height_diff_pct > 0 ? "right" : "left") as
          | "left"
          | "right",
      trunkShiftDirection:
        (photoData.metrics.trunk_shift_pct > 0 ? "right" : "left") as
          | "left"
          | "right",
      shoulderRotation: photoData.metrics.shoulder_rotation_score,
      overallScore: photoData.metrics.overall_asymmetry_score,
    };
  }, [photoData]);

  // Timer logic
  const tick = useCallback(() => {
    if (!isPlaying) return;

    const now = Date.now();
    const elapsed = (now - startTimeRef.current) / 1000;

    if (phase === "inhale") {
      const progress = Math.min(elapsed / settings.inhaleDuration, 1);
      setPhaseProgress(progress);

      if (progress >= 1) {
        // Switch to exhale
        setPhase("exhale");
        setPhaseProgress(0);
        startTimeRef.current = now;
      }
    } else if (phase === "exhale") {
      const progress = Math.min(elapsed / settings.exhaleDuration, 1);
      setPhaseProgress(progress);

      if (progress >= 1) {
        // Check if more cycles
        if (currentCycle < settings.totalCycles) {
          setCurrentCycle((c) => c + 1);
          setPhase("inhale");
          setPhaseProgress(0);
          startTimeRef.current = now;
        } else {
          // Complete
          setPhase("complete");
          setIsPlaying(false);
        }
      }
    }
  }, [
    isPlaying,
    phase,
    settings.inhaleDuration,
    settings.exhaleDuration,
    currentCycle,
    settings.totalCycles,
  ]);

  // Start/stop timer
  useEffect(() => {
    if (isPlaying) {
      timerRef.current = setInterval(tick, 50); // 50ms for smooth animation
    } else {
      if (timerRef.current) {
        clearInterval(timerRef.current);
        timerRef.current = null;
      }
    }

    return () => {
      if (timerRef.current) {
        clearInterval(timerRef.current);
      }
    };
  }, [isPlaying, tick]);

  // Handle play/pause
  const handlePlayPause = useCallback(() => {
    if (isPlaying) {
      setIsPlaying(false);
    } else {
      if (phase === "ready" || phase === "complete") {
        // Start fresh
        setPhase("inhale");
        setPhaseProgress(0);
        setCurrentCycle(1);
      }
      startTimeRef.current = Date.now();
      setIsPlaying(true);
    }
  }, [isPlaying, phase]);

  // Handle reset
  const handleReset = useCallback(() => {
    setIsPlaying(false);
    setPhase("ready");
    setPhaseProgress(0);
    setCurrentCycle(1);
  }, []);

  // Handle settings change
  const handleSettingsChange = useCallback(
    (newSettings: BreathingSettings) => {
      setSettings(newSettings);
      // Reset if playing
      if (isPlaying) {
        handleReset();
      }
    },
    [isPlaying, handleReset]
  );

  // Handle phase change callback for timer
  const handlePhaseChange = useCallback(
    (newPhase: BreathingPhase, progress: number) => {
      setPhase(newPhase);
      setPhaseProgress(progress);
    },
    []
  );

  // Map phase to visualizer phase
  const visualizerPhase =
    phase === "ready" || phase === "complete"
      ? "rest"
      : (phase as "inhale" | "exhale");

  return (
    <div className="space-y-4">
      {/* Mode toggle */}
      <div className="flex items-center gap-2 p-1 rounded-[14px] bg-dark/5">
        <button
          onClick={() => setMode("tutorial")}
          className={`flex-1 flex items-center justify-center gap-2 py-2.5 rounded-[10px] text-sm font-medium transition-all duration-200 ${
            mode === "tutorial"
              ? "bg-white shadow-sm text-dark"
              : "text-muted hover:text-dark"
          }`}
        >
          <BookOpen size={16} />
          Tutorial
        </button>
        <button
          onClick={() => setMode("exercise")}
          className={`flex-1 flex items-center justify-center gap-2 py-2.5 rounded-[10px] text-sm font-medium transition-all duration-200 ${
            mode === "exercise"
              ? "bg-white shadow-sm text-dark"
              : "text-muted hover:text-dark"
          }`}
        >
          <Activity size={16} />
          Exercise
        </button>
      </div>

      {/* Tutorial Mode */}
      {mode === "tutorial" && (
        <TutorialMode onStartExercise={() => setMode("exercise")} />
      )}

      {/* Exercise Mode */}
      {mode === "exercise" && (
        <div className="space-y-4">
          {/* Curve type display */}
          <CurveTypeDisplay
            dataType={analysisType || "photo"}
            xrayData={xrayData}
            photoData={photoDisplayData}
            instruction={instruction}
          />

          {/* Main exercise area */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            {/* 3D Visualizer */}
            <div className="glass p-4 rounded-[20px]">
              <div className="flex items-center justify-between mb-3">
                <h3 className="font-medium text-dark">3D Visualization</h3>
                <button
                  onClick={() => setCameraEnabled(!cameraEnabled)}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs transition-all ${
                    cameraEnabled
                      ? "bg-primary/10 text-primary"
                      : "bg-dark/5 text-muted hover:bg-dark/10"
                  }`}
                >
                  {cameraEnabled ? (
                    <>
                      <CameraOff size={12} />
                      Hide Camera
                    </>
                  ) : (
                    <>
                      <Camera size={12} />
                      Show Camera
                    </>
                  )}
                </button>
              </div>

              {/* Visualizer and camera container */}
              <div
                className={`grid gap-3 ${
                  cameraEnabled ? "grid-cols-1 md:grid-cols-2" : "grid-cols-1"
                }`}
              >
                <div className="aspect-[4/5] max-h-[400px]">
                  <BreathingVisualizer3D
                    phase={visualizerPhase}
                    progress={phaseProgress}
                    highlightZones={instruction.visualization.highlightZones}
                    expansionArrows={instruction.visualization.expansionArrows}
                    derotationDirection={instruction.derotationDirection}
                  />
                </div>

                {cameraEnabled && (
                  <div className="aspect-[4/5] max-h-[400px]">
                    <CameraOverlay
                      enabled={cameraEnabled}
                      onToggle={() => setCameraEnabled(!cameraEnabled)}
                      expandSide={instruction.primaryZone.side}
                    />
                  </div>
                )}
              </div>
            </div>

            {/* Instructions and Timer */}
            <div className="space-y-4">
              {/* Instructions */}
              <div className="glass p-4 rounded-[20px]">
                <h3 className="font-medium text-dark mb-3">Instructions</h3>
                <BreathingInstructions
                  instruction={instruction}
                  phase={phase}
                />
              </div>

              {/* Timer */}
              <div className="glass p-4 rounded-[20px]">
                <h3 className="font-medium text-dark mb-3">Breathing Timer</h3>
                <BreathingTimer
                  settings={settings}
                  onSettingsChange={handleSettingsChange}
                  onPhaseChange={handlePhaseChange}
                  isPlaying={isPlaying}
                  onPlayPause={handlePlayPause}
                  onReset={handleReset}
                  currentCycle={currentCycle}
                  phase={phase}
                  phaseProgress={phaseProgress}
                />
              </div>
            </div>
          </div>

          {/* Tips */}
          <div className="glass-subtle p-4 rounded-[16px]">
            <h4 className="font-medium text-dark mb-2">Tips for This Exercise</h4>
            <ul className="space-y-1.5">
              {instruction.tips.map((tip, i) => (
                <li key={i} className="text-sm text-muted flex items-start gap-2">
                  <span className="text-primary">•</span>
                  {tip}
                </li>
              ))}
            </ul>
          </div>
        </div>
      )}
    </div>
  );
}
