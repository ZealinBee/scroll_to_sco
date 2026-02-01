"use client";

import {
  User,
  Hand,
  Footprints,
  Ruler,
  Sun,
  Shirt,
  CheckCircle2,
  Lightbulb,
  Camera,
  ChevronLeft,
} from "lucide-react";

interface PhotoGuidanceProps {
  onReady: () => void;
  onBack: () => void;
}

const guidelines = [
  {
    icon: User,
    text: "Stand with your back facing the camera",
    detail: "Your full back should be visible",
  },
  {
    icon: Hand,
    text: "Keep arms relaxed at your sides",
    detail: "Don't cross arms or put hands on hips",
  },
  {
    icon: Footprints,
    text: "Stand naturally - don't try to correct your posture",
    detail: "We want to see your natural stance",
  },
  {
    icon: Ruler,
    text: "Camera should be 4-6 feet away, at torso height",
    detail: "Not too close, not too far",
  },
  {
    icon: Sun,
    text: "Ensure good, even lighting",
    detail: "Avoid harsh shadows on your back",
  },
  {
    icon: Shirt,
    text: "Bare back or tight-fitting clothing works best",
    detail: "Loose clothing can hide posture details",
  },
];

const tips = [
  "Have someone else take the photo",
  "Frame should show neck to hips",
  "Keep your head facing forward",
  "Stand on a flat, level surface",
];

export default function PhotoGuidance({ onReady, onBack }: PhotoGuidanceProps) {
  return (
    <div className="glass p-6 space-y-6">
      {/* Header */}
      <div className="text-center space-y-2">
        <div className="w-12 h-12 mx-auto rounded-[16px] bg-primary/10 flex items-center justify-center">
          <Camera size={24} className="text-primary" />
        </div>
        <h2 className="text-xl font-semibold text-dark">
          How to Take the Best Photo
        </h2>
        <p className="text-sm text-muted leading-relaxed">
          Follow these guidelines for the most accurate screening results
        </p>
      </div>

      {/* Guidelines Checklist */}
      <div className="space-y-3">
        {guidelines.map((item, index) => (
          <div
            key={index}
            className="flex items-start gap-3 p-3 rounded-[12px] bg-primary/5 hover:bg-primary/10 transition-colors"
          >
            <div className="w-8 h-8 rounded-[10px] bg-primary/10 flex items-center justify-center flex-shrink-0 mt-0.5">
              <item.icon size={16} className="text-primary" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-dark">{item.text}</p>
              <p className="text-xs text-muted mt-0.5">{item.detail}</p>
            </div>
            <CheckCircle2 size={18} className="text-primary/40 flex-shrink-0 mt-1" />
          </div>
        ))}
      </div>

      {/* Tips Section */}
      <div className="glass-subtle p-4 space-y-3">
        <div className="flex items-center gap-2">
          <Lightbulb size={16} className="text-primary" />
          <span className="text-sm font-medium text-dark">Quick Tips</span>
        </div>
        <ul className="space-y-2">
          {tips.map((tip, index) => (
            <li key={index} className="flex items-center gap-2 text-sm text-muted">
              <span className="w-1.5 h-1.5 rounded-full bg-primary/60 flex-shrink-0" />
              {tip}
            </li>
          ))}
        </ul>
      </div>

      {/* Disclaimer */}
      <div className="p-3 rounded-[12px] border border-primary/20 bg-primary/5">
        <p className="text-xs text-muted leading-relaxed">
          <span className="font-medium text-dark">Note:</span> This is a screening tool only,
          not a medical diagnosis. Results should be confirmed by a healthcare professional.
        </p>
      </div>

      {/* Action Buttons */}
      <div className="flex gap-3">
        <button onClick={onBack} className="btn btn-secondary flex-1">
          <ChevronLeft size={18} />
          Back
        </button>
        <button onClick={onReady} className="btn btn-primary flex-1">
          <Camera size={18} />
          I&apos;m Ready
        </button>
      </div>
    </div>
  );
}
