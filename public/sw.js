/**
 * Service Worker for Push Notifications
 * Handles exercise reminder notifications
 */

const CACHE_NAME = "scrolltosco-v1";

// Install event
self.addEventListener("install", (event) => {
  console.log("Service Worker installing...");
  self.skipWaiting();
});

// Activate event
self.addEventListener("activate", (event) => {
  console.log("Service Worker activated");
  event.waitUntil(clients.claim());
});

// Push notification received
self.addEventListener("push", (event) => {
  console.log("Push notification received");

  const defaultData = {
    title: "Time to Exercise!",
    body: "Your daily exercises are waiting. Keep your streak going!",
    icon: "/favicon.ico",
    badge: "/favicon.ico",
  };

  let data = defaultData;

  try {
    if (event.data) {
      data = { ...defaultData, ...event.data.json() };
    }
  } catch (e) {
    console.error("Error parsing push data:", e);
  }

  const options = {
    body: data.body,
    icon: data.icon,
    badge: data.badge,
    vibrate: [100, 50, 100],
    tag: "exercise-reminder",
    requireInteraction: true,
    data: {
      url: "/journey",
    },
    actions: [
      { action: "start", title: "Start Exercises" },
      { action: "later", title: "Later" },
    ],
  };

  event.waitUntil(self.registration.showNotification(data.title, options));
});

// Notification click handler
self.addEventListener("notificationclick", (event) => {
  console.log("Notification clicked:", event.action);

  event.notification.close();

  // Handle different actions
  if (event.action === "later") {
    // User clicked "Later" - do nothing, notification is closed
    return;
  }

  // Default action or "Start Exercises" - open journey page
  const urlToOpen = event.notification.data?.url || "/journey";

  event.waitUntil(
    clients.matchAll({ type: "window", includeUncontrolled: true }).then((windowClients) => {
      // Check if app is already open
      for (const client of windowClients) {
        if (client.url.includes("/journey") && "focus" in client) {
          return client.focus();
        }
      }

      // Open new window if not found
      if (clients.openWindow) {
        return clients.openWindow(urlToOpen);
      }
    })
  );
});

// Notification close handler
self.addEventListener("notificationclose", (event) => {
  console.log("Notification closed without action");
});
