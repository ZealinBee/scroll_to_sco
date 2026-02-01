/**
 * Push Notification Utilities
 *
 * Handles browser push notifications for exercise reminders.
 * Uses the Web Push API with service workers.
 */

import { NotificationSettings } from "./gamification";

// ============================================
// PERMISSION HANDLING
// ============================================

/**
 * Check if notifications are supported in this browser
 */
export function isNotificationSupported(): boolean {
  return typeof window !== "undefined" &&
         "Notification" in window &&
         "serviceWorker" in navigator;
}

/**
 * Get current notification permission status
 */
export function getNotificationPermission(): NotificationPermission {
  if (!isNotificationSupported()) return "denied";
  return Notification.permission;
}

/**
 * Request notification permission from user
 */
export async function requestNotificationPermission(): Promise<NotificationPermission> {
  if (!isNotificationSupported()) {
    console.warn("Notifications not supported in this browser");
    return "denied";
  }

  try {
    const permission = await Notification.requestPermission();
    return permission;
  } catch (error) {
    console.error("Error requesting notification permission:", error);
    return "denied";
  }
}

// ============================================
// SERVICE WORKER
// ============================================

/**
 * Register the service worker
 */
export async function registerServiceWorker(): Promise<ServiceWorkerRegistration | null> {
  if (typeof window === "undefined" || !("serviceWorker" in navigator)) {
    return null;
  }

  try {
    const registration = await navigator.serviceWorker.register("/sw.js", {
      scope: "/",
    });

    console.log("Service Worker registered:", registration.scope);
    return registration;
  } catch (error) {
    console.error("Service Worker registration failed:", error);
    return null;
  }
}

/**
 * Get existing service worker registration
 */
export async function getServiceWorkerRegistration(): Promise<ServiceWorkerRegistration | null> {
  if (typeof window === "undefined" || !("serviceWorker" in navigator)) {
    return null;
  }

  try {
    const registration = await navigator.serviceWorker.ready;
    return registration;
  } catch (error) {
    console.error("Error getting service worker:", error);
    return null;
  }
}

// ============================================
// NOTIFICATIONS
// ============================================

/**
 * Show an exercise reminder notification
 */
export async function showExerciseReminder(): Promise<boolean> {
  if (!isNotificationSupported()) return false;

  const permission = getNotificationPermission();
  if (permission !== "granted") return false;

  try {
    const registration = await getServiceWorkerRegistration();

    if (registration) {
      // Use service worker notification (works in background)
      // Note: actions are only supported in service worker notifications
      await registration.showNotification("Time to Exercise!", {
        body: "Your daily exercises are waiting. Keep your streak going!",
        icon: "/favicon.ico",
        badge: "/favicon.ico",
        tag: "exercise-reminder",
        requireInteraction: true,
      });
    } else {
      // Fallback to basic notification
      new Notification("Time to Exercise!", {
        body: "Your daily exercises are waiting. Keep your streak going!",
        icon: "/favicon.ico",
        tag: "exercise-reminder",
      });
    }

    return true;
  } catch (error) {
    console.error("Error showing notification:", error);
    return false;
  }
}

/**
 * Show a test notification
 */
export async function showTestNotification(): Promise<boolean> {
  if (!isNotificationSupported()) return false;

  const permission = getNotificationPermission();
  if (permission !== "granted") return false;

  try {
    new Notification("Notifications Enabled!", {
      body: "You'll receive daily reminders at your scheduled time.",
      icon: "/favicon.ico",
      tag: "test-notification",
    });
    return true;
  } catch (error) {
    console.error("Error showing test notification:", error);
    return false;
  }
}

// ============================================
// SCHEDULING
// ============================================

const LAST_NOTIFICATION_KEY = "lastNotificationShown";
const NOTIFICATION_CHECK_INTERVAL = 60 * 1000; // 1 minute

let notificationCheckInterval: NodeJS.Timeout | null = null;

/**
 * Check if we should show a notification based on scheduled time
 */
export function shouldShowNotification(settings: NotificationSettings): boolean {
  if (!settings.enabled || settings.permission !== "granted") {
    return false;
  }

  const now = new Date();
  const today = now.toISOString().split("T")[0];

  // Check if we already showed notification today
  const lastShown = localStorage.getItem(LAST_NOTIFICATION_KEY);
  if (lastShown === today) {
    return false;
  }

  // Parse reminder time
  const [hours, minutes] = settings.reminderTime.split(":").map(Number);
  const scheduledTime = new Date();
  scheduledTime.setHours(hours, minutes, 0, 0);

  // Check if we're within 2 minutes of the scheduled time
  const timeDiff = Math.abs(now.getTime() - scheduledTime.getTime());
  const withinWindow = timeDiff < 2 * 60 * 1000; // 2 minute window

  // Also trigger if we're past the time (app was opened after scheduled time)
  const isPastTime = now >= scheduledTime;

  return withinWindow || isPastTime;
}

/**
 * Check and show notification if it's time
 */
export async function checkAndShowNotification(settings: NotificationSettings): Promise<void> {
  if (shouldShowNotification(settings)) {
    const shown = await showExerciseReminder();
    if (shown) {
      const today = new Date().toISOString().split("T")[0];
      localStorage.setItem(LAST_NOTIFICATION_KEY, today);
    }
  }
}

/**
 * Start the notification scheduler
 * Checks periodically if it's time to show a notification
 */
export function startNotificationScheduler(settings: NotificationSettings): void {
  // Stop any existing scheduler
  stopNotificationScheduler();

  if (!settings.enabled || settings.permission !== "granted") {
    return;
  }

  // Check immediately
  checkAndShowNotification(settings);

  // Then check periodically
  notificationCheckInterval = setInterval(() => {
    checkAndShowNotification(settings);
  }, NOTIFICATION_CHECK_INTERVAL);
}

/**
 * Stop the notification scheduler
 */
export function stopNotificationScheduler(): void {
  if (notificationCheckInterval) {
    clearInterval(notificationCheckInterval);
    notificationCheckInterval = null;
  }
}

// ============================================
// INITIALIZATION
// ============================================

/**
 * Initialize notification system
 * Call this on app startup
 */
export async function initializeNotifications(
  settings: NotificationSettings
): Promise<NotificationSettings> {
  const updatedSettings = { ...settings };

  // Register service worker
  await registerServiceWorker();

  // Update permission status
  updatedSettings.permission = getNotificationPermission();

  // Start scheduler if enabled
  if (updatedSettings.enabled && updatedSettings.permission === "granted") {
    startNotificationScheduler(updatedSettings);
  }

  return updatedSettings;
}

/**
 * Enable notifications (requests permission if needed)
 */
export async function enableNotifications(
  settings: NotificationSettings
): Promise<NotificationSettings> {
  const updatedSettings = { ...settings };

  // Request permission if not granted
  if (getNotificationPermission() !== "granted") {
    const permission = await requestNotificationPermission();
    updatedSettings.permission = permission;

    if (permission !== "granted") {
      updatedSettings.enabled = false;
      return updatedSettings;
    }
  }

  updatedSettings.enabled = true;
  updatedSettings.permission = "granted";

  // Show test notification
  await showTestNotification();

  // Start scheduler
  startNotificationScheduler(updatedSettings);

  return updatedSettings;
}

/**
 * Disable notifications
 */
export function disableNotifications(settings: NotificationSettings): NotificationSettings {
  stopNotificationScheduler();

  return {
    ...settings,
    enabled: false,
  };
}
