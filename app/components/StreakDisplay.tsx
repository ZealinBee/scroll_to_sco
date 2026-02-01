"use client";

import { Flame, Snowflake } from "lucide-react";

interface StreakDisplayProps {
  streak: number;
  freezeAvailable: boolean;
  compact?: boolean;
}

export function StreakDisplay({ streak, freezeAvailable, compact = false }: StreakDisplayProps) {
  if (compact) {
    return (
      <div className="flex items-center gap-2">
        <div className="flex items-center gap-1.5">
          <Flame
            size={18}
            className={streak > 0 ? "text-primary animate-flame" : "text-muted"}
          />
          <span className={`text-lg font-semibold ${streak > 0 ? "text-dark" : "text-muted"}`}>
            {streak}
          </span>
        </div>
        {freezeAvailable && (
          <Snowflake size={14} className="text-blue-400" />
        )}
      </div>
    );
  }

  return (
    <div className="glass-subtle p-4 flex items-center gap-3">
      <div
        className={`w-10 h-10 rounded-[12px] flex items-center justify-center ${
          streak > 0 ? "bg-primary/10" : "bg-dark/5"
        }`}
      >
        <Flame
          size={20}
          className={streak > 0 ? "text-primary animate-flame" : "text-muted"}
        />
      </div>
      <div className="flex-1">
        <p className={`text-xl font-semibold ${streak > 0 ? "text-dark" : "text-muted"}`}>
          {streak > 0 ? `${streak} week${streak > 1 ? "s" : ""}` : "No streak"}
        </p>
        <p className="text-xs text-muted">
          {streak > 0 ? "Keep it going!" : "Complete your weekly goal"}
        </p>
      </div>
      {freezeAvailable && (
        <div className="flex items-center gap-1 px-2 py-1 bg-blue-50 rounded-[8px]">
          <Snowflake size={14} className="text-blue-400" />
          <span className="text-xs text-blue-600">Freeze</span>
        </div>
      )}
    </div>
  );
}
