// Service Worker for FORMA PWA & Push Notifications
const CACHE_NAME = "forma-v1";
const STATIC_ASSETS = [
  "/",
  "/index.html",
  "/favicon.ico",
  "/manifest.json",
];

// Install event - cache static assets
self.addEventListener("install", (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      console.log("[SW] Caching static assets");
      return cache.addAll(STATIC_ASSETS);
    })
  );
  self.skipWaiting();
});

// Activate event - clean up old caches
self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames
          .filter((name) => name !== CACHE_NAME)
          .map((name) => caches.delete(name))
      );
    })
  );
  self.clients.claim();
});

// Fetch event - serve from cache, fallback to network
self.addEventListener("fetch", (event) => {
  // Skip cross-origin requests
  if (!event.request.url.startsWith(self.location.origin)) {
    return;
  }

  // Skip API calls
  if (event.request.url.includes("/functions/v1/")) {
    return;
  }

  event.respondWith(
    caches.match(event.request).then((cachedResponse) => {
      if (cachedResponse) {
        return cachedResponse;
      }

      return fetch(event.request).then((response) => {
        // Don't cache non-successful responses
        if (!response || response.status !== 200 || response.type !== "basic") {
          return response;
        }

        // Clone and cache the response
        const responseToCache = response.clone();
        caches.open(CACHE_NAME).then((cache) => {
          cache.put(event.request, responseToCache);
        });

        return response;
      });
    })
  );
});

// Handle messages from the main thread
self.addEventListener("message", (event) => {
  if (event.data === "skipWaiting") {
    self.skipWaiting();
  }
});

// ==========================================
// Push Notifications Handler
// ==========================================

// Notification types configuration
const NOTIFICATION_TYPES = {
  new_render: {
    title: "Rendu terminé",
    icon: "/favicon.ico",
    badge: "/favicon.ico",
  },
  project_invite: {
    title: "Invitation au projet",
    icon: "/favicon.ico",
    badge: "/favicon.ico",
  },
  mention: {
    title: "Nouvelle mention",
    icon: "/favicon.ico",
    badge: "/favicon.ico",
  },
};

// Handle incoming push events
self.addEventListener("push", (event) => {
  console.log("[SW] Push event received");

  let data = {
    title: "FORMA",
    body: "Vous avez une nouvelle notification",
    type: "new_render",
    url: "/dashboard",
  };

  // Try to parse push data
  if (event.data) {
    try {
      data = event.data.json();
    } catch (e) {
      console.log("[SW] Failed to parse push data:", e);
    }
  }

  const typeConfig = NOTIFICATION_TYPES[data.type] || NOTIFICATION_TYPES.new_render;

  const options = {
    body: data.body || "Vous avez une nouvelle notification",
    icon: typeConfig.icon,
    badge: typeConfig.badge,
    vibrate: [100, 50, 100],
    data: {
      url: data.url || "/dashboard",
      timestamp: Date.now(),
      type: data.type,
    },
    actions: [
      {
        action: "open",
        title: "Ouvrir",
      },
      {
        action: "close",
        title: "Fermer",
      },
    ],
    tag: data.type || "default",
    renotify: true,
    requireInteraction: true,
  };

  event.waitUntil(
    self.registration.showNotification(typeConfig.title, options).then(() => {
      console.log("[SW] Notification displayed:", typeConfig.title);
    }).catch((err) => {
      console.error("[SW] Failed to show notification:", err);
    })
  );
});

// Handle notification click events
self.addEventListener("notificationclick", (event) => {
  console.log("[SW] Notification click:", event.action);

  event.notification.close();

  if (event.action === "close") {
    return;
  }

  const urlToOpen = event.notification.data?.url || "/dashboard";

  event.waitUntil(
    clients.matchAll({ type: "window", includeUncontrolled: true }).then((clientList) => {
      // Check if there's already a window open
      for (const client of clientList) {
        if (client.url.includes(self.location.origin) && "focus" in client) {
          client.navigate(urlToOpen);
          return client.focus();
        }
      }
      // If no window is open, open a new one
      if (clients.openWindow) {
        return clients.openWindow(urlToOpen);
      }
    })
  );
});

// Handle notification close events
self.addEventListener("notificationclose", (event) => {
  console.log("[SW] Notification closed:", event.notification.title);
});