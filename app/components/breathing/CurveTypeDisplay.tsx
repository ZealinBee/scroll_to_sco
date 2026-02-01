"use client";

import { Activity, MapPin, ArrowLeftRight, Target, AlertCircle, Camera, Layers } from "lucide-react";
import { SchrothType, BreathingInstruction, getZoneDescription, hasDualZones } from "@/app/lib/breathing-instructions";

interface XrayData {
  curve_location: string;
  curve_direction: string;
  schroth_type: SchrothType;
  severity: string;
  primary_cobb_angle: number;
}

interface PhotoData {
  higherShoulder?: "left" | "right";
  trunkShiftDirection?: "left" | "right";
  shoulderRotation?: number;
  overallScore?: number;
}

interface CurveTypeDisplayProps {
  dataType: "xray" | "photo";
  xrayData?: XrayData;
  photoData?: PhotoData;
  instruction: BreathingInstruction;
}

export default function CurveTypeDisplay({
  dataType,
  xrayData,
  photoData,
  instruction,
}: CurveTypeDisplayProps) {
  const isDualZone = hasDualZones(instruction);

  // Format helpers
  const formatLocation = (location: string) => {
    return location.charAt(0).toUpperCase() + location.slice(1);
  };

  const formatDirection = (direction: string) => {
    return direction.charAt(0).toUpperCase() + direction.slice(1);
  };

  // X-ray user display
  if (dataType === "xray" && xrayData) {
    return (
      <div className="glass-subtle p-4 rounded-[16px] space-y-4">
        {/* Header */}
        <div className="flex items-center gap-2">
          <div className="p-2 rounded-[10px] bg-primary/10">
            <Activity size={18} className="text-primary" />
          </div>
          <div>
            <h3 className="font-medium text-dark">Your Schroth Classification</h3>
            <p className="text-xs text-muted">Based on X-ray analysis</p>
          </div>
        </div>

        {/* Curve details */}
        <div className="grid grid-cols-2 gap-3">
          <div className="flex items-center gap-2 p-2 rounded-[10px] bg-dark/5">
            <Target size={14} className="text-muted" />
            <div>
              <p className="text-xs text-muted">Schroth Type</p>
              <p className="text-sm text-dark font-medium">{xrayData.schroth_type}</p>
            </div>
          </div>
          <div className="flex items-center gap-2 p-2 rounded-[10px] bg-dark/5">
            <MapPin size={14} className="text-muted" />
            <div>
              <p className="text-xs text-muted">Location</p>
              <p className="text-sm text-dark font-medium">
                {formatLocation(xrayData.curve_location)}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2 p-2 rounded-[10px] bg-dark/5">
            <ArrowLeftRight size={14} className="text-muted" />
            <div>
              <p className="text-xs text-muted">Convexity</p>
              <p className="text-sm text-dark font-medium">
                {formatDirection(xrayData.curve_direction)}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2 p-2 rounded-[10px] bg-dark/5">
            <Activity size={14} className="text-muted" />
            <div>
              <p className="text-xs text-muted">Cobb Angle</p>
              <p className="text-sm text-dark font-medium">
                {xrayData.primary_cobb_angle}°
              </p>
            </div>
          </div>
        </div>

        {/* Breathing focus - 3D specific */}
        <div className="p-3 rounded-[12px] bg-primary/5 border border-primary/20 space-y-2">
          <div className="flex items-center gap-2">
            <Layers size={14} className="text-primary" />
            <p className="text-sm font-medium text-primary">3D Breathing Focus</p>
          </div>

          {/* Primary zone */}
          <div className="pl-5 border-l-2 border-primary/30">
            <p className="text-xs text-muted">Primary Zone:</p>
            <p className="text-sm text-dark font-medium">
              {getZoneDescription(instruction.primaryZone)}
            </p>
          </div>

          {/* Secondary zone if applicable */}
          {instruction.secondaryZone && (
            <div className="pl-5 border-l-2 border-dark/20">
              <p className="text-xs text-muted">Secondary Zone:</p>
              <p className="text-sm text-dark font-medium">
                {getZoneDescription(instruction.secondaryZone)}
              </p>
            </div>
          )}

          {isDualZone && (
            <p className="text-xs text-primary italic mt-2">
              Dual-zone pattern: Expand BOTH zones simultaneously during inhale
            </p>
          )}
        </div>

        {/* Type description */}
        <p className="text-xs text-muted leading-relaxed">
          {instruction.description}
        </p>
      </div>
    );
  }

  // Photo user display
  if (dataType === "photo" && photoData) {
    return (
      <div className="glass-subtle p-4 rounded-[16px] space-y-4">
        {/* Header */}
        <div className="flex items-center gap-2">
          <div className="p-2 rounded-[10px] bg-primary/10">
            <Camera size={18} className="text-primary" />
          </div>
          <div>
            <h3 className="font-medium text-dark">Estimated Breathing Focus</h3>
            <p className="text-xs text-muted">Based on photo analysis</p>
          </div>
        </div>

        {/* Asymmetry indicators */}
        <div className="grid grid-cols-2 gap-3">
          {photoData.higherShoulder && (
            <div className="flex items-center gap-2 p-2 rounded-[10px] bg-dark/5">
              <ArrowLeftRight size={14} className="text-muted" />
              <div>
                <p className="text-xs text-muted">Higher Shoulder</p>
                <p className="text-sm text-dark font-medium capitalize">
                  {photoData.higherShoulder}
                </p>
              </div>
            </div>
          )}
          {photoData.trunkShiftDirection && (
            <div className="flex items-center gap-2 p-2 rounded-[10px] bg-dark/5">
              <Target size={14} className="text-muted" />
              <div>
                <p className="text-xs text-muted">Trunk Shift</p>
                <p className="text-sm text-dark font-medium capitalize">
                  {photoData.trunkShiftDirection}
                </p>
              </div>
            </div>
          )}
        </div>

        {/* Breathing focus */}
        <div className="p-3 rounded-[12px] bg-primary/5 border border-primary/20 space-y-2">
          <div className="flex items-center gap-2">
            <Layers size={14} className="text-primary" />
            <p className="text-sm font-medium text-primary">Estimated 3D Focus</p>
          </div>

          <div className="pl-5 border-l-2 border-primary/30">
            <p className="text-xs text-muted">Expand:</p>
            <p className="text-sm text-dark font-medium">
              {getZoneDescription(instruction.primaryZone)}
            </p>
          </div>
        </div>

        {/* Recommendation for X-ray */}
        <div className="flex items-start gap-2 p-3 rounded-[12px] bg-dark/5">
          <AlertCircle size={14} className="text-muted mt-0.5 flex-shrink-0" />
          <div className="space-y-1">
            <p className="text-xs text-dark font-medium">
              For Precise Dual-Zone Instructions
            </p>
            <p className="text-xs text-muted leading-relaxed">
              An X-ray analysis provides Schroth classification (3C, 3CP, 4C, 4CP) which
              determines if you need dual-zone breathing (upper + lower ribcage on different sides).
            </p>
          </div>
        </div>
      </div>
    );
  }

  // Fallback - no data
  return (
    <div className="glass-subtle p-4 rounded-[16px]">
      <div className="flex items-center gap-2 mb-3">
        <div className="p-2 rounded-[10px] bg-muted/10">
          <Activity size={18} className="text-muted" />
        </div>
        <div>
          <h3 className="font-medium text-dark">General Breathing Exercise</h3>
          <p className="text-xs text-muted">No analysis data available</p>
        </div>
      </div>
      <p className="text-sm text-muted">
        Upload an X-ray or photo to receive personalized 3D breathing zone targeting
        based on your curve pattern.
      </p>
    </div>
  );
}
