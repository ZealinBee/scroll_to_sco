"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import {
  Dumbbell,
  Wind,
  Camera,
  MessageCircle,
  Calendar,
  Plus,
  ChevronDown,
  ChevronUp,
  Clock,
  Target,
  CheckCircle2,
  Play,
  RotateCcw,
  ArrowRight,
  Info,
  Settings,
  Youtube,
} from "lucide-react";
import {
  GamificationState,
  getOrInitializeState,
  saveGamificationState,
  markDayComplete,
  unmarkDayComplete,
  isTodayComplete,
  getWeekCompletionStatus,
  processWeekTransition,
} from "@/app/lib/gamification";
import { initializeNotifications } from "@/app/lib/notifications";
import { StreakDisplay } from "@/app/components/StreakDisplay";
import { WeeklyProgress } from "@/app/components/WeeklyProgress";
import { RoutineCompletionButton } from "@/app/components/RoutineCompletionButton";
import {
  Exercise,
  createAsymmetryProfile,
  getRecommendedExercises,
  getDailyRoutine,
  AsymmetryProfile,
  THRESHOLDS,
  TipWithExplanation as TipType,
} from "@/app/lib/exercises";
import { TipList } from "@/app/components/TipWithExplanation";
import InlineChat from "@/app/components/InlineChat";
import dynamic from "next/dynamic";
import { useAuth } from "@/app/components/AuthSyncProvider";

// Dynamically import BreathingExercise to avoid SSR issues with Three.js
const BreathingExercise = dynamic(
  () => import("@/app/components/breathing/BreathingExercise"),
  { ssr: false }
);

interface ProgressPhoto {
  id: string;
  image: string;
  date: string;
  notes?: string;
}

interface AnalysisData {
  metrics: {
    shoulder_height_diff_pct: number;
    hip_height_diff_pct: number;
    trunk_shift_pct: number;
    shoulder_rotation_score: number;
    hip_rotation_score: number;
    scapula_prominence_diff: number;
    waist_height_diff_pct: number;
    overall_asymmetry_score: number;
    higher_shoulder?: "left" | "right" | null;
    higher_hip?: "left" | "right" | null;
  };
  riskLevel: "LOW" | "MEDIUM" | "HIGH";
  riskFactors: string[];
  recommendations: string[];
  analyzedAt: string;
}

// Helper to extract YouTube video ID from URL
function getYouTubeVideoId(url: string): string | null {
  const patterns = [
    /(?:youtube\.com\/watch\?v=|youtu\.be\/|youtube\.com\/embed\/)([a-zA-Z0-9_-]{11})/,
    /youtube\.com\/watch\?.*v=([a-zA-Z0-9_-]{11})/,
  ];

  for (const pattern of patterns) {
    const match = url.match(pattern);
    if (match) return match[1];
  }
  return null;
}

// YouTube Embed Component
function YouTubeEmbed({ videoUrl }: { videoUrl: string }) {
  const videoId = getYouTubeVideoId(videoUrl);

  if (!videoId) return null;

  return (
    <div className="relative w-full rounded-[12px] overflow-hidden bg-dark/5">
      <div className="relative pt-[56.25%]">
        <iframe
          className="absolute inset-0 w-full h-full"
          src={`https://www.youtube.com/embed/${videoId}?rel=0&modestbranding=1`}
          title="Exercise demonstration"
          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
          allowFullScreen
        />
      </div>
    </div>
  );
}

// Helper to personalize exercise text based on user's asymmetry profile
function personalizeText(text: string, profile: AsymmetryProfile | null): string {
  if (!profile) return text;

  // For trunk shift:
  // - Convex side = side trunk shifts TOWARD (trunkShiftDirection)
  // - Concave side = side OPPOSITE to trunk shift
  const convexSide = profile.trunkShiftDirection || "right";
  const concaveSide = convexSide === "right" ? "left" : "right";

  let personalized = text;

  // Replace variations of "concave side" with actual side
  personalized = personalized.replace(
    /\b(the\s+)?concave\s+side(\s*\([^)]*\))?/gi,
    `your ${concaveSide} side`
  );
  personalized = personalized.replace(
    /\bon\s+the\s+concave\s+side/gi,
    `on your ${concaveSide} side`
  );

  // Replace variations of "convex side" with actual side
  personalized = personalized.replace(
    /\b(the\s+)?convex\s+side(\s*\([^)]*\))?/gi,
    `your ${convexSide} side`
  );
  personalized = personalized.replace(
    /\bon\s+the\s+convex\s+side/gi,
    `on your ${convexSide} side`
  );

  // Handle "your concave" without "side"
  personalized = personalized.replace(/your concave\b/gi, `your ${concaveSide}`);
  personalized = personalized.replace(/your convex\b/gi, `your ${convexSide}`);

  return personalized;
}

// Exercise Card Component
function ExerciseCard({
  exercise,
  isExpanded,
  onToggle,
  relevantFor,
  profile,
}: {
  exercise: Exercise;
  isExpanded: boolean;
  onToggle: () => void;
  relevantFor?: string[];
  profile?: AsymmetryProfile | null;
}) {
  const difficultyColor = {
    beginner: "bg-primary/10 text-primary",
    intermediate: "bg-yellow-100 text-yellow-700",
    advanced: "bg-orange-100 text-orange-700",
  };

  return (
    <div className="glass-subtle rounded-[16px] overflow-hidden">
      <button
        onClick={onToggle}
        className="w-full p-4 flex items-center justify-between text-left"
      >
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-[12px] bg-primary/10 flex items-center justify-center flex-shrink-0">
            <Dumbbell size={18} className="text-primary" />
          </div>
          <div>
            <p className="font-medium text-dark">{exercise.name}</p>
            <div className="flex items-center gap-2 mt-1">
              <span className="text-xs text-muted flex items-center gap-1">
                <Clock size={12} />
                {exercise.duration}
              </span>
              <span className="text-xs text-muted">·</span>
              <span className="text-xs text-muted">{exercise.repetitions}</span>
            </div>
          </div>
        </div>
        {isExpanded ? (
          <ChevronUp size={20} className="text-muted flex-shrink-0" />
        ) : (
          <ChevronDown size={20} className="text-muted flex-shrink-0" />
        )}
      </button>

      {isExpanded && (
        <div className="px-4 pb-4 space-y-4 border-t border-dark/5 pt-4">
          {/* Video Demo */}
          {exercise.videoUrl && (
            <div className="space-y-2">
              <p className="text-xs font-medium text-dark flex items-center gap-1.5">
                <Youtube size={14} className="text-red-500" />
                Video Demonstration
              </p>
              <YouTubeEmbed videoUrl={exercise.videoUrl} />
            </div>
          )}

          {/* Description */}
          <p className="text-sm text-muted leading-relaxed">
            {personalizeText(exercise.description, profile || null)}
          </p>

          {/* Why this exercise */}
          {relevantFor && relevantFor.length > 0 && (
            <div className="bg-primary/5 rounded-[12px] p-3 space-y-2">
              <p className="text-xs font-medium text-primary flex items-center gap-1.5">
                <Target size={14} />
                Why this exercise for you
              </p>
              <ul className="space-y-1">
                {relevantFor.map((reason, i) => (
                  <li key={i} className="text-xs text-dark flex items-start gap-2">
                    <CheckCircle2 size={12} className="text-primary mt-0.5 flex-shrink-0" />
                    {reason}
                  </li>
                ))}
              </ul>
            </div>
          )}

          {/* Instructions */}
          <div className="space-y-2">
            <p className="text-xs font-medium text-dark">Instructions</p>
            <ol className="space-y-2">
              {exercise.instructions.map((step, i) => (
                <li key={i} className="flex gap-3 text-sm text-muted">
                  <span className="w-5 h-5 rounded-full bg-dark/5 flex items-center justify-center flex-shrink-0 text-xs text-dark font-medium">
                    {i + 1}
                  </span>
                  <span className="leading-relaxed">{personalizeText(step, profile || null)}</span>
                </li>
              ))}
            </ol>
          </div>

          {/* Tips */}
          {exercise.tips.length > 0 && (
            <div className="space-y-2">
              <p className="text-xs font-medium text-dark">Tips</p>
              <TipList tips={exercise.tips} />
            </div>
          )}

          {/* Meta info */}
          <div className="flex flex-wrap gap-2 pt-2">
            <span className={`px-3 py-1 rounded-full text-xs capitalize ${difficultyColor[exercise.difficulty]}`}>
              {exercise.difficulty}
            </span>
            <span className="px-3 py-1 rounded-full bg-dark/5 text-dark text-xs">
              {exercise.frequency}
            </span>
            {exercise.targetAreas.slice(0, 2).map((area) => (
              <span key={area} className="px-3 py-1 rounded-full bg-dark/5 text-muted text-xs">
                {area}
              </span>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

// Findings Summary Component
function FindingsSummary({ profile }: { profile: AsymmetryProfile }) {
  const findings: { label: string; value: number; threshold: number; unit: string; severity: string; sideInfo?: string; displayValue?: string }[] = [];

  if (profile.shoulderHeightDiff >= THRESHOLDS.shoulderHeight.mild) {
    const side = profile.higherShoulder;
    findings.push({
      label: "Shoulder height difference",
      value: profile.shoulderHeightDiff,
      threshold: THRESHOLDS.shoulderHeight.moderate,
      unit: "%",
      severity: profile.shoulderHeightDiff >= THRESHOLDS.shoulderHeight.significant ? "significant" :
               profile.shoulderHeightDiff >= THRESHOLDS.shoulderHeight.moderate ? "moderate" : "mild",
      sideInfo: side ? `${side.charAt(0).toUpperCase() + side.slice(1)} shoulder higher` : undefined
    });
  }

  if (profile.hipHeightDiff >= THRESHOLDS.hipHeight.mild) {
    const side = profile.higherHip;
    findings.push({
      label: "Hip height difference",
      value: profile.hipHeightDiff,
      threshold: THRESHOLDS.hipHeight.moderate,
      unit: "%",
      severity: profile.hipHeightDiff >= THRESHOLDS.hipHeight.significant ? "significant" :
               profile.hipHeightDiff >= THRESHOLDS.hipHeight.moderate ? "moderate" : "mild",
      sideInfo: side ? `${side.charAt(0).toUpperCase() + side.slice(1)} hip higher` : undefined
    });
  }

  if (profile.trunkShift >= THRESHOLDS.trunkShift.mild) {
    findings.push({
      label: "Trunk shift",
      value: profile.trunkShift,
      threshold: THRESHOLDS.trunkShift.moderate,
      unit: "%",
      severity: profile.trunkShift >= THRESHOLDS.trunkShift.significant ? "significant" :
               profile.trunkShift >= THRESHOLDS.trunkShift.moderate ? "moderate" : "mild"
    });
  }

  if (profile.shoulderRotation >= THRESHOLDS.rotation.mild) {
    const severity = profile.shoulderRotation >= THRESHOLDS.rotation.significant ? "significant" :
                     profile.shoulderRotation >= THRESHOLDS.rotation.moderate ? "moderate" : "mild";
    const severityLabel = severity === "significant" ? "Significant" : severity === "moderate" ? "Moderate" : "Mild";
    findings.push({
      label: "Shoulder rotation",
      value: profile.shoulderRotation * 100,
      threshold: THRESHOLDS.rotation.moderate * 100,
      unit: "",
      severity,
      displayValue: `${severityLabel} asymmetry`,
      sideInfo: "One shoulder rotates forward"
    });
  }

  if (profile.scapulaProminence >= THRESHOLDS.scapula.mild) {
    findings.push({
      label: "Scapula prominence",
      value: profile.scapulaProminence,
      threshold: THRESHOLDS.scapula.moderate,
      unit: "mm",
      severity: profile.scapulaProminence >= THRESHOLDS.scapula.significant ? "significant" :
               profile.scapulaProminence >= THRESHOLDS.scapula.moderate ? "moderate" : "mild"
    });
  }

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case "significant": return "text-red-500 bg-red-50";
      case "moderate": return "text-yellow-600 bg-yellow-50";
      default: return "text-primary bg-primary/10";
    }
  };

  if (findings.length === 0) {
    return (
      <div className="glass-subtle p-4 flex items-center gap-3">
        <CheckCircle2 size={20} className="text-primary" />
        <p className="text-sm text-dark">
          Your measurements are within normal range. These exercises will help maintain good posture.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      <p className="text-xs font-medium text-muted">Your exercises target these findings:</p>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
        {findings.map((finding) => (
          <div key={finding.label} className={`rounded-[12px] p-3 ${getSeverityColor(finding.severity)}`}>
            <p className="text-xs font-medium">{finding.label}</p>
            <p className="text-lg font-semibold">
              {finding.displayValue ?? `${finding.value.toFixed(1)}${finding.unit}`}
            </p>
            {finding.sideInfo && (
              <p className="text-xs mt-1 opacity-80">{finding.sideInfo}</p>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}

// Interface for X-ray analysis data
interface XrayAnalysisData {
  curve_location: string;
  curve_direction: string;
  schroth_type: "3C" | "3CP" | "4C" | "4CP";
  severity: string;
  primary_cobb_angle: number;
}

interface UserProfile {
  exerciseMinutesPerSession?: number;
}

export default function JourneyPage() {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<"exercises" | "breathing" | "progress" | "chat">("exercises");
  const [progressPhotos, setProgressPhotos] = useState<ProgressPhoto[]>([]);
  const [analysisData, setAnalysisData] = useState<AnalysisData | null>(null);
  const [asymmetryProfile, setAsymmetryProfile] = useState<AsymmetryProfile | null>(null);
  const [recommendedExercises, setRecommendedExercises] = useState<Exercise[]>([]);
  const [expandedExercise, setExpandedExercise] = useState<string | null>(null);
  const [showRoutine, setShowRoutine] = useState(true);
  const [analysisType, setAnalysisType] = useState<"xray" | "photo" | null>(null);
  const [xrayData, setXrayData] = useState<XrayAnalysisData | null>(null);
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  const [gamificationState, setGamificationState] = useState<GamificationState | null>(null);
  const { user } = useAuth();

  // Load data on mount
  useEffect(() => {
    // Load progress photos
    const storedPhotos = localStorage.getItem("progressPhotos");
    if (storedPhotos) {
      setProgressPhotos(JSON.parse(storedPhotos));
    }

    // Load user profile for duration preference
    const storedProfile = localStorage.getItem("userProfile");
    let goalDays = 4; // default
    if (storedProfile) {
      try {
        const profile = JSON.parse(storedProfile);
        setUserProfile({
          exerciseMinutesPerSession: profile.exerciseMinutesPerSession,
        });
        goalDays = profile.exerciseDaysPerWeek || 4;
      } catch (e) {
        console.error("Failed to parse user profile:", e);
      }
    }

    // Initialize gamification state
    const gState = getOrInitializeState(goalDays);
    // Process any week transitions
    const processedState = processWeekTransition(gState);
    setGamificationState(processedState);
    saveGamificationState(processedState);

    // Initialize notifications
    initializeNotifications(processedState.notifications);

    // Check analysis type from sessionStorage
    const storedType = sessionStorage.getItem("analysisType");
    if (storedType === "xray" || storedType === "photo") {
      setAnalysisType(storedType);
    }

    // Load X-ray data if available
    const storedXray = sessionStorage.getItem("xrayAnalysis");
    let hasXrayData = false;
    if (storedXray) {
      try {
        const xray = JSON.parse(storedXray);
        setXrayData({
          curve_location: xray.curve_location,
          curve_direction: xray.curve_direction,
          schroth_type: xray.schroth_type,
          severity: xray.severity,
          primary_cobb_angle: xray.primary_cobb_angle,
        });
        setAnalysisType("xray");
        hasXrayData = true;

        // Create synthetic asymmetry profile from X-ray data for exercise recommendations
        // Map Schroth type and severity to approximate asymmetry metrics
        const severityMultiplier = xray.severity === "severe" ? 1.5 :
                                   xray.severity === "moderate" ? 1.0 : 0.6;
        const cobbAngle = xray.primary_cobb_angle || 15;

        // Generate estimated asymmetry based on curve location and Schroth type
        const isThoracic = xray.curve_location?.toLowerCase().includes("thoracic");
        const isLumbar = xray.curve_location?.toLowerCase().includes("lumbar");

        const syntheticMetrics = {
          shoulder_height_diff_pct: isThoracic ? cobbAngle * 0.3 * severityMultiplier : cobbAngle * 0.15 * severityMultiplier,
          hip_height_diff_pct: isLumbar ? cobbAngle * 0.25 * severityMultiplier : cobbAngle * 0.1 * severityMultiplier,
          trunk_shift_pct: cobbAngle * 0.2 * severityMultiplier,
          shoulder_rotation_score: isThoracic ? 0.3 * severityMultiplier : 0.15 * severityMultiplier,
          hip_rotation_score: isLumbar ? 0.25 * severityMultiplier : 0.1 * severityMultiplier,
          scapula_prominence_diff: isThoracic ? 8 * severityMultiplier : 4 * severityMultiplier,
          waist_height_diff_pct: isLumbar ? cobbAngle * 0.3 * severityMultiplier : cobbAngle * 0.15 * severityMultiplier,
          overall_asymmetry_score: cobbAngle * 2 * severityMultiplier,
        };

        const riskLevel = xray.severity === "severe" ? "HIGH" :
                         xray.severity === "moderate" ? "MEDIUM" : "LOW";

        const profile = createAsymmetryProfile(syntheticMetrics, riskLevel);
        setAsymmetryProfile(profile);

        const exercises = getRecommendedExercises(profile);
        setRecommendedExercises(exercises);
      } catch (e) {
        console.error("Failed to parse X-ray data:", e);
      }
    }

    // Load photo analysis data (override X-ray profile if both exist)
    const storedAnalysis = localStorage.getItem("analysisData");
    if (storedAnalysis) {
      const data: AnalysisData = JSON.parse(storedAnalysis);
      setAnalysisData(data);

      // Create asymmetry profile and get recommendations
      const profile = createAsymmetryProfile(data.metrics, data.riskLevel);
      setAsymmetryProfile(profile);

      const exercises = getRecommendedExercises(profile);
      setRecommendedExercises(exercises);

      // Set analysis type to photo if not already xray
      if (!hasXrayData) {
        setAnalysisType("photo");
      }
    }
  }, []);


  // Get daily routine with user's preferred duration
  const dailyRoutine = asymmetryProfile
    ? getDailyRoutine(asymmetryProfile, userProfile?.exerciseMinutesPerSession)
    : null;

  // Get relevance reasons for an exercise
  const getRelevanceReasons = (exercise: Exercise): string[] => {
    if (!asymmetryProfile) return [];
    const reasons: string[] = [];

    for (const targetType of exercise.targetAsymmetries) {
      switch (targetType) {
        case "shoulder_height":
          if (asymmetryProfile.shoulderHeightDiff >= THRESHOLDS.shoulderHeight.mild) {
            reasons.push(`Helps correct ${asymmetryProfile.shoulderHeightDiff.toFixed(1)}% shoulder height difference`);
          }
          break;
        case "hip_height":
          if (asymmetryProfile.hipHeightDiff >= THRESHOLDS.hipHeight.mild) {
            reasons.push(`Addresses ${asymmetryProfile.hipHeightDiff.toFixed(1)}% hip height asymmetry`);
          }
          break;
        case "trunk_shift":
          if (asymmetryProfile.trunkShift >= THRESHOLDS.trunkShift.mild) {
            reasons.push(`Corrects ${asymmetryProfile.trunkShift.toFixed(1)}% lateral trunk shift`);
          }
          break;
        case "shoulder_rotation":
          if (asymmetryProfile.shoulderRotation >= THRESHOLDS.rotation.mild) {
            reasons.push("Improves shoulder rotation symmetry");
          }
          break;
        case "scapula_prominence":
          if (asymmetryProfile.scapulaProminence >= THRESHOLDS.scapula.mild) {
            reasons.push("Reduces scapular prominence (winging)");
          }
          break;
        case "hip_rotation":
          if (asymmetryProfile.hipRotation >= THRESHOLDS.rotation.mild) {
            reasons.push("Addresses hip rotation asymmetry");
          }
          break;
        case "waist_asymmetry":
          if (asymmetryProfile.waistAsymmetry >= THRESHOLDS.waist.mild) {
            reasons.push("Improves waist symmetry");
          }
          break;
      }
    }

    return reasons;
  };

  const tabs = [
    { id: "exercises" as const, label: "Exercises", icon: Dumbbell },
    { id: "breathing" as const, label: "Breathing", icon: Wind },
    { id: "progress" as const, label: "Progress", icon: Camera },
    { id: "chat" as const, label: "AI Chat", icon: MessageCircle },
  ];

  // Handle toggling today's completion
  const handleToggleCompletion = () => {
    if (!gamificationState) return;

    let newState: GamificationState;
    if (isTodayComplete(gamificationState)) {
      newState = unmarkDayComplete(gamificationState);
    } else {
      newState = markDayComplete(gamificationState);
    }

    setGamificationState(newState);
    saveGamificationState(newState);
  };

  const todayComplete = gamificationState ? isTodayComplete(gamificationState) : false;
  const weekCompletionStatus = gamificationState ? getWeekCompletionStatus(gamificationState) : [false, false, false, false, false, false, false];

  return (
    <div className="min-h-screen px-4 py-8">
      <div className="max-w-4xl mx-auto space-y-6">
        {/* Header */}
        <header className="flex items-center justify-between">
          <button
            onClick={() => router.push("/")}
            className="btn btn-ghost"
          >
            <RotateCcw size={18} />
            New Analysis
          </button>

          <div className="flex items-center gap-2">
            {gamificationState && (
              <StreakDisplay
                streak={gamificationState.streakData.currentStreak}
                freezeAvailable={gamificationState.streakData.streakFreezeAvailable}
                compact
              />
            )}
            {!user && (
              <button
                onClick={() => router.push("/login")}
                className="btn btn-secondary text-sm py-2"
              >
                Sign in
              </button>
            )}
            <button
              onClick={() => router.push("/settings")}
              className="p-2 rounded-[12px] hover:bg-dark/5 transition-colors"
            >
              <Settings size={20} className="text-muted" />
            </button>
          </div>
        </header>

        {/* Weekly Progress */}
        {gamificationState && (
          <WeeklyProgress
            completionStatus={weekCompletionStatus}
            daysCompleted={gamificationState.currentWeek.daysExercised}
            goalDays={gamificationState.currentWeek.goalDays}
          />
        )}

        {/* Tab Navigation */}
        <div className="glass p-1.5 flex gap-1">
          {tabs.map((tab) => {
            const Icon = tab.icon;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex-1 py-3 px-3 rounded-[12px] text-sm font-medium transition-all flex items-center justify-center gap-2 ${
                  activeTab === tab.id
                    ? "bg-primary text-white"
                    : "text-dark hover:bg-primary/10"
                }`}
              >
                <Icon size={16} />
                <span className="hidden sm:inline">{tab.label}</span>
              </button>
            );
          })}
        </div>

        {/* Tab Content */}
        <div className="space-y-6">
          {activeTab === "exercises" && (
            <>
              {/* Findings Summary */}
              {asymmetryProfile && (
                <div className="glass p-6 space-y-4">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-[12px] bg-primary/10 flex items-center justify-center">
                      <Target size={20} className="text-primary" />
                    </div>
                    <div>
                      <h2 className="text-lg font-semibold text-dark">Your Focus Areas</h2>
                      <p className="text-xs text-muted">Based on your posture analysis</p>
                    </div>
                  </div>
                  <FindingsSummary profile={asymmetryProfile} />
                </div>
              )}

              {/* Daily Routine */}
              {dailyRoutine && recommendedExercises.length > 0 && (
                <div className="glass p-6 space-y-4">
                  <button
                    onClick={() => setShowRoutine(!showRoutine)}
                    className="w-full flex items-center justify-between"
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-[12px] bg-primary/10 flex items-center justify-center">
                        <Play size={20} className="text-primary" />
                      </div>
                      <div className="text-left">
                        <h2 className="text-lg font-semibold text-dark">Daily Routine</h2>
                        <p className="text-xs text-muted">
                          {dailyRoutine.warmup.length + dailyRoutine.main.length + dailyRoutine.cooldown.length} exercises · ~{dailyRoutine.estimatedTime} min
                        </p>
                      </div>
                    </div>
                    {showRoutine ? (
                      <ChevronUp size={20} className="text-muted" />
                    ) : (
                      <ChevronDown size={20} className="text-muted" />
                    )}
                  </button>

                  {showRoutine && (
                    <div className="space-y-4 pt-2">
                      {/* Warm-up */}
                      {dailyRoutine.warmup.length > 0 && (
                        <div className="space-y-3">
                          <p className="text-xs font-medium text-muted uppercase tracking-wider">Warm-up</p>
                          {dailyRoutine.warmup.map((exercise) => (
                            <ExerciseCard
                              key={exercise.id}
                              exercise={exercise}
                              isExpanded={expandedExercise === exercise.id}
                              onToggle={() => setExpandedExercise(expandedExercise === exercise.id ? null : exercise.id)}
                              relevantFor={getRelevanceReasons(exercise)}
                              profile={asymmetryProfile}
                            />
                          ))}
                        </div>
                      )}

                      {/* Main Exercises */}
                      {dailyRoutine.main.length > 0 && (
                        <div className="space-y-3">
                          <p className="text-xs font-medium text-muted uppercase tracking-wider">Main Exercises</p>
                          {dailyRoutine.main.map((exercise) => (
                            <ExerciseCard
                              key={exercise.id}
                              exercise={exercise}
                              isExpanded={expandedExercise === exercise.id}
                              onToggle={() => setExpandedExercise(expandedExercise === exercise.id ? null : exercise.id)}
                              relevantFor={getRelevanceReasons(exercise)}
                              profile={asymmetryProfile}
                            />
                          ))}
                        </div>
                      )}

                      {/* Cool-down */}
                      {dailyRoutine.cooldown.length > 0 && (
                        <div className="space-y-3">
                          <p className="text-xs font-medium text-muted uppercase tracking-wider">Cool-down & Stretches</p>
                          {dailyRoutine.cooldown.map((exercise) => (
                            <ExerciseCard
                              key={exercise.id}
                              exercise={exercise}
                              isExpanded={expandedExercise === exercise.id}
                              onToggle={() => setExpandedExercise(expandedExercise === exercise.id ? null : exercise.id)}
                              relevantFor={getRelevanceReasons(exercise)}
                              profile={asymmetryProfile}
                            />
                          ))}
                        </div>
                      )}

                      {/* Completion Button */}
                      <div className="pt-4 border-t border-dark/5">
                        <RoutineCompletionButton
                          isComplete={todayComplete}
                          onToggle={handleToggleCompletion}
                        />
                      </div>
                    </div>
                  )}
                </div>
              )}

              {/* No analysis fallback */}
              {recommendedExercises.length === 0 && (
                <div className="glass p-6 space-y-4">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-[12px] bg-primary/10 flex items-center justify-center">
                      <Dumbbell size={20} className="text-primary" />
                    </div>
                    <div>
                      <h2 className="text-lg font-semibold text-dark">Exercises</h2>
                      <p className="text-xs text-muted">Personalized exercises for your posture</p>
                    </div>
                  </div>

                  <div className="glass-subtle p-8 text-center space-y-3">
                    <div className="w-12 h-12 mx-auto rounded-full bg-dark/5 flex items-center justify-center">
                      <Camera size={24} className="text-muted" />
                    </div>
                    <p className="text-muted text-sm">No analysis data found</p>
                    <p className="text-xs text-muted">
                      Complete a posture analysis to get personalized exercise recommendations.
                    </p>
                    <button
                      onClick={() => router.push("/")}
                      className="btn btn-primary mt-4"
                    >
                      Start Analysis
                      <ArrowRight size={18} />
                    </button>
                  </div>
                </div>
              )}

              {/* Research Note */}
              <div className="glass-subtle p-4 flex gap-3">
                <Info size={18} className="text-muted flex-shrink-0 mt-0.5" />
                <div>
                  <p className="text-xs text-muted leading-relaxed">
                    These exercises are based on the Schroth Method and postural correction research.
                    Consistency is key - <a href="https://pmc.ncbi.nlm.nih.gov/articles/PMC10170402/" target="_blank" rel="noopener noreferrer" className="text-primary hover:underline">clinical studies</a> show
                    that regular scoliosis-specific exercises (typically 3 sessions of 60-90 minutes per week)
                    can lead to measurable improvements in Cobb angle and quality of life. Always consult
                    with a healthcare provider before starting a new exercise program.
                  </p>
                </div>
              </div>
            </>
          )}

          {activeTab === "breathing" && (
            <BreathingExercise
              analysisType={analysisType}
              xrayData={xrayData || undefined}
              photoData={analysisData ? {
                metrics: analysisData.metrics,
                riskLevel: analysisData.riskLevel,
              } : undefined}
            />
          )}

          {activeTab === "progress" && (
            <div className="glass p-6 space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-[12px] bg-primary/10 flex items-center justify-center">
                    <Camera size={20} className="text-primary" />
                  </div>
                  <div>
                    <h2 className="text-lg font-semibold text-dark">Progress Tracking</h2>
                    <p className="text-xs text-muted">Track your posture improvements over time</p>
                  </div>
                </div>
                <button className="btn btn-secondary text-sm">
                  <Plus size={16} />
                  Add Photo
                </button>
              </div>

              {progressPhotos.length > 0 ? (
                <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                  {progressPhotos.map((photo) => (
                    <div key={photo.id} className="glass-subtle rounded-[16px] overflow-hidden">
                      <img
                        src={photo.image}
                        alt={`Progress photo from ${photo.date}`}
                        className="w-full h-40 object-cover"
                      />
                      <div className="p-3 space-y-1">
                        <p className="text-xs font-medium text-dark">{photo.date}</p>
                        {photo.notes && (
                          <p className="text-xs text-muted truncate">{photo.notes}</p>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="glass-subtle p-8 text-center space-y-3">
                  <div className="w-12 h-12 mx-auto rounded-full bg-dark/5 flex items-center justify-center">
                    <Camera size={24} className="text-muted" />
                  </div>
                  <p className="text-muted text-sm">No progress photos yet</p>
                  <p className="text-xs text-muted">
                    Take regular photos to track your posture improvements over time.
                  </p>
                </div>
              )}
            </div>
          )}

          {activeTab === "chat" && (
            <div className="glass p-6 space-y-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-[12px] bg-primary/10 flex items-center justify-center">
                  <MessageCircle size={20} className="text-primary" />
                </div>
                <div>
                  <h2 className="text-lg font-semibold text-dark">Chat with AI</h2>
                  <p className="text-xs text-muted">Get answers to your scoliosis questions</p>
                </div>
              </div>

              <InlineChat />
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
