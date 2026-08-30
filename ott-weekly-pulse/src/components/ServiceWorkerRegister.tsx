"use client";
import { useEffect } from "react";

// Registers the service worker (public/sw.js) which powers both PWA
// offline support and push notifications. Silently no-ops in browsers
// without support, or if registration fails for any reason.
export function ServiceWorkerRegister() {
  useEffect(() => {
    if ("serviceWorker" in navigator) {
      navigator.serviceWorker.register("/sw.js").catch(() => {
        // Best-effort — the app works fully without it.
      });
    }
  }, []);
  return null;
}
