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

const CACHE_NAME = "owp-shell-v2";
const DATA_CACHE = "owp-data-v2";
const IMG_CACHE = "owp-img-v2";
const SHELL_URLS = ["/"];
// Read-only catalog endpoints worth keeping for offline: after one online
// visit the last viewed week (list, week list, details) still opens offline.
const CACHEABLE_API = [/\/api\/titles(\/|\?|$)/, /\/api\/weeks$/, /\/api\/leaving$/];
const IMG_LIMIT = 120;

self.addEventListener("install", (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => cache.addAll(SHELL_URLS)).catch(() => {})
  );
  self.skipWaiting();
});

self.addEventListener("activate", (event) => {
  const keep = [CACHE_NAME, DATA_CACHE, IMG_CACHE];
  event.waitUntil(
    caches.keys().then((keys) => Promise.all(keys.filter((k) => !keep.includes(k)).map((k) => caches.delete(k))))
  );
  self.clients.claim();
});

async function trim(cacheName, max) {
  const cache = await caches.open(cacheName);
  const keys = await cache.keys();
  for (let i = 0; i < keys.length - max; i++) await cache.delete(keys[i]);
}

self.addEventListener("fetch", (event) => {
  const req = event.request;
  if (req.method !== "GET") return;
  const url = new URL(req.url);

  // Catalog API: network first (fresh data), fall back to the last copy offline.
  if (url.origin === self.location.origin && CACHEABLE_API.some((re) => re.test(url.pathname + url.search))) {
    event.respondWith(
      fetch(req)
        .then((res) => {
          if (res.ok) {
            const copy = res.clone();
            caches.open(DATA_CACHE).then((c) => c.put(req, copy)).catch(() => {});
          }
          return res;
        })
        .catch(() => caches.match(req).then((hit) => hit || new Response(JSON.stringify({ error: "offline" }), { status: 503, headers: { "Content-Type": "application/json" } })))
    );
    return;
  }

  // Everything else under /api/ (admin, auth, writes' reads, sync): never cached.
  if (url.pathname.startsWith("/api/")) return;

  // Posters via the Next image optimizer: cache-first, capped.
  if (url.pathname.startsWith("/_next/image")) {
    event.respondWith(
      caches.match(req).then((hit) => {
        if (hit) return hit;
        return fetch(req).then((res) => {
          if (res.ok) {
            const copy = res.clone();
            caches.open(IMG_CACHE).then((c) => c.put(req, copy).then(() => trim(IMG_CACHE, IMG_LIMIT))).catch(() => {});
          }
          return res;
        });
      })
    );
    return;
  }

  // Pages and static assets: network first, cached copy when offline;
  // offline navigations fall back to the cached home page.
  event.respondWith(
    fetch(req)
      .then((response) => {
        if (response.ok && url.origin === self.location.origin) {
          const clone = response.clone();
          caches.open(CACHE_NAME).then((cache) => cache.put(req, clone)).catch(() => {});
        }
        return response;
      })
      .catch(() => caches.match(req).then((hit) => hit || (req.mode === "navigate" ? caches.match("/") : undefined)))
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
