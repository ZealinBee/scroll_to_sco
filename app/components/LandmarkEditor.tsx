"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import { Move, Check, X, RotateCcw, Info } from "lucide-react";

interface LandmarkPoint {
  id: string;
  label: string;
  x: number; // 0-1 normalized
  y: number; // 0-1 normalized
  color: string;
  description: string;
}

interface LandmarkEditorProps {
  imageUrl: string;
  initialLandmarks: LandmarkPoint[];
  onSave: (landmarks: LandmarkPoint[]) => void;
  onCancel: () => void;
  isSaving?: boolean;
}

export default function LandmarkEditor({
  imageUrl,
  initialLandmarks,
  onSave,
  onCancel,
  isSaving = false,
}: LandmarkEditorProps) {
  const [landmarks, setLandmarks] = useState<LandmarkPoint[]>(initialLandmarks);
  const [selectedLandmark, setSelectedLandmark] = useState<string | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const imageRef = useRef<HTMLImageElement>(null);

  // Get container dimensions for coordinate conversion
  const getContainerRect = useCallback(() => {
    if (!containerRef.current) return null;
    return containerRef.current.getBoundingClientRect();
  }, []);

  // Convert screen coordinates to normalized (0-1)
  const screenToNormalized = useCallback(
    (clientX: number, clientY: number): { x: number; y: number } | null => {
      const rect = getContainerRect();
      if (!rect) return null;

      const x = Math.max(0, Math.min(1, (clientX - rect.left) / rect.width));
      const y = Math.max(0, Math.min(1, (clientY - rect.top) / rect.height));
      return { x, y };
    },
    [getContainerRect]
  );

  // Handle mouse/touch move
  const handleMove = useCallback(
    (clientX: number, clientY: number) => {
      if (!isDragging || !selectedLandmark) return;

      const normalized = screenToNormalized(clientX, clientY);
      if (!normalized) return;

      setLandmarks((prev) =>
        prev.map((lm) =>
          lm.id === selectedLandmark ? { ...lm, x: normalized.x, y: normalized.y } : lm
        )
      );
    },
    [isDragging, selectedLandmark, screenToNormalized]
  );

  // Mouse events
  const handleMouseDown = (e: React.MouseEvent, id: string) => {
    e.preventDefault();
    e.stopPropagation();
    setSelectedLandmark(id);
    setIsDragging(true);
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (isDragging) {
      e.preventDefault();
    }
    handleMove(e.clientX, e.clientY);
  };

  const handleMouseUp = (e: React.MouseEvent) => {
    e.preventDefault();
    setIsDragging(false);
  };

  // Touch events
  const handleTouchStart = (e: React.TouchEvent, id: string) => {
    e.preventDefault();
    e.stopPropagation();
    setSelectedLandmark(id);
    setIsDragging(true);
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    if (isDragging) {
      e.preventDefault();
    }
    if (e.touches.length > 0) {
      handleMove(e.touches[0].clientX, e.touches[0].clientY);
    }
  };

  const handleTouchEnd = (e: React.TouchEvent) => {
    e.preventDefault();
    setIsDragging(false);
  };

  // Prevent context menu on long press
  const handleContextMenu = (e: React.MouseEvent) => {
    e.preventDefault();
  };

  // Reset to initial positions
  const handleReset = () => {
    setLandmarks(initialLandmarks);
    setSelectedLandmark(null);
  };

  // Group landmarks by type for the legend
  const landmarkGroups = {
    primary: landmarks.filter((lm) =>
      ["left_shoulder", "right_shoulder", "left_hip", "right_hip"].includes(lm.id)
    ),
    derived: landmarks.filter((lm) =>
      ["left_axilla", "right_axilla", "left_waist", "right_waist"].includes(lm.id)
    ),
  };

  return (
    <div className="space-y-4">
      {/* Instructions */}
      <div className="glass-subtle p-4 flex gap-3">
        <Info size={20} className="text-primary flex-shrink-0 mt-0.5" />
        <div>
          <p className="text-sm font-medium text-dark">Adjust Landmark Positions</p>
          <p className="text-xs text-muted leading-relaxed">
            Drag the landmark points to match your actual anatomy. The measurements will be
            recalculated based on your adjustments.
          </p>
        </div>
      </div>

      {/* Image with landmarks */}
      <div
        ref={containerRef}
        className="relative rounded-[16px] overflow-hidden bg-dark/5 cursor-crosshair select-none touch-none"
        style={{ userSelect: "none", WebkitUserSelect: "none" }}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onMouseLeave={handleMouseUp}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
        onContextMenu={handleContextMenu}
        onDragStart={(e) => e.preventDefault()}
      >
        <img
          ref={imageRef}
          src={imageUrl}
          alt="Back photo for landmark adjustment"
          className="w-full h-auto max-h-[500px] object-contain mx-auto pointer-events-none select-none"
          draggable={false}
          onDragStart={(e) => e.preventDefault()}
          style={{ userSelect: "none", WebkitUserSelect: "none", WebkitTouchCallout: "none" }}
        />

        {/* Landmark points */}
        {landmarks.map((landmark) => (
          <div
            key={landmark.id}
            className={`absolute transform -translate-x-1/2 -translate-y-1/2 cursor-grab active:cursor-grabbing group ${
              selectedLandmark === landmark.id ? "z-20" : "z-10"
            }`}
            style={{
              left: `${landmark.x * 100}%`,
              top: `${landmark.y * 100}%`,
            }}
            onMouseDown={(e) => handleMouseDown(e, landmark.id)}
            onTouchStart={(e) => handleTouchStart(e, landmark.id)}
          >
            {/* Invisible larger hit area for easier clicking */}
            <div className="absolute -inset-3" />

            {/* Tiny precise dot with crosshair */}
            <div className="relative">
              {/* Crosshair lines for precision */}
              <div
                className={`absolute w-[1px] h-2.5 -top-1 left-1/2 -translate-x-1/2 transition-opacity ${
                  selectedLandmark === landmark.id ? "opacity-80" : "opacity-40"
                }`}
                style={{ backgroundColor: landmark.color }}
              />
              <div
                className={`absolute h-[1px] w-2.5 top-1/2 -left-1 -translate-y-1/2 transition-opacity ${
                  selectedLandmark === landmark.id ? "opacity-80" : "opacity-40"
                }`}
                style={{ backgroundColor: landmark.color }}
              />
              {/* Center dot - tiny 4px */}
              <div
                className={`w-1 h-1 rounded-full transition-all ${
                  selectedLandmark === landmark.id
                    ? "ring-2 ring-white ring-offset-1"
                    : ""
                }`}
                style={{ backgroundColor: landmark.color }}
              />
            </div>

            {/* Label - show on hover or when selected */}
            <div
              className={`absolute left-2.5 top-1/2 -translate-y-1/2 px-1 py-0.5 rounded text-[7px] font-medium whitespace-nowrap transition-opacity ${
                selectedLandmark === landmark.id ? "opacity-100" : "opacity-0 group-hover:opacity-100"
              }`}
              style={{
                backgroundColor: landmark.color,
                color: "white",
              }}
            >
              {landmark.label}
            </div>
          </div>
        ))}

        {/* Connection lines between paired landmarks - thin for precision */}
        <svg className="absolute inset-0 w-full h-full pointer-events-none">
          {/* Shoulder line */}
          <line
            x1={`${(landmarks.find((l) => l.id === "left_shoulder")?.x ?? 0) * 100}%`}
            y1={`${(landmarks.find((l) => l.id === "left_shoulder")?.y ?? 0) * 100}%`}
            x2={`${(landmarks.find((l) => l.id === "right_shoulder")?.x ?? 0) * 100}%`}
            y2={`${(landmarks.find((l) => l.id === "right_shoulder")?.y ?? 0) * 100}%`}
            stroke="#3F9B61"
            strokeWidth="1"
            strokeDasharray="2 2"
            opacity="0.8"
          />
          {/* Axilla line */}
          <line
            x1={`${(landmarks.find((l) => l.id === "left_axilla")?.x ?? 0) * 100}%`}
            y1={`${(landmarks.find((l) => l.id === "left_axilla")?.y ?? 0) * 100}%`}
            x2={`${(landmarks.find((l) => l.id === "right_axilla")?.x ?? 0) * 100}%`}
            y2={`${(landmarks.find((l) => l.id === "right_axilla")?.y ?? 0) * 100}%`}
            stroke="#F59E0B"
            strokeWidth="1"
            strokeDasharray="2 2"
            opacity="0.8"
          />
          {/* Waist line */}
          <line
            x1={`${(landmarks.find((l) => l.id === "left_waist")?.x ?? 0) * 100}%`}
            y1={`${(landmarks.find((l) => l.id === "left_waist")?.y ?? 0) * 100}%`}
            x2={`${(landmarks.find((l) => l.id === "right_waist")?.x ?? 0) * 100}%`}
            y2={`${(landmarks.find((l) => l.id === "right_waist")?.y ?? 0) * 100}%`}
            stroke="#8B5CF6"
            strokeWidth="1"
            strokeDasharray="2 2"
            opacity="0.8"
          />
          {/* Hip line */}
          <line
            x1={`${(landmarks.find((l) => l.id === "left_hip")?.x ?? 0) * 100}%`}
            y1={`${(landmarks.find((l) => l.id === "left_hip")?.y ?? 0) * 100}%`}
            x2={`${(landmarks.find((l) => l.id === "right_hip")?.x ?? 0) * 100}%`}
            y2={`${(landmarks.find((l) => l.id === "right_hip")?.y ?? 0) * 100}%`}
            stroke="#3F9B61"
            strokeWidth="1"
            strokeDasharray="2 2"
            opacity="0.8"
          />
        </svg>
      </div>

      {/* Legend */}
      <div className="glass-subtle p-4 space-y-3">
        <p className="text-sm font-medium text-dark">Landmarks</p>
        <div className="grid grid-cols-2 gap-3 text-xs">
          <div>
            <p className="text-muted mb-1">Primary (detected)</p>
            {landmarkGroups.primary.map((lm) => (
              <div
                key={lm.id}
                className={`flex items-center gap-2 p-1 rounded cursor-pointer hover:bg-dark/5 ${
                  selectedLandmark === lm.id ? "bg-dark/10" : ""
                }`}
                onClick={() => setSelectedLandmark(lm.id)}
              >
                <div
                  className="w-1.5 h-1.5 rounded-full"
                  style={{ backgroundColor: lm.color }}
                />
                <span className="text-dark text-[11px]">{lm.label}</span>
              </div>
            ))}
          </div>
          <div>
            <p className="text-muted mb-1">Derived (estimated)</p>
            {landmarkGroups.derived.map((lm) => (
              <div
                key={lm.id}
                className={`flex items-center gap-2 p-1 rounded cursor-pointer hover:bg-dark/5 ${
                  selectedLandmark === lm.id ? "bg-dark/10" : ""
                }`}
                onClick={() => setSelectedLandmark(lm.id)}
              >
                <div
                  className="w-1.5 h-1.5 rounded-full"
                  style={{ backgroundColor: lm.color }}
                />
                <span className="text-dark text-[11px]">{lm.label}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Selected landmark info */}
      {selectedLandmark && (
        <div className="glass-subtle p-3 border-l-4 border-primary">
          <p className="text-sm font-medium text-dark">
            {landmarks.find((l) => l.id === selectedLandmark)?.label}
          </p>
          <p className="text-xs text-muted">
            {landmarks.find((l) => l.id === selectedLandmark)?.description}
          </p>
        </div>
      )}

      {/* Action buttons */}
      <div className="flex gap-3">
        <button onClick={handleReset} className="btn btn-ghost flex-1" disabled={isSaving}>
          <RotateCcw size={18} />
          Reset
        </button>
        <button onClick={onCancel} className="btn btn-secondary flex-1" disabled={isSaving}>
          <X size={18} />
          Cancel
        </button>
        <button
          onClick={() => onSave(landmarks)}
          className="btn btn-primary flex-1"
          disabled={isSaving}
        >
          {isSaving ? (
            <>
              <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              Saving...
            </>
          ) : (
            <>
              <Check size={18} />
              Apply Changes
            </>
          )}
        </button>
      </div>
    </div>
  );
}

// Default landmark configuration
export function createDefaultLandmarks(metrics: {
  left_shoulder: { x: number; y: number };
  right_shoulder: { x: number; y: number };
  left_hip: { x: number; y: number };
  right_hip: { x: number; y: number };
  left_axilla: { x: number; y: number };
  right_axilla: { x: number; y: number };
  left_waist: { x: number; y: number };
  right_waist: { x: number; y: number };
}): LandmarkPoint[] {
  return [
    {
      id: "left_shoulder",
      label: "L. Shoulder",
      x: metrics.left_shoulder.x,
      y: metrics.left_shoulder.y,
      color: "#3F9B61",
      description: "Left shoulder point - used for shoulder height difference calculation",
    },
    {
      id: "right_shoulder",
      label: "R. Shoulder",
      x: metrics.right_shoulder.x,
      y: metrics.right_shoulder.y,
      color: "#3F9B61",
      description: "Right shoulder point - used for shoulder height difference calculation",
    },
    {
      id: "left_axilla",
      label: "L. Axilla",
      x: metrics.left_axilla.x,
      y: metrics.left_axilla.y,
      color: "#F59E0B",
      description: "Left axillary fold (armpit) - HAI component, reflects torso asymmetry",
    },
    {
      id: "right_axilla",
      label: "R. Axilla",
      x: metrics.right_axilla.x,
      y: metrics.right_axilla.y,
      color: "#F59E0B",
      description: "Right axillary fold (armpit) - HAI component, reflects torso asymmetry",
    },
    {
      id: "left_waist",
      label: "L. Waist",
      x: metrics.left_waist.x,
      y: metrics.left_waist.y,
      color: "#8B5CF6",
      description: "Left waist crease - HAI component, key lumbar curve indicator",
    },
    {
      id: "right_waist",
      label: "R. Waist",
      x: metrics.right_waist.x,
      y: metrics.right_waist.y,
      color: "#8B5CF6",
      description: "Right waist crease - HAI component, key lumbar curve indicator",
    },
    {
      id: "left_hip",
      label: "L. Hip",
      x: metrics.left_hip.x,
      y: metrics.left_hip.y,
      color: "#3F9B61",
      description: "Left hip point - used for pelvic obliquity assessment",
    },
    {
      id: "right_hip",
      label: "R. Hip",
      x: metrics.right_hip.x,
      y: metrics.right_hip.y,
      color: "#3F9B61",
      description: "Right hip point - used for pelvic obliquity assessment",
    },
  ];
}
