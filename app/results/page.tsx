"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import {
  Ruler, MapPin, ArrowLeftRight, Target, Dumbbell,
  ChevronDown, ChevronUp, RotateCcw, AlertCircle,
  Bone, Clock, LucideIcon
} from "lucide-react";

// Types matching backend schema
interface Keypoint {
  x: number;
  y: number;
  confidence: number;
}

interface Vertebra {
  index: number;
  label: string;
  bounding_box: number[];
  keypoints: Keypoint[];
  confidence: number;
  tilt_angle: number;
}

interface CobbAngleMeasurement {
  angle: number;
  upper_vertebra: string;
  lower_vertebra: string;
  apex_vertebra: string;
  curve_location: string;
  curve_direction: string;
}

interface Exercise {
  id: string;
  name: string;
  description: string;
  target_area: string;
  schroth_types: string[];
  duration: string;
  repetitions: string;
  difficulty: string;
  instructions: string[];
}

interface AnalysisResult {
  success: boolean;
  image_id: string;
  vertebrae: Vertebra[];
  total_vertebrae_detected: number;
  cobb_angles: CobbAngleMeasurement[];
  primary_cobb_angle: number;
  curve_location: string;
  curve_direction: string;
  schroth_type: string;
  severity: string;
  annotated_image: string;
  exercises: Exercise[];
  confidence_score: number;
  processing_time_ms: number;
}

// Stat Card Component
function StatCard({
  icon: Icon,
  label,
  value,
  subtext,
  severity
}: {
  icon: LucideIcon;
  label: string;
  value: string;
  subtext?: string;
  severity?: string;
}) {
  const severityColor: Record<string, string> = {
    mild: "text-primary",
    moderate: "text-yellow-600",
    severe: "text-orange-500",
    very_severe: "text-red-500"
  };

  return (
    <div className="glass-subtle p-4 space-y-2">
      <div className="flex items-center gap-2 text-muted">
        <Icon size={16} />
        <span className="text-xs">{label}</span>
      </div>
      <p className={`text-2xl font-semibold ${severity ? severityColor[severity] || "text-dark" : "text-dark"}`}>
        {value}
      </p>
      {subtext && (
        <p className="text-xs text-muted capitalize">{subtext}</p>
      )}
    </div>
  );
}

// Exercise Card Component
function ExerciseCard({
  exercise,
  isExpanded,
  onToggle
}: {
  exercise: Exercise;
  isExpanded: boolean;
  onToggle: () => void;
}) {
  return (
    <div className="glass p-4 space-y-3">
      <button
        onClick={onToggle}
        className="w-full flex items-center justify-between"
      >
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-[12px] bg-primary/10 flex items-center justify-center">
            <Dumbbell size={18} className="text-primary" />
          </div>
          <div className="text-left">
            <p className="font-medium text-dark">{exercise.name}</p>
            <p className="text-xs text-muted">
              {exercise.duration} · {exercise.repetitions}
            </p>
          </div>
        </div>
        {isExpanded ? (
          <ChevronUp size={20} className="text-muted" />
        ) : (
          <ChevronDown size={20} className="text-muted" />
        )}
      </button>

      {isExpanded && (
        <div className="pt-3 border-t border-primary/10 space-y-3">
          <p className="text-sm text-muted">{exercise.description}</p>
          <div className="space-y-2">
            <p className="text-xs font-medium text-dark">Instructions:</p>
            <ol className="list-decimal list-inside space-y-1">
              {exercise.instructions.map((step, i) => (
                <li key={i} className="text-sm text-muted">{step}</li>
              ))}
            </ol>
          </div>
          <div className="flex gap-2 pt-2">
            <span className="px-3 py-1 rounded-full bg-primary/10 text-primary text-xs capitalize">
              {exercise.target_area.replace("_", " ")}
            </span>
            <span className="px-3 py-1 rounded-full bg-dark/5 text-dark text-xs capitalize">
              {exercise.difficulty}
            </span>
          </div>
        </div>
      )}
    </div>
  );
}

// Format helpers
function formatLocation(location: string): string {
  const map: Record<string, string> = {
    thoracic: "Thoracic",
    lumbar: "Lumbar",
    thoracolumbar: "Thoraco-lumbar"
  };
  return map[location] || location;
}

function formatDirection(direction: string): string {
  const map: Record<string, string> = {
    left: "Left",
    right: "Right",
    none: "None"
  };
  return map[direction] || direction;
}

function formatSeverity(severity: string): string {
  const map: Record<string, string> = {
    mild: "Mild",
    moderate: "Moderate",
    severe: "Severe",
    very_severe: "Very Severe"
  };
  return map[severity] || severity;
}

export default function ResultsPage() {
  const router = useRouter();
  const [result, setResult] = useState<AnalysisResult | null>(null);
  const [activeTab, setActiveTab] = useState<"overview" | "details" | "exercises">("overview");
  const [expandedExercise, setExpandedExercise] = useState<string | null>(null);

  useEffect(() => {
    // Load results from sessionStorage
    const stored = sessionStorage.getItem("analysisResults");
    if (stored) {
      setResult(JSON.parse(stored));
    } else {
      // No results, redirect to home
      router.push("/");
    }
  }, [router]);

  if (!result) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center space-y-4">
          <div className="w-12 h-12 mx-auto rounded-full bg-primary/10 flex items-center justify-center animate-pulse">
            <Bone size={24} className="text-primary" />
          </div>
          <p className="text-muted">Loading results...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen px-4 py-8">
      <div className="max-w-4xl mx-auto space-y-6">
        {/* Header */}
        <header className="flex items-center justify-between">
          <button
            onClick={() => {
              sessionStorage.removeItem("analysisResults");
              router.push("/");
            }}
            className="btn btn-ghost"
          >
            <RotateCcw size={18} />
            New Analysis
          </button>
          <div className="flex items-center gap-2 text-xs text-muted">
            <Clock size={14} />
            Analyzed in {result.processing_time_ms.toFixed(0)}ms
          </div>
        </header>

        {/* Main Results Card */}
        <div className="glass p-6 space-y-6">
          {/* X-ray with Skeleton Overlay */}
          <div className="relative rounded-[16px] overflow-hidden bg-dark/5">
            <img
              src={result.annotated_image}
              alt="Analyzed X-ray with spine overlay"
              className="w-full h-auto max-h-[500px] object-contain mx-auto"
            />
            {/* Legend */}
            <div className="absolute bottom-4 left-4 glass-subtle p-3 text-xs space-y-1">
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 rounded-full bg-primary" />
                <span className="text-dark">Vertebrae ({result.total_vertebrae_detected})</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 rounded-full bg-orange-500" />
                <span className="text-dark">Cobb Angle Lines</span>
              </div>
            </div>
          </div>

          {/* Summary Stats Grid */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <StatCard
              icon={Ruler}
              label="Cobb Angle"
              value={`${result.primary_cobb_angle}°`}
              subtext={formatSeverity(result.severity)}
              severity={result.severity}
            />
            <StatCard
              icon={MapPin}
              label="Curve Location"
              value={formatLocation(result.curve_location)}
            />
            <StatCard
              icon={ArrowLeftRight}
              label="Direction"
              value={formatDirection(result.curve_direction)}
            />
            <StatCard
              icon={Target}
              label="Schroth Type"
              value={result.schroth_type}
            />
          </div>
        </div>

        {/* Tabs */}
        <div className="glass p-1 flex gap-1">
          {(["overview", "details", "exercises"] as const).map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`flex-1 py-3 px-4 rounded-[12px] text-sm font-medium transition-all ${
                activeTab === tab
                  ? "bg-primary text-white"
                  : "text-dark hover:bg-primary/10"
              }`}
            >
              {tab.charAt(0).toUpperCase() + tab.slice(1)}
            </button>
          ))}
        </div>

        {/* Tab Content */}
        {activeTab === "overview" && (
          <div className="space-y-4">
            <div className="glass p-6 space-y-4">
              <h3 className="text-lg font-medium text-dark">Analysis Summary</h3>
              <div className="space-y-3 text-sm text-muted leading-relaxed">
                <p>
                  Your X-ray shows a <span className="text-dark font-medium">{formatSeverity(result.severity).toLowerCase()}</span> scoliotic curve with a primary Cobb angle of <span className="text-dark font-medium">{result.primary_cobb_angle}°</span>.
                </p>
                <p>
                  The curve is located in the <span className="text-dark font-medium">{formatLocation(result.curve_location).toLowerCase()}</span> region with the convexity pointing to the <span className="text-dark font-medium">{formatDirection(result.curve_direction).toLowerCase()}</span>.
                </p>
                <p>
                  Based on the Schroth classification system, your curve pattern is identified as <span className="text-dark font-medium">Type {result.schroth_type}</span>, which helps determine the most effective exercises for your specific curve pattern.
                </p>
              </div>
            </div>

            {/* Severity Guide */}
            <div className="glass-subtle p-5">
              <p className="text-sm font-medium text-dark mb-3">Cobb Angle Reference</p>
              <div className="grid grid-cols-4 gap-2 text-center text-xs">
                <div className={`p-2 rounded-[8px] ${result.severity === "mild" ? "bg-primary/20" : "bg-dark/5"}`}>
                  <p className="font-medium text-primary">10-25°</p>
                  <p className="text-muted">Mild</p>
                </div>
                <div className={`p-2 rounded-[8px] ${result.severity === "moderate" ? "bg-yellow-100" : "bg-dark/5"}`}>
                  <p className="font-medium text-yellow-600">25-40°</p>
                  <p className="text-muted">Moderate</p>
                </div>
                <div className={`p-2 rounded-[8px] ${result.severity === "severe" ? "bg-orange-100" : "bg-dark/5"}`}>
                  <p className="font-medium text-orange-500">40-50°</p>
                  <p className="text-muted">Severe</p>
                </div>
                <div className={`p-2 rounded-[8px] ${result.severity === "very_severe" ? "bg-red-100" : "bg-dark/5"}`}>
                  <p className="font-medium text-red-500">&gt;50°</p>
                  <p className="text-muted">Very Severe</p>
                </div>
              </div>
            </div>
          </div>
        )}

        {activeTab === "details" && (
          <div className="space-y-4">
            {/* Cobb Angles */}
            <div className="glass p-6 space-y-4">
              <h3 className="text-lg font-medium text-dark">Cobb Angle Measurements</h3>
              {result.cobb_angles.length > 0 ? (
                <div className="space-y-3">
                  {result.cobb_angles.map((cobb, idx) => (
                    <div key={idx} className="glass-subtle p-4 flex items-center justify-between">
                      <div>
                        <p className="font-medium text-dark">{cobb.angle}°</p>
                        <p className="text-xs text-muted">
                          {cobb.upper_vertebra} to {cobb.lower_vertebra} · Apex: {cobb.apex_vertebra}
                        </p>
                      </div>
                      <div className="text-right">
                        <p className="text-sm text-dark capitalize">{formatLocation(cobb.curve_location)}</p>
                        <p className="text-xs text-muted capitalize">{formatDirection(cobb.curve_direction)} Convexity</p>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-sm text-muted">No significant curves detected (below 10° threshold).</p>
              )}
            </div>

            {/* Vertebrae Detection */}
            <div className="glass p-6 space-y-4">
              <h3 className="text-lg font-medium text-dark">Vertebrae Detection</h3>
              <div className="flex items-center gap-4">
                <div className="glass-subtle px-4 py-3">
                  <p className="text-2xl font-semibold text-primary">{result.total_vertebrae_detected}</p>
                  <p className="text-xs text-muted">Vertebrae Detected</p>
                </div>
                <div className="glass-subtle px-4 py-3">
                  <p className="text-2xl font-semibold text-dark">{(result.confidence_score * 100).toFixed(0)}%</p>
                  <p className="text-xs text-muted">Confidence Score</p>
                </div>
              </div>
              <div className="flex flex-wrap gap-2">
                {result.vertebrae.map((v) => (
                  <span
                    key={v.index}
                    className="px-3 py-1 rounded-full bg-primary/10 text-primary text-xs font-medium"
                  >
                    {v.label}
                  </span>
                ))}
              </div>
            </div>
          </div>
        )}

        {activeTab === "exercises" && (
          <div className="space-y-4">
            {/* Schroth Info */}
            <div className="glass-subtle p-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-[12px] bg-primary/10 flex items-center justify-center">
                  <Target size={20} className="text-primary" />
                </div>
                <div>
                  <p className="text-sm font-medium text-dark">
                    Exercises for Type {result.schroth_type} Pattern
                  </p>
                  <p className="text-xs text-muted">
                    Personalized based on your curve classification
                  </p>
                </div>
              </div>
            </div>

            {/* Exercise List */}
            {result.exercises.map((exercise) => (
              <ExerciseCard
                key={exercise.id}
                exercise={exercise}
                isExpanded={expandedExercise === exercise.id}
                onToggle={() =>
                  setExpandedExercise(
                    expandedExercise === exercise.id ? null : exercise.id
                  )
                }
              />
            ))}
          </div>
        )}

        {/* Disclaimer */}
        <div className="glass-subtle p-4 flex gap-3">
          <AlertCircle size={20} className="text-muted flex-shrink-0 mt-0.5" />
          <p className="text-xs text-muted leading-relaxed">
            This analysis is for informational purposes only and should not replace
            professional medical advice. Please consult with a qualified healthcare
            provider for diagnosis and treatment recommendations.
          </p>
        </div>
      </div>
    </div>
  );
}
