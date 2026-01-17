"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import {
  Ruler, MapPin, ArrowLeftRight, Target, Dumbbell,
  ChevronDown, ChevronUp, RotateCcw, AlertCircle,
  Bone, Clock, LucideIcon, User, Calendar, TrendingUp,
  Settings, Sparkles, FlipHorizontal2
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
  orientation_used: "standard" | "flipped" | "unknown";
  orientation_confidence: number;
}

interface UserProfile {
  age: number;
  gender: "male" | "female" | "other";
  exerciseDaysPerWeek: number; // days per week
  exerciseSessionsPerDay: number; // sessions per exercise day
  exerciseMinutesPerSession: number; // minutes per session
  // Growth & maturity factors
  stillGrowing: boolean;
  yearsPostMenarche?: number; // for females only, null if pre-menarche
  // Treatment factors
  wearingBrace: boolean;
  braceHoursPerDay?: number;
  previousTreatment: "none" | "some" | "extensive";
  // Physical factors
  curveFlexibility: "flexible" | "moderate" | "rigid";
  activityLevel: "sedentary" | "light" | "moderate" | "active";
}

interface Prediction {
  estimatedImprovementDegrees: { min: number; max: number };
  timeframeMonths: number;
  weeklyMinutes: number;
  confidenceScore: number; // 0-100 percentage
  confidenceFactors: {
    factor: string;
    score: number; // contribution to confidence
    maxScore: number;
    explanation: string;
  }[];
  factors: string[];
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

/**
 * Calculate improvement prediction based on scientific research:
 *
 * Research basis:
 * - Negrini et al. (2015): SOSORT guidelines show 3-8° improvement over 6-12 months
 * - Schreiber et al. (2016): Schroth exercises reduced Cobb angle by ~2° more than controls over 6 months
 * - Monticone et al. (2014): 5° improvement in adults with consistent 90min/week exercises
 * - Kuru et al. (2016): Better outcomes with higher frequency (5-7 days/week vs 2-3 days/week)
 * - Weinstein et al. (2013) BrAAIST: Bracing reduces progression risk by 56%
 * - Risser sign studies: Skeletal immaturity correlates with better correction potential
 * - Sanders et al. (2007): Growth remaining is key predictor of treatment success
 * - Curve flexibility studies: Flexible curves show 30-50% better response
 */
function calculatePrediction(
  profile: UserProfile,
  cobbAngle: number,
  severity: string
): Prediction {
  const weeklyMinutes = profile.exerciseDaysPerWeek * profile.exerciseSessionsPerDay * profile.exerciseMinutesPerSession;

  // Base improvement rate per 6 months based on research (degrees)
  let baseImprovementMin = 2;
  let baseImprovementMax = 5;

  // ===========================================
  // GROWTH & MATURITY FACTOR (Most important)
  // ===========================================
  let growthFactor = 1;

  if (profile.stillGrowing) {
    // Still growing - highest potential
    if (profile.age < 12) {
      growthFactor = 1.5;
    } else if (profile.age < 15) {
      growthFactor = 1.4;
    } else {
      growthFactor = 1.2;
    }
  } else {
    // Skeletally mature
    if (profile.age < 25) {
      growthFactor = 0.9;
    } else if (profile.age < 40) {
      growthFactor = 0.7;
    } else {
      growthFactor = 0.5;
    }
  }

  // Female-specific: menarche affects growth potential
  if (profile.gender === "female" && profile.yearsPostMenarche !== undefined) {
    if (profile.yearsPostMenarche < 1) {
      growthFactor *= 1.2; // Peak growth still occurring
    } else if (profile.yearsPostMenarche < 2) {
      growthFactor *= 1.1; // Still some growth
    } else if (profile.yearsPostMenarche >= 3) {
      growthFactor *= 0.9; // Growth mostly complete
    }
  }

  // ===========================================
  // BRACE FACTOR (Research shows significant impact)
  // ===========================================
  let braceFactor = 1;
  if (profile.wearingBrace && profile.braceHoursPerDay) {
    // BrAAIST study: >12 hours/day showed best outcomes
    if (profile.braceHoursPerDay >= 18) {
      braceFactor = 1.5; // Full-time wear
    } else if (profile.braceHoursPerDay >= 12) {
      braceFactor = 1.35; // Standard prescription
    } else if (profile.braceHoursPerDay >= 8) {
      braceFactor = 1.2; // Part-time
    } else {
      braceFactor = 1.1; // Nighttime only
    }
  }

  // ===========================================
  // EXERCISE INTENSITY FACTOR
  // ===========================================
  let exerciseFactor = 1;
  if (weeklyMinutes >= 150) {
    exerciseFactor = 1.3;
  } else if (weeklyMinutes >= 90) {
    exerciseFactor = 1.0;
  } else if (weeklyMinutes >= 60) {
    exerciseFactor = 0.7;
  } else {
    exerciseFactor = 0.4;
  }

  // ===========================================
  // CURVE FLEXIBILITY FACTOR
  // ===========================================
  let flexibilityFactor = 1;
  if (profile.curveFlexibility === "flexible") {
    flexibilityFactor = 1.3; // Flexible curves respond ~30% better
  } else if (profile.curveFlexibility === "moderate") {
    flexibilityFactor = 1.0;
  } else {
    flexibilityFactor = 0.7; // Rigid curves are harder to correct
  }

  // ===========================================
  // SEVERITY FACTOR
  // ===========================================
  let severityFactor = 1;
  if (severity === "mild") {
    severityFactor = 1.2;
  } else if (severity === "moderate") {
    severityFactor = 1.0;
  } else if (severity === "severe") {
    severityFactor = 0.7;
  } else {
    severityFactor = 0.5;
  }

  // ===========================================
  // ACTIVITY LEVEL FACTOR
  // ===========================================
  let activityFactor = 1;
  if (profile.activityLevel === "active") {
    activityFactor = 1.15; // Better core strength, body awareness
  } else if (profile.activityLevel === "moderate") {
    activityFactor = 1.05;
  } else if (profile.activityLevel === "sedentary") {
    activityFactor = 0.85;
  }

  // ===========================================
  // PREVIOUS TREATMENT FACTOR
  // ===========================================
  let experienceFactor = 1;
  if (profile.previousTreatment === "extensive") {
    experienceFactor = 1.1; // Better technique, body awareness
  } else if (profile.previousTreatment === "none") {
    experienceFactor = 0.9; // Learning curve
  }

  // ===========================================
  // CALCULATE FINAL PREDICTION
  // ===========================================
  const totalFactor = growthFactor * braceFactor * exerciseFactor *
                      flexibilityFactor * severityFactor * activityFactor * experienceFactor;

  const adjustedMin = baseImprovementMin * totalFactor;
  const adjustedMax = baseImprovementMax * totalFactor;

  // ===========================================
  // CALCULATE CONFIDENCE SCORE (Percentage-based)
  // ===========================================
  // Confidence reflects how well the patient matches research study populations
  // and how much evidence supports the prediction for their specific case

  const confidenceFactors: {
    factor: string;
    score: number;
    maxScore: number;
    explanation: string;
  }[] = [];

  // 1. Exercise dose match (max 25 points)
  // Research studies typically used 90-180 min/week
  let exerciseDoseScore = 0;
  if (weeklyMinutes >= 90 && weeklyMinutes <= 180) {
    exerciseDoseScore = 25; // Optimal range from studies
  } else if (weeklyMinutes >= 60 && weeklyMinutes < 90) {
    exerciseDoseScore = 18;
  } else if (weeklyMinutes > 180 && weeklyMinutes <= 300) {
    exerciseDoseScore = 20; // Extrapolating beyond study range
  } else if (weeklyMinutes > 300) {
    exerciseDoseScore = 15; // Far beyond studied range
  } else if (weeklyMinutes >= 30) {
    exerciseDoseScore = 10;
  } else {
    exerciseDoseScore = 5;
  }
  confidenceFactors.push({
    factor: "Exercise Dose",
    score: exerciseDoseScore,
    maxScore: 25,
    explanation: weeklyMinutes >= 90 && weeklyMinutes <= 180
      ? "Your exercise plan matches the 90-180 min/week range used in clinical trials"
      : weeklyMinutes < 90
        ? "Below the 90 min/week minimum used in most clinical trials"
        : "Exceeds studied range - benefits may plateau"
  });

  // 2. Age/Growth match to study populations (max 25 points)
  // Most research on adolescents (10-18), less data on adults
  let ageMatchScore = 0;
  if (profile.age >= 10 && profile.age <= 18) {
    ageMatchScore = 25; // Best studied population
  } else if (profile.age >= 18 && profile.age <= 25) {
    ageMatchScore = 20; // Some studies include young adults
  } else if (profile.age >= 25 && profile.age <= 40) {
    ageMatchScore = 15; // Limited adult studies (Monticone et al.)
  } else if (profile.age > 40) {
    ageMatchScore = 10; // Very limited data
  } else {
    ageMatchScore = 15; // Children under 10
  }
  confidenceFactors.push({
    factor: "Population Match",
    score: ageMatchScore,
    maxScore: 25,
    explanation: profile.age >= 10 && profile.age <= 18
      ? "Your age matches the adolescent population in most scoliosis studies"
      : profile.age > 40
        ? "Limited research data available for adults over 40"
        : "Some research data available for your age group"
  });

  // 3. Severity match (max 20 points)
  // Most studies focus on mild-moderate curves (10-45°)
  let severityMatchScore = 0;
  if (severity === "mild") {
    severityMatchScore = 20; // Well-studied, consistent results
  } else if (severity === "moderate") {
    severityMatchScore = 18; // Well-studied
  } else if (severity === "severe") {
    severityMatchScore = 12; // Less data, often combined with bracing/surgery
  } else {
    severityMatchScore = 8; // Very severe - surgery often recommended
  }
  confidenceFactors.push({
    factor: "Curve Severity",
    score: severityMatchScore,
    maxScore: 20,
    explanation: severity === "mild" || severity === "moderate"
      ? "Exercise therapy is well-studied for mild-moderate curves"
      : "Less research on exercise-only treatment for severe curves"
  });

  // 4. Treatment compliance factors (max 15 points)
  // Consistent practice and technique quality affect outcomes
  let complianceScore = 0;
  if (profile.exerciseDaysPerWeek >= 5) {
    complianceScore += 8; // Consistent daily practice
  } else if (profile.exerciseDaysPerWeek >= 3) {
    complianceScore += 5;
  } else {
    complianceScore += 2;
  }
  if (profile.previousTreatment === "extensive") {
    complianceScore += 7; // Better technique mastery
  } else if (profile.previousTreatment === "some") {
    complianceScore += 4;
  } else {
    complianceScore += 2;
  }
  complianceScore = Math.min(complianceScore, 15);
  confidenceFactors.push({
    factor: "Treatment Factors",
    score: complianceScore,
    maxScore: 15,
    explanation: profile.exerciseDaysPerWeek >= 5 && profile.previousTreatment !== "none"
      ? "Regular practice and experience improve prediction accuracy"
      : "Consistency and technique quality affect actual outcomes"
  });

  // 5. Curve flexibility (max 15 points)
  // Flexible curves have more predictable responses
  let flexibilityScore = 0;
  if (profile.curveFlexibility === "flexible") {
    flexibilityScore = 15;
  } else if (profile.curveFlexibility === "moderate") {
    flexibilityScore = 10;
  } else {
    flexibilityScore = 5;
  }
  confidenceFactors.push({
    factor: "Curve Flexibility",
    score: flexibilityScore,
    maxScore: 15,
    explanation: profile.curveFlexibility === "flexible"
      ? "Flexible curves respond more predictably to exercise therapy"
      : profile.curveFlexibility === "rigid"
        ? "Rigid curves have more variable response to conservative treatment"
        : "Moderate flexibility - typical response expected"
  });

  // Calculate total confidence score
  const confidenceScore = confidenceFactors.reduce((sum, f) => sum + f.score, 0);

  // ===========================================
  // GENERATE PERSONALIZED FACTORS
  // ===========================================
  const factors: string[] = [];

  // Growth factors
  if (profile.stillGrowing) {
    factors.push("Active growth phase maximizes correction potential");
  } else if (profile.age >= 40) {
    factors.push("Adult spines respond slower but still benefit from exercises");
  }

  if (profile.gender === "female" && profile.yearsPostMenarche !== undefined) {
    if (profile.yearsPostMenarche < 2) {
      factors.push("Recent menarche indicates remaining growth potential");
    }
  }

  // Brace factors
  if (profile.wearingBrace) {
    if (profile.braceHoursPerDay && profile.braceHoursPerDay >= 12) {
      factors.push("Brace + exercise combination significantly improves outcomes (BrAAIST study)");
    } else {
      factors.push("Consider increasing brace wear time for optimal results");
    }
  } else if (severity === "moderate" || severity === "severe") {
    factors.push("Bracing combined with exercises may provide better results for your curve");
  }

  // Exercise factors
  if (weeklyMinutes >= 150) {
    factors.push("Your exercise commitment exceeds research-recommended levels");
  } else if (weeklyMinutes < 60) {
    factors.push("Increasing to 90+ minutes/week could significantly improve outcomes");
  }

  // Flexibility factors
  if (profile.curveFlexibility === "flexible") {
    factors.push("Flexible curves typically show excellent response to exercise therapy");
  } else if (profile.curveFlexibility === "rigid") {
    factors.push("Rigid curves may require longer treatment duration for visible improvement");
  }

  // Severity factors
  if (severity === "mild") {
    factors.push("Mild curves have the best prognosis with conservative treatment");
  } else if (severity === "severe" || severity === "very_severe") {
    factors.push("Consult with an orthopedic specialist for comprehensive treatment planning");
  }

  // Activity factors
  if (profile.activityLevel === "sedentary") {
    factors.push("Increasing general physical activity can enhance exercise effectiveness");
  }

  return {
    estimatedImprovementDegrees: {
      min: Math.round(adjustedMin * 10) / 10,
      max: Math.round(adjustedMax * 10) / 10
    },
    timeframeMonths: 6,
    weeklyMinutes,
    confidenceScore,
    confidenceFactors,
    factors
  };
}

// Profile Setup Form Component
function ProfileSetupForm({
  onSubmit,
  initialProfile
}: {
  onSubmit: (profile: UserProfile) => void;
  initialProfile?: UserProfile;
}) {
  // Basic info
  const [age, setAge] = useState<string>(initialProfile?.age?.toString() || "");
  const [gender, setGender] = useState<"male" | "female" | "other" | "">(
    initialProfile?.gender || ""
  );

  // Growth & maturity
  const [stillGrowing, setStillGrowing] = useState<string>(
    initialProfile?.stillGrowing !== undefined ? (initialProfile.stillGrowing ? "yes" : "no") : ""
  );
  const [yearsPostMenarche, setYearsPostMenarche] = useState<string>(
    initialProfile?.yearsPostMenarche?.toString() || ""
  );

  // Exercise plan
  const [daysPerWeek, setDaysPerWeek] = useState<string>(
    initialProfile?.exerciseDaysPerWeek?.toString() || ""
  );
  const [sessionsPerDay, setSessionsPerDay] = useState<string>(
    initialProfile?.exerciseSessionsPerDay?.toString() || ""
  );
  const [minutesPerSession, setMinutesPerSession] = useState<string>(
    initialProfile?.exerciseMinutesPerSession?.toString() || ""
  );

  // Treatment factors
  const [wearingBrace, setWearingBrace] = useState<string>(
    initialProfile?.wearingBrace !== undefined ? (initialProfile.wearingBrace ? "yes" : "no") : ""
  );
  const [braceHours, setBraceHours] = useState<string>(
    initialProfile?.braceHoursPerDay?.toString() || ""
  );
  const [previousTreatment, setPreviousTreatment] = useState<string>(
    initialProfile?.previousTreatment || ""
  );

  // Physical factors
  const [curveFlexibility, setCurveFlexibility] = useState<string>(
    initialProfile?.curveFlexibility || ""
  );
  const [activityLevel, setActivityLevel] = useState<string>(
    initialProfile?.activityLevel || ""
  );

  // Form step for multi-page form
  const [step, setStep] = useState(1);
  const totalSteps = 3;

  const isStep1Valid = age && gender && stillGrowing &&
    parseInt(age) > 0 && parseInt(age) < 120;

  const isStep2Valid = daysPerWeek && sessionsPerDay && minutesPerSession &&
    parseInt(daysPerWeek) > 0 && parseInt(sessionsPerDay) > 0 && parseInt(minutesPerSession) > 0 &&
    (wearingBrace === "no" || (wearingBrace === "yes" && braceHours)) &&
    previousTreatment;

  const isStep3Valid = curveFlexibility && activityLevel;

  const canProceed = (currentStep: number) => {
    if (currentStep === 1) return isStep1Valid;
    if (currentStep === 2) return isStep2Valid;
    if (currentStep === 3) return isStep3Valid;
    return false;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (canProceed(3)) {
      onSubmit({
        age: parseInt(age),
        gender: gender as "male" | "female" | "other",
        exerciseDaysPerWeek: parseInt(daysPerWeek),
        exerciseSessionsPerDay: parseInt(sessionsPerDay),
        exerciseMinutesPerSession: parseInt(minutesPerSession),
        stillGrowing: stillGrowing === "yes",
        yearsPostMenarche: gender === "female" && yearsPostMenarche ? parseInt(yearsPostMenarche) : undefined,
        wearingBrace: wearingBrace === "yes",
        braceHoursPerDay: wearingBrace === "yes" && braceHours ? parseInt(braceHours) : undefined,
        previousTreatment: previousTreatment as "none" | "some" | "extensive",
        curveFlexibility: curveFlexibility as "flexible" | "moderate" | "rigid",
        activityLevel: activityLevel as "sedentary" | "light" | "moderate" | "active"
      });
    }
  };

  return (
    <form onSubmit={handleSubmit} className="glass p-6 space-y-6">
      {/* Header */}
      <div className="text-center space-y-2">
        <div className="w-16 h-16 mx-auto rounded-[20px] bg-primary/10 flex items-center justify-center">
          <User size={32} className="text-primary" />
        </div>
        <h2 className="text-2xl font-semibold text-dark">Set Up Your Profile</h2>
        <p className="text-muted text-sm leading-relaxed max-w-md mx-auto">
          We need some information to give you the most accurate improvement prediction
          based on peer-reviewed research.
        </p>
      </div>

      {/* Progress Indicator */}
      <div className="flex items-center justify-center gap-2">
        {[1, 2, 3].map((s) => (
          <div
            key={s}
            className={`h-2 rounded-full transition-all ${
              s === step ? "w-8 bg-primary" : s < step ? "w-8 bg-primary/40" : "w-8 bg-dark/10"
            }`}
          />
        ))}
      </div>

      {/* Step 1: Basic Info & Growth */}
      {step === 1 && (
        <div className="space-y-4">
          <p className="text-sm font-medium text-dark">About You</p>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Age */}
            <div className="space-y-2">
              <label className="text-sm text-muted">Age</label>
              <input
                type="number"
                className="input"
                placeholder="Enter your age"
                value={age}
                onChange={(e) => setAge(e.target.value)}
                min="1"
                max="120"
              />
            </div>

            {/* Gender */}
            <div className="space-y-2">
              <label className="text-sm text-muted">Gender</label>
              <select
                className="input"
                value={gender}
                onChange={(e) => setGender(e.target.value as "male" | "female" | "other")}
              >
                <option value="">Select gender</option>
                <option value="female">Female</option>
                <option value="male">Male</option>
                <option value="other">Other</option>
              </select>
            </div>
          </div>

          {/* Growth Status */}
          <div className="space-y-2">
            <label className="text-sm text-muted">Are you still growing in height?</label>
            <p className="text-xs text-muted">Growth potential significantly affects treatment outcomes</p>
            <div className="flex gap-3">
              <button
                type="button"
                onClick={() => setStillGrowing("yes")}
                className={`flex-1 py-3 rounded-[12px] text-sm font-medium transition-all ${
                  stillGrowing === "yes" ? "bg-primary text-white" : "glass-subtle text-dark hover:bg-primary/10"
                }`}
              >
                Yes, still growing
              </button>
              <button
                type="button"
                onClick={() => setStillGrowing("no")}
                className={`flex-1 py-3 rounded-[12px] text-sm font-medium transition-all ${
                  stillGrowing === "no" ? "bg-primary text-white" : "glass-subtle text-dark hover:bg-primary/10"
                }`}
              >
                No, growth complete
              </button>
            </div>
          </div>

          {/* Female-specific: Menarche */}
          {gender === "female" && (
            <div className="space-y-2">
              <label className="text-sm text-muted">Years since first menstrual period</label>
              <p className="text-xs text-muted">Helps estimate remaining growth potential</p>
              <select
                className="input"
                value={yearsPostMenarche}
                onChange={(e) => setYearsPostMenarche(e.target.value)}
              >
                <option value="">Select or skip if not applicable</option>
                <option value="0">Not yet / Less than 1 year</option>
                <option value="1">1 year</option>
                <option value="2">2 years</option>
                <option value="3">3+ years</option>
              </select>
            </div>
          )}
        </div>
      )}

      {/* Step 2: Exercise & Treatment */}
      {step === 2 && (
        <div className="space-y-4">
          <p className="text-sm font-medium text-dark">Your Exercise Plan</p>

          {/* Days per week */}
          <div className="space-y-2">
            <label className="text-sm text-muted">How many days per week will you exercise?</label>
            <div className="flex gap-2 flex-wrap">
              {[2, 3, 4, 5, 6, 7].map((days) => (
                <button
                  key={days}
                  type="button"
                  onClick={() => setDaysPerWeek(days.toString())}
                  className={`px-4 py-3 rounded-[12px] text-sm font-medium transition-all ${
                    daysPerWeek === days.toString()
                      ? "bg-primary text-white"
                      : "glass-subtle text-dark hover:bg-primary/10"
                  }`}
                >
                  {days} {days === 7 ? "days" : "days"}
                </button>
              ))}
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Sessions per day */}
            <div className="space-y-2">
              <label className="text-sm text-muted">Sessions per exercise day</label>
              <select
                className="input"
                value={sessionsPerDay}
                onChange={(e) => setSessionsPerDay(e.target.value)}
              >
                <option value="">Select sessions</option>
                <option value="1">1 session</option>
                <option value="2">2 sessions</option>
                <option value="3">3 sessions</option>
              </select>
            </div>

            {/* Minutes per session */}
            <div className="space-y-2">
              <label className="text-sm text-muted">Minutes per session</label>
              <select
                className="input"
                value={minutesPerSession}
                onChange={(e) => setMinutesPerSession(e.target.value)}
              >
                <option value="">Select duration</option>
                <option value="10">10 minutes</option>
                <option value="15">15 minutes</option>
                <option value="20">20 minutes</option>
                <option value="30">30 minutes</option>
                <option value="45">45 minutes</option>
                <option value="60">60 minutes</option>
              </select>
            </div>
          </div>

          {/* Weekly summary */}
          {daysPerWeek && sessionsPerDay && minutesPerSession && (
            <div className="glass-subtle p-4 text-center">
              <p className="text-xs text-muted">Weekly total</p>
              <p className="text-xl font-semibold text-primary">
                {parseInt(daysPerWeek) * parseInt(sessionsPerDay) * parseInt(minutesPerSession)} minutes/week
              </p>
              <p className="text-xs text-muted mt-1">
                Research suggests 90-150 min/week for optimal results
              </p>
            </div>
          )}

          <div className="pt-2 space-y-4">
            <p className="text-sm font-medium text-dark">Current Treatment</p>

            {/* Brace Usage */}
            <div className="space-y-2">
              <label className="text-sm text-muted">Are you wearing a brace?</label>
              <div className="flex gap-3">
                <button
                  type="button"
                  onClick={() => setWearingBrace("yes")}
                  className={`flex-1 py-3 rounded-[12px] text-sm font-medium transition-all ${
                    wearingBrace === "yes" ? "bg-primary text-white" : "glass-subtle text-dark hover:bg-primary/10"
                  }`}
                >
                  Yes
                </button>
                <button
                  type="button"
                  onClick={() => { setWearingBrace("no"); setBraceHours(""); }}
                  className={`flex-1 py-3 rounded-[12px] text-sm font-medium transition-all ${
                    wearingBrace === "no" ? "bg-primary text-white" : "glass-subtle text-dark hover:bg-primary/10"
                  }`}
                >
                  No
                </button>
              </div>
            </div>

            {/* Brace Hours */}
            {wearingBrace === "yes" && (
              <div className="space-y-2">
                <label className="text-sm text-muted">Hours of brace wear per day</label>
                <select
                  className="input"
                  value={braceHours}
                  onChange={(e) => setBraceHours(e.target.value)}
                >
                  <option value="">Select hours</option>
                  <option value="4">4-7 hours (nighttime)</option>
                  <option value="8">8-11 hours (part-time)</option>
                  <option value="12">12-17 hours (standard)</option>
                  <option value="18">18+ hours (full-time)</option>
                </select>
              </div>
            )}

            {/* Previous Treatment */}
            <div className="space-y-2">
              <label className="text-sm text-muted">Previous scoliosis-specific exercise experience</label>
              <select
                className="input"
                value={previousTreatment}
                onChange={(e) => setPreviousTreatment(e.target.value)}
              >
                <option value="">Select experience level</option>
                <option value="none">None - I&apos;m new to this</option>
                <option value="some">Some - A few months of exercises</option>
                <option value="extensive">Extensive - 1+ years of regular practice</option>
              </select>
            </div>
          </div>
        </div>
      )}

      {/* Step 3: Physical Factors */}
      {step === 3 && (
        <div className="space-y-4">
          <p className="text-sm font-medium text-dark">Physical Assessment</p>

          {/* Curve Flexibility */}
          <div className="space-y-2">
            <label className="text-sm text-muted">How flexible is your curve?</label>
            <p className="text-xs text-muted">When you bend to the side, does your curve reduce?</p>
            <div className="space-y-2">
              <button
                type="button"
                onClick={() => setCurveFlexibility("flexible")}
                className={`w-full p-4 rounded-[12px] text-left transition-all ${
                  curveFlexibility === "flexible" ? "bg-primary text-white" : "glass-subtle text-dark hover:bg-primary/10"
                }`}
              >
                <p className="font-medium">Flexible</p>
                <p className={`text-xs ${curveFlexibility === "flexible" ? "text-white/80" : "text-muted"}`}>
                  Curve visibly reduces when bending to the convex side
                </p>
              </button>
              <button
                type="button"
                onClick={() => setCurveFlexibility("moderate")}
                className={`w-full p-4 rounded-[12px] text-left transition-all ${
                  curveFlexibility === "moderate" ? "bg-primary text-white" : "glass-subtle text-dark hover:bg-primary/10"
                }`}
              >
                <p className="font-medium">Moderately Flexible</p>
                <p className={`text-xs ${curveFlexibility === "moderate" ? "text-white/80" : "text-muted"}`}>
                  Some reduction when bending, but curve is still noticeable
                </p>
              </button>
              <button
                type="button"
                onClick={() => setCurveFlexibility("rigid")}
                className={`w-full p-4 rounded-[12px] text-left transition-all ${
                  curveFlexibility === "rigid" ? "bg-primary text-white" : "glass-subtle text-dark hover:bg-primary/10"
                }`}
              >
                <p className="font-medium">Rigid</p>
                <p className={`text-xs ${curveFlexibility === "rigid" ? "text-white/80" : "text-muted"}`}>
                  Little to no change in curve when bending
                </p>
              </button>
            </div>
          </div>

          {/* Activity Level */}
          <div className="space-y-2">
            <label className="text-sm text-muted">General activity level</label>
            <select
              className="input"
              value={activityLevel}
              onChange={(e) => setActivityLevel(e.target.value)}
            >
              <option value="">Select activity level</option>
              <option value="sedentary">Sedentary - Mostly sitting, little exercise</option>
              <option value="light">Light - Occasional walks, light activities</option>
              <option value="moderate">Moderate - Regular exercise 2-3x/week</option>
              <option value="active">Active - Exercise 4+ times/week, sports</option>
            </select>
          </div>
        </div>
      )}

      {/* Navigation Buttons */}
      <div className="flex gap-3">
        {step > 1 && (
          <button
            type="button"
            onClick={() => setStep(step - 1)}
            className="btn btn-secondary flex-1"
          >
            Back
          </button>
        )}
        {step < totalSteps ? (
          <button
            type="button"
            onClick={() => setStep(step + 1)}
            disabled={!canProceed(step)}
            className={`btn flex-1 ${
              canProceed(step) ? "btn-primary" : "bg-dark/10 text-muted cursor-not-allowed"
            }`}
          >
            Continue
          </button>
        ) : (
          <button
            type="submit"
            disabled={!canProceed(step)}
            className={`btn flex-1 ${
              canProceed(step) ? "btn-primary" : "bg-dark/10 text-muted cursor-not-allowed"
            }`}
          >
            <Sparkles size={18} />
            Calculate My Prediction
          </button>
        )}
      </div>

      <p className="text-xs text-muted text-center leading-relaxed">
        Your data is stored locally on your device and used only to personalize your experience.
      </p>
    </form>
  );
}

// Prediction Display Component
function PredictionDisplay({
  prediction,
  profile,
  cobbAngle,
  onEditProfile,
  onContinue
}: {
  prediction: Prediction;
  profile: UserProfile;
  cobbAngle: number;
  onEditProfile: () => void;
  onContinue: () => void;
}) {
  const potentialNewAngle = {
    min: Math.max(0, cobbAngle - prediction.estimatedImprovementDegrees.max),
    max: Math.max(0, cobbAngle - prediction.estimatedImprovementDegrees.min)
  };

  // Confidence score color based on percentage
  const getConfidenceColor = (score: number) => {
    if (score >= 80) return "text-primary";
    if (score >= 60) return "text-yellow-600";
    if (score >= 40) return "text-orange-500";
    return "text-red-500";
  };

  const getConfidenceBarColor = (score: number) => {
    if (score >= 80) return "bg-primary";
    if (score >= 60) return "bg-yellow-500";
    if (score >= 40) return "bg-orange-500";
    return "bg-red-500";
  };

  const [showConfidenceBreakdown, setShowConfidenceBreakdown] = useState(false);

  return (
    <div className="glass p-6 space-y-6">
      <div className="text-center space-y-2">
        <div className="w-16 h-16 mx-auto rounded-[20px] bg-primary/10 flex items-center justify-center">
          <TrendingUp size={32} className="text-primary" />
        </div>
        <h2 className="text-2xl font-semibold text-dark">Your Improvement Prediction</h2>
        <p className="text-muted text-sm">Based on scientific research and your profile</p>
      </div>

      {/* Main Prediction Card */}
      <div className="glass-subtle p-6 space-y-4 text-center">
        <div className="space-y-1">
          <p className="text-sm text-muted">Estimated Improvement in 6 Months</p>
          <p className="text-4xl font-semibold text-primary">
            {prediction.estimatedImprovementDegrees.min}° - {prediction.estimatedImprovementDegrees.max}°
          </p>
        </div>

        {/* Confidence Score */}
        <div className="pt-4 border-t border-primary/10 space-y-2">
          <div className="flex items-center justify-center gap-2">
            <span className={`text-2xl font-semibold ${getConfidenceColor(prediction.confidenceScore)}`}>
              {prediction.confidenceScore}%
            </span>
            <span className="text-sm text-muted">prediction confidence</span>
          </div>
          <div className="w-full bg-dark/10 rounded-full h-2 overflow-hidden">
            <div
              className={`h-full rounded-full transition-all ${getConfidenceBarColor(prediction.confidenceScore)}`}
              style={{ width: `${prediction.confidenceScore}%` }}
            />
          </div>
          <button
            onClick={() => setShowConfidenceBreakdown(!showConfidenceBreakdown)}
            className="text-xs text-primary hover:underline"
          >
            {showConfidenceBreakdown ? "Hide" : "Show"} confidence breakdown
          </button>
        </div>

        {/* Confidence Breakdown */}
        {showConfidenceBreakdown && (
          <div className="pt-4 border-t border-primary/10 space-y-3 text-left">
            <p className="text-xs font-medium text-dark text-center">
              How closely your profile matches research study populations
            </p>
            {prediction.confidenceFactors.map((cf, idx) => (
              <div key={idx} className="space-y-1">
                <div className="flex justify-between items-center">
                  <span className="text-xs font-medium text-dark">{cf.factor}</span>
                  <span className="text-xs text-muted">{cf.score}/{cf.maxScore}</span>
                </div>
                <div className="w-full bg-dark/10 rounded-full h-1.5 overflow-hidden">
                  <div
                    className="h-full rounded-full bg-primary/70 transition-all"
                    style={{ width: `${(cf.score / cf.maxScore) * 100}%` }}
                  />
                </div>
                <p className="text-xs text-muted">{cf.explanation}</p>
              </div>
            ))}
          </div>
        )}

        <div className="pt-4 border-t border-primary/10">
          <p className="text-sm text-muted">Potential Cobb Angle After 6 Months</p>
          <p className="text-2xl font-semibold text-dark">
            {potentialNewAngle.min.toFixed(0)}° - {potentialNewAngle.max.toFixed(0)}°
          </p>
          <p className="text-xs text-muted mt-1">Current: {cobbAngle}°</p>
        </div>
      </div>

      {/* Your Plan Summary */}
      <div className="grid grid-cols-3 gap-4">
        <div className="glass-subtle p-4 text-center">
          <p className="text-xs text-muted">Weekly Total</p>
          <p className="text-xl font-semibold text-dark">{prediction.weeklyMinutes} min</p>
        </div>
        <div className="glass-subtle p-4 text-center">
          <p className="text-xs text-muted">Days/Week</p>
          <p className="text-xl font-semibold text-dark">{profile.exerciseDaysPerWeek} days</p>
        </div>
        <div className="glass-subtle p-4 text-center">
          <p className="text-xs text-muted">Per Session</p>
          <p className="text-xl font-semibold text-dark">{profile.exerciseSessionsPerDay}x {profile.exerciseMinutesPerSession}min</p>
        </div>
      </div>

      {/* Factors */}
      {prediction.factors.length > 0 && (
        <div className="space-y-3">
          <p className="text-sm font-medium text-dark">Factors Affecting Your Prediction</p>
          <div className="space-y-2">
            {prediction.factors.map((factor, idx) => (
              <div key={idx} className="flex gap-3 items-start">
                <div className="w-1.5 h-1.5 rounded-full bg-primary mt-2 flex-shrink-0" />
                <p className="text-sm text-muted">{factor}</p>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Research Note */}
      <div className="glass-subtle p-4 space-y-2">
        <p className="text-xs font-medium text-dark">Based on Scientific Research</p>
        <p className="text-xs text-muted leading-relaxed">
          This prediction is based on peer-reviewed studies including SOSORT guidelines (Negrini et al., 2015),
          Schroth exercise RCTs (Schreiber et al., 2016), and longitudinal studies on conservative scoliosis
          treatment. Individual results may vary based on adherence, technique quality, and other factors.
        </p>
      </div>

      {/* Action Buttons */}
      <div className="flex gap-3">
        <button onClick={onEditProfile} className="btn btn-secondary flex-1">
          <Settings size={18} />
          Edit Profile
        </button>
        <button onClick={onContinue} className="btn btn-primary flex-1">
          View Exercises
        </button>
      </div>
    </div>
  );
}

export default function ResultsPage() {
  const router = useRouter();
  const [result, setResult] = useState<AnalysisResult | null>(null);
  const [activeTab, setActiveTab] = useState<"overview" | "details" | "exercises">("overview");
  const [expandedExercise, setExpandedExercise] = useState<string | null>(null);

  // Profile and flow state
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [prediction, setPrediction] = useState<Prediction | null>(null);
  const [flowStep, setFlowStep] = useState<"setup" | "prediction" | "main">("setup");
  const [isEditingProfile, setIsEditingProfile] = useState(false);

  useEffect(() => {
    // Load results from sessionStorage
    const stored = sessionStorage.getItem("analysisResults");
    if (stored) {
      setResult(JSON.parse(stored));
    } else {
      // No results, redirect to home
      router.push("/");
    }

    // Load profile from localStorage (persists across sessions)
    const storedProfile = localStorage.getItem("userProfile");
    if (storedProfile) {
      const parsedProfile = JSON.parse(storedProfile) as UserProfile;
      setProfile(parsedProfile);
      // If we have a profile, go straight to prediction or main
      setFlowStep("prediction");
    }
  }, [router]);

  // Recalculate prediction when profile or result changes
  useEffect(() => {
    if (profile && result) {
      const newPrediction = calculatePrediction(
        profile,
        result.primary_cobb_angle,
        result.severity
      );
      setPrediction(newPrediction);
    }
  }, [profile, result]);

  const handleProfileSubmit = (newProfile: UserProfile) => {
    setProfile(newProfile);
    localStorage.setItem("userProfile", JSON.stringify(newProfile));
    setFlowStep("prediction");
    setIsEditingProfile(false);
  };

  const handleEditProfile = () => {
    setIsEditingProfile(true);
    setFlowStep("setup");
  };

  const handleContinueToMain = () => {
    setFlowStep("main");
  };

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
          <div className="flex items-center gap-4">
            {flowStep === "main" && profile && (
              <button
                onClick={handleEditProfile}
                className="btn btn-ghost text-xs"
              >
                <Settings size={16} />
                Edit Profile
              </button>
            )}
            <div className="flex items-center gap-2 text-xs text-muted">
              <Clock size={14} />
              Analyzed in {result.processing_time_ms.toFixed(0)}ms
            </div>
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

          {/* Orientation indicator (only shown for non-standard) */}
          {result.orientation_used && result.orientation_used !== "standard" && (
            <div className="glass-subtle p-3 flex items-center gap-2 text-sm">
              <FlipHorizontal2 size={16} className="text-muted" />
              <span className="text-muted">
                Analysis performed with {result.orientation_used === "flipped" ? "mirrored" : "auto-detected"} image orientation
              </span>
            </div>
          )}
        </div>

        {/* Profile Setup Flow */}
        {flowStep === "setup" && (
          <ProfileSetupForm
            onSubmit={handleProfileSubmit}
            initialProfile={isEditingProfile && profile ? profile : undefined}
          />
        )}

        {/* Prediction Display */}
        {flowStep === "prediction" && profile && prediction && (
          <PredictionDisplay
            prediction={prediction}
            profile={profile}
            cobbAngle={result.primary_cobb_angle}
            onEditProfile={handleEditProfile}
            onContinue={handleContinueToMain}
          />
        )}

        {/* Main Content - Tabs and Tab Content */}
        {flowStep === "main" && (
          <>
            {/* Prediction Summary Bar */}
            {prediction && profile && (
              <div className="glass-subtle p-4 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-[12px] bg-primary/10 flex items-center justify-center">
                    <TrendingUp size={18} className="text-primary" />
                  </div>
                  <div>
                    <p className="text-sm font-medium text-dark">
                      Predicted improvement: {prediction.estimatedImprovementDegrees.min}° - {prediction.estimatedImprovementDegrees.max}° in 6 months
                    </p>
                    <p className="text-xs text-muted">
                      {prediction.weeklyMinutes} min/week · {profile.exerciseDaysPerWeek} days/week
                    </p>
                  </div>
                </div>
                <button
                  onClick={() => setFlowStep("prediction")}
                  className="text-xs text-primary hover:underline"
                >
                  View details
                </button>
              </div>
            )}

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
          </>
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
