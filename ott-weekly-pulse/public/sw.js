// Service worker for OTT Weekly Pulse.
// Two responsibilities:
//   1. Minimal offline support (PWA) — cache the app shell so a repeat
//      visit loads instantly and a brief network blip doesn't blank the
//      page. This is NOT a full offline-first cache of live catalog data
//      (that would need a much more careful invalidation strategy) — just
//      the static shell.
//   2. Push notifications — receives and displays a notification when the
//      server sends one (see src/lib/push.ts), and handles the click to
//      focus/open the app.

const CACHE_NAME = "owp-shell-v1";
const SHELL_URLS = ["/"];

self.addEventListener("install", (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => cache.addAll(SHELL_URLS)).catch(() => {})
  );
  self.skipWaiting();
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches.keys().then((keys) => Promise.all(keys.filter((k) => k !== CACHE_NAME).map((k) => caches.delete(k))))
  );
  self.clients.claim();
});

self.addEventListener("fetch", (event) => {
  // Network-first for API calls (always want fresh catalog data);
  // cache-first fallback for everything else (shell/static assets).
  if (event.request.url.includes("/api/")) return;

  event.respondWith(
    fetch(event.request)
      .then((response) => {
        const clone = response.clone();
        caches.open(CACHE_NAME).then((cache) => cache.put(event.request, clone)).catch(() => {});
        return response;
      })
      .catch(() => caches.match(event.request))
  );
});

self.addEventListener("push", (event) => {
  if (!event.data) return;
  let payload;
  try {
    payload = event.data.json();
  } catch {
    payload = { title: "OTT Weekly Pulse", body: event.data.text() };
  }

  event.waitUntil(
    self.registration.showNotification(payload.title || "OTT Weekly Pulse", {
      body: payload.body || "",
      icon: "/icon-192.png",
      badge: "/icon-192.png",
      data: { url: payload.url || "/" }
    })
  );
});

self.addEventListener("notificationclick", (event) => {
  event.notification.close();
  const url = event.notification.data?.url || "/";
  event.waitUntil(
    self.clients.matchAll({ type: "window" }).then((clients) => {
      const existing = clients.find((c) => c.url.includes(self.location.origin));
      if (existing) return existing.focus();
      return self.clients.openWindow(url);
    })
  );
});
