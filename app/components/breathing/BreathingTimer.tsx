"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { Play, Pause, RotateCcw, Settings, Minus, Plus } from "lucide-react";

export interface BreathingSettings {
  inhaleDuration: number;
  exhaleDuration: number;
  totalCycles: number;
}

export type BreathingPhase = "ready" | "inhale" | "exhale" | "complete";

interface BreathingTimerProps {
  settings: BreathingSettings;
  onSettingsChange: (settings: BreathingSettings) => void;
  onPhaseChange: (phase: BreathingPhase, progress: number) => void;
  isPlaying: boolean;
  onPlayPause: () => void;
  onReset: () => void;
  currentCycle: number;
  phase: BreathingPhase;
  phaseProgress: number;
}

export default function BreathingTimer({
  settings,
  onSettingsChange,
  onPhaseChange,
  isPlaying,
  onPlayPause,
  onReset,
  currentCycle,
  phase,
  phaseProgress,
}: BreathingTimerProps) {
  const [showSettings, setShowSettings] = useState(false);
  const timerRef = useRef<NodeJS.Timeout | null>(null);
  const startTimeRef = useRef<number>(0);
  const phaseStartTimeRef = useRef<number>(0);

  // Calculate total time
  const cycleDuration = settings.inhaleDuration + settings.exhaleDuration;
  const totalDuration = cycleDuration * settings.totalCycles;
  const elapsedCycles = currentCycle - 1;
  const currentPhaseTime =
    phase === "inhale"
      ? phaseProgress * settings.inhaleDuration
      : phase === "exhale"
      ? phaseProgress * settings.exhaleDuration
      : 0;
  const totalElapsed =
    elapsedCycles * cycleDuration +
    (phase === "exhale" ? settings.inhaleDuration : 0) +
    currentPhaseTime;

  // Calculate remaining time for current phase
  const phaseRemaining =
    phase === "inhale"
      ? settings.inhaleDuration * (1 - phaseProgress)
      : phase === "exhale"
      ? settings.exhaleDuration * (1 - phaseProgress)
      : 0;

  // Format time display
  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, "0")}`;
  };

  // Progress circle calculation
  const radius = 45;
  const circumference = 2 * Math.PI * radius;
  const progressOffset = circumference * (1 - phaseProgress);

  // Adjust setting values
  const adjustSetting = (
    key: keyof BreathingSettings,
    delta: number,
    min: number,
    max: number
  ) => {
    const newValue = Math.min(max, Math.max(min, settings[key] + delta));
    onSettingsChange({ ...settings, [key]: newValue });
  };

  return (
    <div className="space-y-4">
      {/* Main timer display */}
      <div className="flex items-center justify-center gap-8">
        {/* Circular progress */}
        <div className="relative">
          <svg width="120" height="120" className="transform -rotate-90">
            {/* Background circle */}
            <circle
              cx="60"
              cy="60"
              r={radius}
              fill="none"
              stroke="currentColor"
              strokeWidth="6"
              className="text-dark/10"
            />
            {/* Progress circle */}
            <circle
              cx="60"
              cy="60"
              r={radius}
              fill="none"
              stroke="currentColor"
              strokeWidth="6"
              strokeLinecap="round"
              strokeDasharray={circumference}
              strokeDashoffset={progressOffset}
              className={`transition-all duration-100 ${
                phase === "inhale"
                  ? "text-primary"
                  : phase === "exhale"
                  ? "text-primary-dark"
                  : "text-muted"
              }`}
            />
          </svg>
          {/* Center content */}
          <div className="absolute inset-0 flex flex-col items-center justify-center">
            <span
              className={`text-2xl font-semibold transition-colors duration-300 ${
                phase === "ready" || phase === "complete"
                  ? "text-muted"
                  : "text-dark"
              }`}
            >
              {phase === "ready"
                ? "Ready"
                : phase === "complete"
                ? "Done"
                : Math.ceil(phaseRemaining)}
            </span>
            {phase !== "ready" && phase !== "complete" && (
              <span className="text-xs text-muted uppercase tracking-wide">
                {phase}
              </span>
            )}
          </div>
        </div>

        {/* Stats */}
        <div className="space-y-3">
          <div className="text-center">
            <p className="text-sm text-muted">Cycle</p>
            <p className="text-xl font-medium text-dark">
              {currentCycle} <span className="text-muted">/ {settings.totalCycles}</span>
            </p>
          </div>
          <div className="text-center">
            <p className="text-sm text-muted">Time</p>
            <p className="text-xl font-medium text-dark">
              {formatTime(totalElapsed)}{" "}
              <span className="text-muted">/ {formatTime(totalDuration)}</span>
            </p>
          </div>
        </div>
      </div>

      {/* Phase indicator */}
      <div className="flex justify-center">
        <div
          className={`px-6 py-2 rounded-full text-sm font-medium transition-all duration-300 ${
            phase === "inhale"
              ? "bg-primary/10 text-primary"
              : phase === "exhale"
              ? "bg-dark/10 text-dark"
              : phase === "complete"
              ? "bg-primary/20 text-primary"
              : "bg-dark/5 text-muted"
          }`}
        >
          {phase === "ready" && "Press play to start"}
          {phase === "inhale" && "BREATHE IN"}
          {phase === "exhale" && "BREATHE OUT"}
          {phase === "complete" && "Session Complete"}
        </div>
      </div>

      {/* Controls */}
      <div className="flex items-center justify-center gap-3">
        <button
          onClick={onReset}
          className="p-3 rounded-[12px] bg-dark/5 hover:bg-dark/10 transition-all duration-200"
          title="Reset"
        >
          <RotateCcw size={20} className="text-dark" />
        </button>
        <button
          onClick={onPlayPause}
          className={`p-4 rounded-[16px] transition-all duration-200 ${
            isPlaying
              ? "bg-dark/10 hover:bg-dark/20"
              : "bg-primary hover:bg-primary-light"
          }`}
          title={isPlaying ? "Pause" : "Play"}
        >
          {isPlaying ? (
            <Pause size={24} className="text-dark" />
          ) : (
            <Play size={24} className="text-white" />
          )}
        </button>
        <button
          onClick={() => setShowSettings(!showSettings)}
          className={`p-3 rounded-[12px] transition-all duration-200 ${
            showSettings ? "bg-primary/10 text-primary" : "bg-dark/5 hover:bg-dark/10 text-dark"
          }`}
          title="Settings"
        >
          <Settings size={20} />
        </button>
      </div>

      {/* Settings panel */}
      {showSettings && (
        <div className="glass-subtle p-4 rounded-[16px] space-y-4">
          <h4 className="text-sm font-medium text-dark">Breathing Settings</h4>

          {/* Inhale duration */}
          <div className="flex items-center justify-between">
            <span className="text-sm text-muted">Inhale Duration</span>
            <div className="flex items-center gap-2">
              <button
                onClick={() => adjustSetting("inhaleDuration", -1, 2, 10)}
                className="p-1.5 rounded-[8px] bg-dark/5 hover:bg-dark/10 transition-all"
                disabled={settings.inhaleDuration <= 2}
              >
                <Minus size={14} className="text-dark" />
              </button>
              <span className="w-12 text-center font-medium text-dark">
                {settings.inhaleDuration}s
              </span>
              <button
                onClick={() => adjustSetting("inhaleDuration", 1, 2, 10)}
                className="p-1.5 rounded-[8px] bg-dark/5 hover:bg-dark/10 transition-all"
                disabled={settings.inhaleDuration >= 10}
              >
                <Plus size={14} className="text-dark" />
              </button>
            </div>
          </div>

          {/* Exhale duration */}
          <div className="flex items-center justify-between">
            <span className="text-sm text-muted">Exhale Duration</span>
            <div className="flex items-center gap-2">
              <button
                onClick={() => adjustSetting("exhaleDuration", -1, 2, 10)}
                className="p-1.5 rounded-[8px] bg-dark/5 hover:bg-dark/10 transition-all"
                disabled={settings.exhaleDuration <= 2}
              >
                <Minus size={14} className="text-dark" />
              </button>
              <span className="w-12 text-center font-medium text-dark">
                {settings.exhaleDuration}s
              </span>
              <button
                onClick={() => adjustSetting("exhaleDuration", 1, 2, 10)}
                className="p-1.5 rounded-[8px] bg-dark/5 hover:bg-dark/10 transition-all"
                disabled={settings.exhaleDuration >= 10}
              >
                <Plus size={14} className="text-dark" />
              </button>
            </div>
          </div>

          {/* Total cycles */}
          <div className="flex items-center justify-between">
            <span className="text-sm text-muted">Total Cycles</span>
            <div className="flex items-center gap-2">
              <button
                onClick={() => adjustSetting("totalCycles", -1, 3, 20)}
                className="p-1.5 rounded-[8px] bg-dark/5 hover:bg-dark/10 transition-all"
                disabled={settings.totalCycles <= 3}
              >
                <Minus size={14} className="text-dark" />
              </button>
              <span className="w-12 text-center font-medium text-dark">
                {settings.totalCycles}
              </span>
              <button
                onClick={() => adjustSetting("totalCycles", 1, 3, 20)}
                className="p-1.5 rounded-[8px] bg-dark/5 hover:bg-dark/10 transition-all"
                disabled={settings.totalCycles >= 20}
              >
                <Plus size={14} className="text-dark" />
              </button>
            </div>
          </div>

          {/* Duration preview */}
          <div className="pt-2 border-t border-dark/5">
            <p className="text-xs text-muted text-center">
              Total session: {formatTime(cycleDuration * settings.totalCycles)}
            </p>
          </div>
        </div>
      )}
    </div>
  );
}
