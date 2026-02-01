"use client";

import { ArrowUp, ArrowDown, Wind, Info, MapPin } from "lucide-react";
import { BreathingInstruction, getZoneDescription, hasDualZones } from "@/app/lib/breathing-instructions";
import { BreathingPhase } from "./BreathingTimer";

interface BreathingInstructionsProps {
  instruction: BreathingInstruction;
  phase: BreathingPhase;
}

export default function BreathingInstructions({
  instruction,
  phase,
}: BreathingInstructionsProps) {
  const isDualZone = hasDualZones(instruction);

  return (
    <div className="space-y-4">
      {/* Zone information - 3D specific */}
      <div className="space-y-2">
        <div className="flex items-center gap-2 text-xs font-medium text-muted uppercase tracking-wide">
          <MapPin size={12} />
          Target Zones
        </div>

        {/* Primary zone */}
        <div className="p-3 rounded-[12px] bg-primary/10 border border-primary/20">
          <div className="flex items-center gap-2 mb-1">
            <span className="px-2 py-0.5 rounded-full bg-primary text-white text-xs font-medium">
              Primary
            </span>
          </div>
          <p className="text-sm font-medium text-dark">
            {getZoneDescription(instruction.primaryZone)}
          </p>
          <p className="text-xs text-muted mt-1">
            {instruction.primaryZone.description}
          </p>
        </div>

        {/* Secondary zone (for dual-zone patterns like 3CP, 4C, 4CP) */}
        {instruction.secondaryZone && (
          <div className="p-3 rounded-[12px] bg-dark/5 border border-dark/10">
            <div className="flex items-center gap-2 mb-1">
              <span className="px-2 py-0.5 rounded-full bg-dark/20 text-dark text-xs font-medium">
                Secondary
              </span>
            </div>
            <p className="text-sm font-medium text-dark">
              {getZoneDescription(instruction.secondaryZone)}
            </p>
            <p className="text-xs text-muted mt-1">
              {instruction.secondaryZone.description}
            </p>
          </div>
        )}

        {isDualZone && (
          <p className="text-xs text-primary italic">
            This is a DUAL-ZONE pattern. Both areas should expand simultaneously.
          </p>
        )}
      </div>

      {/* Main instruction card - STABLE, not cycling */}
      <div
        className={`glass-subtle p-4 rounded-[16px] transition-all duration-500 ${
          phase === "inhale"
            ? "border-l-4 border-primary"
            : phase === "exhale"
            ? "border-l-4 border-primary-dark"
            : ""
        }`}
      >
        {/* Phase header */}
        <div className="flex items-center gap-2 mb-3">
          {phase === "inhale" ? (
            <div className="p-2 rounded-[10px] bg-primary/10">
              <ArrowUp size={18} className="text-primary" />
            </div>
          ) : phase === "exhale" ? (
            <div className="p-2 rounded-[10px] bg-dark/10">
              <ArrowDown size={18} className="text-dark" />
            </div>
          ) : (
            <div className="p-2 rounded-[10px] bg-muted/10">
              <Wind size={18} className="text-muted" />
            </div>
          )}
          <div>
            <span
              className={`text-sm font-medium ${
                phase === "inhale"
                  ? "text-primary"
                  : phase === "exhale"
                  ? "text-dark"
                  : "text-muted"
              }`}
            >
              {phase === "ready" && "Get Ready"}
              {phase === "inhale" && "INHALE"}
              {phase === "exhale" && "EXHALE"}
              {phase === "complete" && "Complete"}
            </span>
          </div>
        </div>

        {/* SINGLE stable instruction for each phase - NOT cycling */}
        {phase === "ready" && (
          <div className="space-y-2">
            <p className="text-dark leading-relaxed">
              {instruction.positioningTip}
            </p>
            {isDualZone && (
              <p className="text-sm text-primary font-medium">
                You will be breathing into TWO zones simultaneously.
              </p>
            )}
          </div>
        )}

        {phase === "inhale" && (
          <p className="text-dark leading-relaxed">
            {instruction.inhaleInstruction}
          </p>
        )}

        {phase === "exhale" && (
          <p className="text-dark leading-relaxed">
            {instruction.exhaleInstruction}
          </p>
        )}

        {phase === "complete" && (
          <p className="text-dark leading-relaxed">
            Great job completing the breathing exercise. Practice daily for best results.
            Consistency is key for Schroth therapy effectiveness.
          </p>
        )}
      </div>

      {/* Hand placement reminder */}
      <div className="flex items-start gap-2 px-3 py-2 rounded-[12px] bg-dark/5">
        <Info size={14} className="text-muted mt-0.5 flex-shrink-0" />
        <p className="text-xs text-muted">
          <span className="font-medium">Hand Placement:</span>{" "}
          {instruction.positioningTip}
        </p>
      </div>
    </div>
  );
}
