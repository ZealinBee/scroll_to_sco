"use client";

import { Check, Circle } from "lucide-react";
import { useState, useEffect, useCallback } from "react";

interface RoutineCompletionButtonProps {
  isComplete: boolean;
  onToggle: () => void;
}

interface Splatter {
  id: number;
  x: number;
  y: number;
  size: number;
  rotation: number;
  delay: number;
  color: string;
}

const GRAFFITI_COLORS = [
  "#3F9B61", // primary
  "#4CAF73", // primary-light
  "#357F50", // primary-dark
  "#6BC985", // lighter green
  "#2D6B43", // darker green
];

export function RoutineCompletionButton({
  isComplete,
  onToggle,
}: RoutineCompletionButtonProps) {
  const [isAnimating, setIsAnimating] = useState(false);
  const [splatters, setSplatters] = useState<Splatter[]>([]);
  const [showCelebration, setShowCelebration] = useState(false);

  const generateSplatters = useCallback(() => {
    const newSplatters: Splatter[] = [];
    const count = 12;

    for (let i = 0; i < count; i++) {
      newSplatters.push({
        id: i,
        x: Math.random() * 100,
        y: Math.random() * 100,
        size: 20 + Math.random() * 40,
        rotation: Math.random() * 360,
        delay: Math.random() * 0.3,
        color: GRAFFITI_COLORS[Math.floor(Math.random() * GRAFFITI_COLORS.length)],
      });
    }
    return newSplatters;
  }, []);

  const handleClick = () => {
    if (!isComplete) {
      setIsAnimating(true);
      setShowCelebration(true);
      setSplatters(generateSplatters());

      setTimeout(() => setIsAnimating(false), 600);
      setTimeout(() => {
        setShowCelebration(false);
        setSplatters([]);
      }, 1500);
    }
    onToggle();
  };

  return (
    <div className="relative">
      {/* Graffiti Celebration Overlay */}
      {showCelebration && (
        <div className="absolute inset-0 pointer-events-none overflow-visible z-10">
          {/* Paint splatters */}
          {splatters.map((splatter) => (
            <div
              key={splatter.id}
              className="absolute animate-splatter"
              style={{
                left: `${splatter.x}%`,
                top: `${splatter.y}%`,
                animationDelay: `${splatter.delay}s`,
              }}
            >
              <svg
                width={splatter.size}
                height={splatter.size}
                viewBox="0 0 100 100"
                style={{
                  transform: `rotate(${splatter.rotation}deg)`,
                  filter: "drop-shadow(0 2px 4px rgba(0,0,0,0.1))",
                }}
              >
                <path
                  d="M50 10 C60 20, 80 25, 85 40 C90 55, 75 70, 65 75 C55 80, 45 85, 35 80 C25 75, 15 60, 20 45 C25 30, 40 15, 50 10 Z"
                  fill={splatter.color}
                  opacity="0.85"
                />
                {/* Drip effect */}
                <ellipse
                  cx={50 + Math.random() * 20 - 10}
                  cy={85}
                  rx={4}
                  ry={8}
                  fill={splatter.color}
                  opacity="0.7"
                />
              </svg>
            </div>
          ))}

          {/* Spray particles */}
          {Array.from({ length: 20 }).map((_, i) => (
            <div
              key={`particle-${i}`}
              className="absolute w-2 h-2 rounded-full animate-spray"
              style={{
                left: "50%",
                top: "50%",
                backgroundColor: GRAFFITI_COLORS[i % GRAFFITI_COLORS.length],
                animationDelay: `${i * 0.05}s`,
                "--tx": `${(Math.random() - 0.5) * 200}px`,
                "--ty": `${(Math.random() - 0.5) * 200}px`,
              } as React.CSSProperties}
            />
          ))}
        </div>
      )}

      <button
        onClick={handleClick}
        className={`w-full py-4 px-6 rounded-[16px] flex items-center justify-center gap-3 font-medium transition-all duration-200 relative ${
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

      <style jsx>{`
        @keyframes splatter {
          0% {
            transform: scale(0) rotate(0deg);
            opacity: 0;
          }
          50% {
            transform: scale(1.2) rotate(10deg);
            opacity: 1;
          }
          100% {
            transform: scale(1) rotate(5deg);
            opacity: 0;
          }
        }

        @keyframes spray {
          0% {
            transform: translate(-50%, -50%) scale(0);
            opacity: 1;
          }
          100% {
            transform: translate(
              calc(-50% + var(--tx)),
              calc(-50% + var(--ty))
            ) scale(1);
            opacity: 0;
          }
        }

        .animate-splatter {
          animation: splatter 1.2s ease-out forwards;
        }

        .animate-spray {
          animation: spray 0.8s ease-out forwards;
        }
      `}</style>
    </div>
  );
}
