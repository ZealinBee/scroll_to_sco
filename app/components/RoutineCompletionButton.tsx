"use client";

import { Check, Circle } from "lucide-react";
import { useState } from "react";

interface RoutineCompletionButtonProps {
  isComplete: boolean;
  onToggle: () => void;
}

export function RoutineCompletionButton({
  isComplete,
  onToggle,
}: RoutineCompletionButtonProps) {
  const [isAnimating, setIsAnimating] = useState(false);

  const handleClick = () => {
    if (!isComplete) {
      setIsAnimating(true);
      setTimeout(() => setIsAnimating(false), 600);
    }
    onToggle();
  };

  return (
    <button
      onClick={handleClick}
      className={`w-full py-4 px-6 rounded-[16px] flex items-center justify-center gap-3 font-medium transition-all duration-200 ${
        isComplete
          ? "bg-primary/10 text-primary border border-primary/20"
          : "bg-primary text-white hover:bg-primary-light hover:translate-y-[-1px] hover:shadow-md"
      } ${isAnimating ? "scale-95" : ""}`}
    >
      {isComplete ? (
        <>
          <div className="w-6 h-6 rounded-full bg-primary flex items-center justify-center">
            <Check size={14} className="text-white" />
          </div>
          <span>Completed for Today</span>
        </>
      ) : (
        <>
          <Circle size={20} />
          <span>Mark Today Complete</span>
        </>
      )}
    </button>
  );
}
