"use client";

import {
  ExternalLink,
  Play,
  CheckCircle2,
  Wind,
  Target,
  Clock,
  ArrowRight,
} from "lucide-react";
import { RAB_TUTORIAL_URL } from "@/app/lib/breathing-instructions";

interface TutorialModeProps {
  onStartExercise: () => void;
}

export default function TutorialMode({ onStartExercise }: TutorialModeProps) {
  return (
    <div className="space-y-6">
      {/* Hero section */}
      <div className="glass p-6 rounded-[24px] space-y-4">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-[16px] bg-primary/10 flex items-center justify-center">
            <Wind size={24} className="text-primary" />
          </div>
          <div>
            <h2 className="text-xl font-semibold text-dark">
              Rotational Angular Breathing
            </h2>
            <p className="text-sm text-muted">Schroth Method Technique</p>
          </div>
        </div>

        <p className="text-muted leading-relaxed">
          Rotational Angular Breathing (RAB) is a core component of the Schroth Method,
          designed specifically for scoliosis correction. This technique uses targeted
          breathing to expand collapsed areas of the ribcage and de-rotate the spine.
        </p>

        {/* Video tutorial link */}
        <a
          href={RAB_TUTORIAL_URL}
          target="_blank"
          rel="noopener noreferrer"
          className="flex items-center gap-4 p-4 rounded-[16px] bg-dark/5 hover:bg-dark/10 transition-all duration-200 group"
        >
          <div className="w-16 h-16 rounded-[12px] bg-dark/10 flex items-center justify-center group-hover:bg-primary/10 transition-colors duration-200">
            <Play size={24} className="text-dark group-hover:text-primary transition-colors duration-200" />
          </div>
          <div className="flex-1">
            <p className="font-medium text-dark">Watch Tutorial Video</p>
            <p className="text-sm text-muted">
              Learn the fundamentals from a physical therapist
            </p>
          </div>
          <ExternalLink size={18} className="text-muted group-hover:text-primary transition-colors duration-200" />
        </a>
      </div>

      {/* Benefits */}
      <div className="glass-subtle p-5 rounded-[20px] space-y-4">
        <h3 className="font-medium text-dark">Benefits of RAB</h3>
        <div className="space-y-3">
          {[
            {
              icon: Target,
              title: "Targeted Expansion",
              description:
                "Expands collapsed areas of the ribcage on the concave side of your curve",
            },
            {
              icon: Wind,
              title: "Spine De-rotation",
              description:
                "Helps unwind the rotational component of scoliosis through breath",
            },
            {
              icon: CheckCircle2,
              title: "Postural Awareness",
              description:
                "Develops body awareness and proprioception for better posture",
            },
            {
              icon: Clock,
              title: "Progressive Results",
              description:
                "Regular practice can lead to improved alignment over time",
            },
          ].map((benefit, i) => (
            <div key={i} className="flex items-start gap-3">
              <div className="p-1.5 rounded-[8px] bg-primary/10 flex-shrink-0">
                <benefit.icon size={14} className="text-primary" />
              </div>
              <div>
                <p className="text-sm font-medium text-dark">{benefit.title}</p>
                <p className="text-xs text-muted">{benefit.description}</p>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* How it works */}
      <div className="glass-subtle p-5 rounded-[20px] space-y-4">
        <h3 className="font-medium text-dark">How It Works</h3>
        <div className="space-y-3">
          <div className="flex items-start gap-3">
            <span className="w-6 h-6 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0 text-xs font-medium text-primary">
              1
            </span>
            <div>
              <p className="text-sm text-dark">
                <span className="font-medium">Identify your curve</span> - The app
                determines which side of your ribcage needs expansion based on your
                analysis.
              </p>
            </div>
          </div>
          <div className="flex items-start gap-3">
            <span className="w-6 h-6 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0 text-xs font-medium text-primary">
              2
            </span>
            <div>
              <p className="text-sm text-dark">
                <span className="font-medium">Directed breathing</span> - During
                inhalation, you consciously direct your breath into the collapsed
                (concave) side.
              </p>
            </div>
          </div>
          <div className="flex items-start gap-3">
            <span className="w-6 h-6 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0 text-xs font-medium text-primary">
              3
            </span>
            <div>
              <p className="text-sm text-dark">
                <span className="font-medium">Rotational correction</span> - During
                exhalation, a subtle de-rotation movement helps address the spinal
                twist.
              </p>
            </div>
          </div>
          <div className="flex items-start gap-3">
            <span className="w-6 h-6 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0 text-xs font-medium text-primary">
              4
            </span>
            <div>
              <p className="text-sm text-dark">
                <span className="font-medium">Repeat</span> - Regular practice
                (10-15 breath cycles, multiple times daily) reinforces the corrective
                pattern.
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Tips before starting */}
      <div className="glass-subtle p-5 rounded-[20px] space-y-3">
        <h3 className="font-medium text-dark">Before You Start</h3>
        <ul className="space-y-2">
          {[
            "Find a comfortable position - sitting or lying down",
            "Wear loose, comfortable clothing",
            "Have a mirror nearby if possible to verify your form",
            "Start with a few practice breaths to settle in",
          ].map((tip, i) => (
            <li key={i} className="flex items-start gap-2 text-sm text-muted">
              <CheckCircle2 size={14} className="text-primary mt-0.5 flex-shrink-0" />
              {tip}
            </li>
          ))}
        </ul>
      </div>

      {/* Start button */}
      <button
        onClick={onStartExercise}
        className="btn btn-primary w-full py-4"
      >
        <span>Start Exercise</span>
        <ArrowRight size={18} />
      </button>
    </div>
  );
}
