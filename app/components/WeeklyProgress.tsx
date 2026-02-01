"use client";

import { getDayNames, getTodayIndex } from "@/app/lib/gamification";

interface WeeklyProgressProps {
  completionStatus: boolean[]; // 7 booleans, Monday to Sunday
  daysCompleted: number;
  goalDays: number;
}

export function WeeklyProgress({
  completionStatus,
  daysCompleted,
  goalDays,
}: WeeklyProgressProps) {
  const dayNames = getDayNames();
  const todayIndex = getTodayIndex();
  const goalMet = daysCompleted >= goalDays;

  return (
    <div className="glass p-4 space-y-3">
      <div className="flex items-center justify-between">
        <p className="text-sm font-medium text-dark">This Week</p>
        <p className={`text-sm ${goalMet ? "text-primary font-medium" : "text-muted"}`}>
          {daysCompleted}/{goalDays} days
          {goalMet && " ✓"}
        </p>
      </div>

      <div className="flex justify-between">
        {dayNames.map((day, index) => {
          const isCompleted = completionStatus[index];
          const isToday = index === todayIndex;
          const isPast = index < todayIndex;
          const isFuture = index > todayIndex;

          let circleClass =
            "w-9 h-9 rounded-full flex items-center justify-center text-xs font-medium transition-all";

          if (isCompleted) {
            // Completed day - solid primary
            circleClass += " bg-primary text-white shadow-sm";
          } else if (isToday) {
            // Today but not completed - ring outline
            circleClass += " border-2 border-primary text-primary bg-primary/5";
          } else if (isPast) {
            // Past day, not completed - muted/missed
            circleClass += " bg-dark/5 text-muted";
          } else {
            // Future day - light background
            circleClass += " bg-light text-muted";
          }

          return (
            <div key={index} className="flex flex-col items-center gap-1">
              <div className={circleClass}>{day}</div>
              {isToday && (
                <div className="w-1 h-1 rounded-full bg-primary" />
              )}
            </div>
          );
        })}
      </div>

      {/* Progress bar */}
      <div className="h-1.5 bg-dark/5 rounded-full overflow-hidden">
        <div
          className="h-full bg-primary rounded-full transition-all duration-300"
          style={{ width: `${Math.min((daysCompleted / goalDays) * 100, 100)}%` }}
        />
      </div>
    </div>
  );
}
