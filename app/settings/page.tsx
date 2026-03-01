"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import {
  ArrowLeft,
  Bell,
  BellOff,
  Calendar,
  Clock,
  LogOut,
  Snowflake,
  Target,
  User,
} from "lucide-react";
import {
  GamificationState,
  loadGamificationState,
  saveGamificationState,
  updateWeeklyGoal,
  updateNotificationSettings,
  canUseStreakFreeze,
  initializeGamificationState,
} from "@/app/lib/gamification";
import { signOut } from "@/app/auth/actions";
import { useAuth } from "@/app/components/AuthSyncProvider";
import {
  isNotificationSupported,
  getNotificationPermission,
  enableNotifications,
  disableNotifications,
} from "@/app/lib/notifications";

export default function SettingsPage() {
  const router = useRouter();
  const [state, setState] = useState<GamificationState | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [notificationSupported, setNotificationSupported] = useState(false);
  const { user, isLoading: authLoading } = useAuth();

  // Load state on mount
  useEffect(() => {
    const loadedState = loadGamificationState();
    if (loadedState) {
      setState(loadedState);
    } else {
      // Get user profile to initialize with correct goal
      const userProfileStr = localStorage.getItem("userProfile");
      const userProfile = userProfileStr ? JSON.parse(userProfileStr) : null;
      const goalDays = userProfile?.exerciseDaysPerWeek || 4;
      const newState = initializeGamificationState(goalDays);
      setState(newState);
      saveGamificationState(newState);
    }

    setNotificationSupported(isNotificationSupported());
    setIsLoading(false);
  }, []);

  // Save state when it changes
  useEffect(() => {
    if (state) {
      saveGamificationState(state);
    }
  }, [state]);

  const handleGoalChange = (newGoal: number) => {
    if (!state) return;
    const updatedState = updateWeeklyGoal(state, newGoal);
    setState(updatedState);

    // Also update userProfile in localStorage
    const userProfileStr = localStorage.getItem("userProfile");
    if (userProfileStr) {
      const userProfile = JSON.parse(userProfileStr);
      userProfile.exerciseDaysPerWeek = newGoal;
      localStorage.setItem("userProfile", JSON.stringify(userProfile));
    }
  };

  const handleNotificationToggle = async () => {
    if (!state) return;

    if (state.notifications.enabled) {
      // Disable notifications
      const updatedSettings = disableNotifications(state.notifications);
      const updatedState = updateNotificationSettings(state, updatedSettings);
      setState(updatedState);
    } else {
      // Enable notifications (will request permission if needed)
      const updatedSettings = await enableNotifications(state.notifications);
      const updatedState = updateNotificationSettings(state, updatedSettings);
      setState(updatedState);
    }
  };

  const handleTimeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!state) return;
    const updatedState = updateNotificationSettings(state, {
      reminderTime: e.target.value,
    });
    setState(updatedState);
  };

  if (isLoading || authLoading || !state) {
    return (
      <div className="min-h-screen bg-light flex items-center justify-center">
        <div className="animate-pulse text-muted">Loading...</div>
      </div>
    );
  }

  const freezeAvailable = canUseStreakFreeze(state);
  const freezeUsedDate = state.streakData.streakFreezeUsedThisMonth
    ? new Date(state.streakData.streakFreezeUsedThisMonth).toLocaleDateString()
    : null;

  return (
    <div className="min-h-screen bg-light">
      {/* Header */}
      <div className="sticky top-0 z-10 bg-light/80 backdrop-blur-lg border-b border-dark/5">
        <div className="max-w-lg mx-auto px-4 py-4 flex items-center gap-4">
          <button
            onClick={() => router.push("/journey")}
            className="p-2 -ml-2 rounded-[12px] hover:bg-dark/5 transition-colors"
          >
            <ArrowLeft size={20} className="text-dark" />
          </button>
          <h1 className="text-xl font-semibold text-dark">Settings</h1>
        </div>
      </div>

      <div className="max-w-lg mx-auto px-4 py-6 space-y-6">
        {/* Notifications Section */}
        <section className="glass p-5 space-y-4">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-[10px] bg-primary/10 flex items-center justify-center">
              <Bell size={18} className="text-primary" />
            </div>
            <h2 className="text-lg font-semibold text-dark">Notifications</h2>
          </div>

          {notificationSupported ? (
            <>
              {/* Toggle */}
              <div className="flex items-center justify-between py-2">
                <div>
                  <p className="text-sm font-medium text-dark">Daily reminder</p>
                  <p className="text-xs text-muted">
                    Get notified to do your exercises
                  </p>
                </div>
                <button
                  onClick={handleNotificationToggle}
                  className={`relative w-12 h-7 rounded-full transition-colors ${
                    state.notifications.enabled
                      ? "bg-primary"
                      : "bg-dark/20"
                  }`}
                >
                  <div
                    className={`absolute top-1 w-5 h-5 rounded-full bg-white shadow-sm transition-transform ${
                      state.notifications.enabled
                        ? "translate-x-6"
                        : "translate-x-1"
                    }`}
                  />
                </button>
              </div>

              {/* Time Picker */}
              {state.notifications.enabled && (
                <div className="flex items-center justify-between py-2 border-t border-dark/5">
                  <div className="flex items-center gap-2">
                    <Clock size={16} className="text-muted" />
                    <p className="text-sm font-medium text-dark">Reminder time</p>
                  </div>
                  <input
                    type="time"
                    value={state.notifications.reminderTime}
                    onChange={handleTimeChange}
                    className="px-3 py-1.5 rounded-[10px] bg-light border border-dark/10 text-sm text-dark focus:outline-none focus:border-primary"
                  />
                </div>
              )}

              {/* Permission Status */}
              {state.notifications.permission === "denied" && (
                <div className="p-3 rounded-[12px] bg-red-50 border border-red-100">
                  <div className="flex items-start gap-2">
                    <BellOff size={16} className="text-red-500 mt-0.5" />
                    <div>
                      <p className="text-sm font-medium text-red-700">
                        Notifications blocked
                      </p>
                      <p className="text-xs text-red-600 mt-0.5">
                        Enable notifications in your browser settings to receive
                        reminders.
                      </p>
                    </div>
                  </div>
                </div>
              )}
            </>
          ) : (
            <div className="p-3 rounded-[12px] bg-dark/5">
              <p className="text-sm text-muted">
                Notifications are not supported in this browser.
              </p>
            </div>
          )}
        </section>

        {/* Weekly Goal Section */}
        <section className="glass p-5 space-y-4">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-[10px] bg-primary/10 flex items-center justify-center">
              <Target size={18} className="text-primary" />
            </div>
            <h2 className="text-lg font-semibold text-dark">Weekly Goal</h2>
          </div>

          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <p className="text-sm text-dark">Exercise days per week</p>
              <span className="text-2xl font-semibold text-primary">
                {state.currentWeek.goalDays}
              </span>
            </div>

            {/* Slider */}
            <div className="relative">
              <input
                type="range"
                min="1"
                max="7"
                value={state.currentWeek.goalDays}
                onChange={(e) => handleGoalChange(parseInt(e.target.value))}
                className="w-full h-2 bg-dark/10 rounded-full appearance-none cursor-pointer accent-primary"
              />
              <div className="flex justify-between mt-1">
                {[1, 2, 3, 4, 5, 6, 7].map((num) => (
                  <span
                    key={num}
                    className={`text-xs ${
                      num === state.currentWeek.goalDays
                        ? "text-primary font-medium"
                        : "text-muted"
                    }`}
                  >
                    {num}
                  </span>
                ))}
              </div>
            </div>

            <p className="text-xs text-muted">
              Complete {state.currentWeek.goalDays} day
              {state.currentWeek.goalDays > 1 ? "s" : ""} of exercises each week
              to maintain your streak.
            </p>
          </div>
        </section>

        {/* Streak Freeze Section */}
        <section className="glass p-5 space-y-4">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-[10px] bg-blue-50 flex items-center justify-center">
              <Snowflake size={18} className="text-blue-500" />
            </div>
            <h2 className="text-lg font-semibold text-dark">Streak Freeze</h2>
          </div>

          <div className="p-4 rounded-[12px] bg-light border border-dark/5">
            <div className="flex items-start justify-between">
              <div className="space-y-1">
                <p className="text-sm font-medium text-dark">
                  {freezeAvailable ? "Available this month" : "Used this month"}
                </p>
                <p className="text-xs text-muted">
                  {freezeAvailable
                    ? "Automatically protects your streak if you miss a week"
                    : `Used on ${freezeUsedDate}`}
                </p>
              </div>
              <div
                className={`w-10 h-10 rounded-[12px] flex items-center justify-center ${
                  freezeAvailable ? "bg-blue-100" : "bg-dark/5"
                }`}
              >
                <Snowflake
                  size={20}
                  className={freezeAvailable ? "text-blue-500" : "text-muted"}
                />
              </div>
            </div>
          </div>

          <p className="text-xs text-muted">
            You get one streak freeze per month. It&apos;s automatically used if
            you don&apos;t meet your weekly goal.
          </p>
        </section>

        {/* Stats Section */}
        <section className="glass p-5 space-y-4">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-[10px] bg-primary/10 flex items-center justify-center">
              <Calendar size={18} className="text-primary" />
            </div>
            <h2 className="text-lg font-semibold text-dark">Your Stats</h2>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="p-4 rounded-[12px] bg-light border border-dark/5 text-center">
              <p className="text-2xl font-semibold text-primary">
                {state.streakData.currentStreak}
              </p>
              <p className="text-xs text-muted">Current Streak</p>
            </div>
            <div className="p-4 rounded-[12px] bg-light border border-dark/5 text-center">
              <p className="text-2xl font-semibold text-dark">
                {state.streakData.longestStreak}
              </p>
              <p className="text-xs text-muted">Longest Streak</p>
            </div>
            <div className="p-4 rounded-[12px] bg-light border border-dark/5 text-center">
              <p className="text-2xl font-semibold text-dark">
                {state.streakData.weekHistory.length}
              </p>
              <p className="text-xs text-muted">Weeks Tracked</p>
            </div>
            <div className="p-4 rounded-[12px] bg-light border border-dark/5 text-center">
              <p className="text-2xl font-semibold text-dark">
                {state.streakData.weekHistory.filter((w) => w.goalMet).length}
              </p>
              <p className="text-xs text-muted">Goals Met</p>
            </div>
          </div>
        </section>

        {/* Account Section */}
        <section className="glass p-5 space-y-4">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-[10px] bg-primary/10 flex items-center justify-center">
              <User size={18} className="text-primary" />
            </div>
            <h2 className="text-lg font-semibold text-dark">Account</h2>
          </div>

          {user ? (
            <div className="space-y-4">
              <div className="p-4 rounded-[12px] bg-light border border-dark/5">
                <p className="text-sm font-medium text-dark">Signed in as</p>
                <p className="text-sm text-muted">{user.email}</p>
              </div>
              <button
                onClick={() => signOut()}
                className="w-full flex items-center justify-center gap-2 py-3 px-4 rounded-[12px] bg-red-50 text-red-600 hover:bg-red-100 transition-colors text-sm font-medium"
              >
                <LogOut size={18} />
                Sign out
              </button>
            </div>
          ) : (
            <div className="space-y-3">
              <p className="text-sm text-muted">
                Sign in to sync your progress across devices.
              </p>
              <button
                onClick={() => router.push("/login")}
                className="btn btn-primary w-full justify-center"
              >
                Sign in
              </button>
            </div>
          )}
        </section>
      </div>
    </div>
  );
}
