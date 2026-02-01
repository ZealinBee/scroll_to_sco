"use client";

import { useState, useEffect, useCallback } from "react";
import { Info, X, Sparkles, Lightbulb } from "lucide-react";
import { createPortal } from "react-dom";

interface TipWithExplanationProps {
  tip: string;
  explanation: string;
}

// Modal component that renders in a portal
function ExplanationModal({
  tip,
  explanation,
  onClose,
}: {
  tip: string;
  explanation: string;
  onClose: () => void;
}) {
  // Close on escape key
  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    document.addEventListener("keydown", handleEscape);
    return () => document.removeEventListener("keydown", handleEscape);
  }, [onClose]);

  // Prevent body scroll when modal is open
  useEffect(() => {
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = "";
    };
  }, []);

  return createPortal(
    <div
      className="fixed inset-0 z-[100] flex items-center justify-center p-4"
      role="dialog"
      aria-modal="true"
    >
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-dark/40 backdrop-blur-sm animate-fade-in"
        onClick={onClose}
      />

      {/* Modal */}
      <div className="relative w-full max-w-md glass rounded-[24px] shadow-2xl border border-white/30 animate-scale-in overflow-hidden">
        {/* Header */}
        <div className="flex items-center gap-3 p-5 pb-4 border-b border-dark/5">
          <div className="w-10 h-10 rounded-[12px] bg-primary/10 flex items-center justify-center flex-shrink-0">
            <Lightbulb size={20} className="text-primary" />
          </div>
          <div className="flex-1 min-w-0">
            <h3 className="text-sm font-semibold text-dark">Why This Works</h3>
            <p className="text-xs text-muted">Scientific reasoning</p>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full flex items-center justify-center hover:bg-dark/5 text-muted hover:text-dark transition-colors"
            aria-label="Close"
          >
            <X size={18} />
          </button>
        </div>

        {/* Content */}
        <div className="p-5 space-y-4">
          {/* The tip */}
          <div className="bg-primary/5 rounded-[12px] p-3">
            <p className="text-sm text-dark font-medium leading-relaxed">{tip}</p>
          </div>

          {/* The explanation */}
          <p className="text-sm text-muted leading-relaxed">{explanation}</p>
        </div>

        {/* Footer */}
        <div className="px-5 pb-5">
          <button
            onClick={onClose}
            className="w-full btn btn-primary"
          >
            Got it
          </button>
        </div>
      </div>
    </div>,
    document.body
  );
}

export default function TipWithExplanation({
  tip,
  explanation,
}: TipWithExplanationProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [mounted, setMounted] = useState(false);

  // Only render portal after mount (for SSR)
  useEffect(() => {
    setMounted(true);
  }, []);

  const handleClose = useCallback(() => setIsOpen(false), []);

  return (
    <>
      <button
        onClick={() => setIsOpen(true)}
        className="w-full flex items-start gap-3 p-2 -m-2 rounded-[12px] hover:bg-primary/5 transition-colors text-left group"
      >
        <Sparkles size={14} className="text-primary mt-0.5 flex-shrink-0" />
        <span className="text-sm text-muted flex-1 group-hover:text-dark transition-colors">
          {tip}
        </span>
        <div className="w-6 h-6 rounded-full bg-dark/5 group-hover:bg-primary/10 flex items-center justify-center flex-shrink-0 transition-colors">
          <Info size={12} className="text-muted group-hover:text-primary transition-colors" />
        </div>
      </button>

      {mounted && isOpen && (
        <ExplanationModal
          tip={tip}
          explanation={explanation}
          onClose={handleClose}
        />
      )}
    </>
  );
}

// Simple wrapper for array of tips
interface TipListProps {
  tips: Array<{ tip: string; explanation: string }>;
}

export function TipList({ tips }: TipListProps) {
  return (
    <div className="space-y-1">
      {tips.map((t, i) => (
        <TipWithExplanation key={i} tip={t.tip} explanation={t.explanation} />
      ))}
    </div>
  );
}
