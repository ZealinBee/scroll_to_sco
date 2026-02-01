/**
 * Gamification System for Exercise Tracking
 *
 * Features:
 * - Weekly streak tracking based on user's exercise goal
 * - Daily routine completion logging
 * - Streak freeze (1 per month) to protect streaks
 * - Progress history for analytics
 */

// ============================================
// DATA MODELS
// ============================================

export interface ExerciseCompletion {
  id: string;
  exerciseId: string;
  completedAt: string; // ISO datetime
  routineSection?: "warmup" | "main" | "cooldown";
}

export interface DayLog {
  date: string; // YYYY-MM-DD
  completedExercises: ExerciseCompletion[];
  routineCompleted: boolean;
}

export interface WeekLog {
  weekStart: string; // Monday YYYY-MM-DD
  weekEnd: string; // Sunday YYYY-MM-DD
  daysExercised: number;
  goalDays: number;
  goalMet: boolean;
  dayLogs: DayLog[];
}

export interface StreakData {
  currentStreak: number;
  longestStreak: number;
  lastWeekCompleted: string | null; // weekStart of last completed week
  streakFreezeAvailable: boolean;
  streakFreezeUsedThisMonth: string | null; // ISO date when used
  weekHistory: WeekLog[];
}

export interface NotificationSettings {
  enabled: boolean;
  reminderTime: string; // HH:MM 24-hour format
  permission: "default" | "granted" | "denied";
}

export interface GamificationState {
  streakData: StreakData;
  currentWeek: WeekLog;
  notifications: NotificationSettings;
  lastUpdated: string; // ISO datetime
}

// ============================================
// CONSTANTS
// ============================================

const STORAGE_KEY = "gamificationState";
const DEFAULT_GOAL_DAYS = 4;
const DEFAULT_REMINDER_TIME = "09:00";

// ============================================
// DATE UTILITIES
// ============================================

/**
 * Get the Monday of the week for a given date
 */
export function getWeekStart(date: Date = new Date()): string {
  const d = new Date(date);
  const day = d.getDay();
  const diff = d.getDate() - day + (day === 0 ? -6 : 1); // Adjust for Sunday
  d.setDate(diff);
  d.setHours(0, 0, 0, 0);
  return d.toISOString().split("T")[0];
}

/**
 * Get the Sunday of the week for a given date
 */
export function getWeekEnd(date: Date = new Date()): string {
  const d = new Date(date);
  const day = d.getDay();
  const diff = d.getDate() + (day === 0 ? 0 : 7 - day);
  d.setDate(diff);
  d.setHours(23, 59, 59, 999);
  return d.toISOString().split("T")[0];
}

/**
 * Get today's date in YYYY-MM-DD format
 */
export function getToday(): string {
  return new Date().toISOString().split("T")[0];
}

/**
 * Get the current month in YYYY-MM format
 */
export function getCurrentMonth(): string {
  return new Date().toISOString().slice(0, 7);
}

/**
 * Check if a date string is in the current month
 */
export function isCurrentMonth(dateStr: string | null): boolean {
  if (!dateStr) return false;
  return dateStr.slice(0, 7) === getCurrentMonth();
}

/**
 * Get day of week index (0 = Monday, 6 = Sunday)
 */
export function getDayOfWeekIndex(dateStr: string): number {
  const date = new Date(dateStr + "T12:00:00"); // Use noon to avoid timezone issues
  const day = date.getDay();
  return day === 0 ? 6 : day - 1; // Convert Sunday (0) to 6, Monday (1) to 0
}

/**
 * Check if a week has ended (it's past Sunday)
 */
export function hasWeekEnded(weekStart: string): boolean {
  const weekEnd = new Date(weekStart);
  weekEnd.setDate(weekEnd.getDate() + 7);
  return new Date() >= weekEnd;
}

// ============================================
// STATE INITIALIZATION
// ============================================

/**
 * Create initial gamification state for a new user
 */
export function initializeGamificationState(goalDays: number = DEFAULT_GOAL_DAYS): GamificationState {
  const today = getToday();
  const weekStart = getWeekStart();
  const weekEnd = getWeekEnd();

  return {
    streakData: {
      currentStreak: 0,
      longestStreak: 0,
      lastWeekCompleted: null,
      streakFreezeAvailable: true,
      streakFreezeUsedThisMonth: null,
      weekHistory: [],
    },
    currentWeek: {
      weekStart,
      weekEnd,
      daysExercised: 0,
      goalDays,
      goalMet: false,
      dayLogs: [],
    },
    notifications: {
      enabled: false,
      reminderTime: DEFAULT_REMINDER_TIME,
      permission: "default",
    },
    lastUpdated: new Date().toISOString(),
  };
}

// ============================================
// STORAGE OPERATIONS
// ============================================

/**
 * Load gamification state from localStorage
 */
export function loadGamificationState(): GamificationState | null {
  if (typeof window === "undefined") return null;

  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (!stored) return null;

    const state = JSON.parse(stored) as GamificationState;

    // Check and reset streak freeze at month boundary
    if (state.streakData.streakFreezeUsedThisMonth &&
        !isCurrentMonth(state.streakData.streakFreezeUsedThisMonth)) {
      state.streakData.streakFreezeAvailable = true;
      state.streakData.streakFreezeUsedThisMonth = null;
    }

    return state;
  } catch (e) {
    console.error("Failed to load gamification state:", e);
    return null;
  }
}

/**
 * Save gamification state to localStorage
 */
export function saveGamificationState(state: GamificationState): void {
  if (typeof window === "undefined") return;

  try {
    state.lastUpdated = new Date().toISOString();
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  } catch (e) {
    console.error("Failed to save gamification state:", e);
  }
}

// ============================================
// COMPLETION TRACKING
// ============================================

/**
 * Mark today's routine as complete
 */
export function markDayComplete(state: GamificationState): GamificationState {
  const today = getToday();
  const newState = { ...state };

  // Check if already completed today
  const existingLog = newState.currentWeek.dayLogs.find(log => log.date === today);
  if (existingLog?.routineCompleted) {
    return state; // Already completed
  }

  // Update or create day log
  if (existingLog) {
    existingLog.routineCompleted = true;
  } else {
    newState.currentWeek.dayLogs.push({
      date: today,
      completedExercises: [],
      routineCompleted: true,
    });
  }

  // Update days exercised count
  newState.currentWeek.daysExercised = newState.currentWeek.dayLogs.filter(
    log => log.routineCompleted
  ).length;

  // Check if goal is met
  newState.currentWeek.goalMet =
    newState.currentWeek.daysExercised >= newState.currentWeek.goalDays;

  return newState;
}

/**
 * Unmark today's routine (undo completion)
 */
export function unmarkDayComplete(state: GamificationState): GamificationState {
  const today = getToday();
  const newState = { ...state };

  const existingLog = newState.currentWeek.dayLogs.find(log => log.date === today);
  if (existingLog) {
    existingLog.routineCompleted = false;
  }

  // Update days exercised count
  newState.currentWeek.daysExercised = newState.currentWeek.dayLogs.filter(
    log => log.routineCompleted
  ).length;

  // Check if goal is met
  newState.currentWeek.goalMet =
    newState.currentWeek.daysExercised >= newState.currentWeek.goalDays;

  return newState;
}

/**
 * Check if today is already marked as complete
 */
export function isTodayComplete(state: GamificationState): boolean {
  const today = getToday();
  const dayLog = state.currentWeek.dayLogs.find(log => log.date === today);
  return dayLog?.routineCompleted ?? false;
}

/**
 * Get completion status for each day of the current week
 * Returns array of 7 booleans (Monday to Sunday)
 */
export function getWeekCompletionStatus(state: GamificationState): boolean[] {
  const result: boolean[] = [false, false, false, false, false, false, false];

  for (const log of state.currentWeek.dayLogs) {
    if (log.routineCompleted) {
      const dayIndex = getDayOfWeekIndex(log.date);
      if (dayIndex >= 0 && dayIndex < 7) {
        result[dayIndex] = true;
      }
    }
  }

  return result;
}

// ============================================
// WEEK TRANSITION & STREAK LOGIC
// ============================================

/**
 * Process week transition - called when loading state to handle week changes
 */
export function processWeekTransition(state: GamificationState): GamificationState {
  const currentWeekStart = getWeekStart();

  // If we're still in the same week, no transition needed
  if (state.currentWeek.weekStart === currentWeekStart) {
    return state;
  }

  const newState = { ...state };

  // Process any completed weeks between last update and now
  let weekToProcess = state.currentWeek;

  while (hasWeekEnded(weekToProcess.weekStart) && weekToProcess.weekStart !== currentWeekStart) {
    // Archive this week
    newState.streakData.weekHistory.push({ ...weekToProcess });

    // Check if goal was met
    if (weekToProcess.goalMet) {
      // Increment streak
      newState.streakData.currentStreak++;
      newState.streakData.lastWeekCompleted = weekToProcess.weekStart;

      // Update longest streak
      if (newState.streakData.currentStreak > newState.streakData.longestStreak) {
        newState.streakData.longestStreak = newState.streakData.currentStreak;
      }
    } else {
      // Goal not met - check for streak freeze
      if (newState.streakData.streakFreezeAvailable && newState.streakData.currentStreak > 0) {
        // Use freeze to protect streak
        newState.streakData.streakFreezeAvailable = false;
        newState.streakData.streakFreezeUsedThisMonth = new Date().toISOString();
        // Streak stays the same
      } else {
        // Reset streak
        newState.streakData.currentStreak = 0;
      }
    }

    // Move to next week
    const nextWeekStart = new Date(weekToProcess.weekStart);
    nextWeekStart.setDate(nextWeekStart.getDate() + 7);

    weekToProcess = {
      weekStart: nextWeekStart.toISOString().split("T")[0],
      weekEnd: getWeekEnd(nextWeekStart),
      daysExercised: 0,
      goalDays: state.currentWeek.goalDays,
      goalMet: false,
      dayLogs: [],
    };
  }

  // Set up current week
  newState.currentWeek = {
    weekStart: currentWeekStart,
    weekEnd: getWeekEnd(),
    daysExercised: 0,
    goalDays: state.currentWeek.goalDays,
    goalMet: false,
    dayLogs: [],
  };

  // Keep only last 12 weeks of history
  if (newState.streakData.weekHistory.length > 12) {
    newState.streakData.weekHistory = newState.streakData.weekHistory.slice(-12);
  }

  return newState;
}

// ============================================
// STREAK FREEZE
// ============================================

/**
 * Check if streak freeze can be used
 */
export function canUseStreakFreeze(state: GamificationState): boolean {
  return state.streakData.streakFreezeAvailable &&
         !isCurrentMonth(state.streakData.streakFreezeUsedThisMonth);
}

/**
 * Manually use streak freeze (optional - it auto-applies on week transition)
 */
export function useStreakFreeze(state: GamificationState): GamificationState {
  if (!canUseStreakFreeze(state)) {
    return state;
  }

  const newState = { ...state };
  newState.streakData.streakFreezeAvailable = false;
  newState.streakData.streakFreezeUsedThisMonth = new Date().toISOString();

  return newState;
}

// ============================================
// SETTINGS
// ============================================

/**
 * Update weekly goal
 */
export function updateWeeklyGoal(state: GamificationState, goalDays: number): GamificationState {
  const newState = { ...state };
  newState.currentWeek.goalDays = Math.max(1, Math.min(7, goalDays));
  newState.currentWeek.goalMet =
    newState.currentWeek.daysExercised >= newState.currentWeek.goalDays;
  return newState;
}

/**
 * Update notification settings
 */
export function updateNotificationSettings(
  state: GamificationState,
  settings: Partial<NotificationSettings>
): GamificationState {
  const newState = { ...state };
  newState.notifications = { ...newState.notifications, ...settings };
  return newState;
}

// ============================================
// UTILITY FUNCTIONS
// ============================================

/**
 * Get a loading/initialization helper that handles all the setup
 */
export function getOrInitializeState(goalDays?: number): GamificationState {
  let state = loadGamificationState();

  if (!state) {
    state = initializeGamificationState(goalDays);
  } else {
    // Process any pending week transitions
    state = processWeekTransition(state);
  }

  // Update goal if provided
  if (goalDays !== undefined && goalDays !== state.currentWeek.goalDays) {
    state = updateWeeklyGoal(state, goalDays);
  }

  saveGamificationState(state);
  return state;
}

/**
 * Get formatted streak text
 */
export function getStreakText(streak: number): string {
  if (streak === 0) return "Start your streak!";
  if (streak === 1) return "1 week streak";
  return `${streak} week streak`;
}

/**
 * Get day names for the week
 */
export function getDayNames(): string[] {
  return ["M", "T", "W", "T", "F", "S", "S"];
}

/**
 * Get today's day index (0 = Monday)
 */
export function getTodayIndex(): number {
  return getDayOfWeekIndex(getToday());
}
