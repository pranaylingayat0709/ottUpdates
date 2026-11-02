"use client";
import { useEffect } from "react";

function report(message: string, stack?: string) {
  try {
    const body = JSON.stringify({ message, stack, url: location.pathname });
    if (!navigator.sendBeacon?.("/api/client-error", body)) {
      void fetch("/api/client-error", { method: "POST", body, keepalive: true });
    }
  } catch {
    /* reporting must never throw */
  }
}

// Forwards uncaught browser errors and unhandled promise rejections to
// /api/client-error (deduplicated per page load, capped at 5).
export function ClientErrorReporter() {
  useEffect(() => {
    const seen = new Set<string>();
    const send = (msg: string, stack?: string) => {
      if (seen.size >= 5 || seen.has(msg)) return;
      seen.add(msg);
      report(msg, stack);
    };
    const onError = (e: ErrorEvent) => send(e.message, e.error?.stack);
    const onRejection = (e: PromiseRejectionEvent) => send(`Unhandled rejection: ${e.reason?.message ?? String(e.reason)}`, e.reason?.stack);
    window.addEventListener("error", onError);
    window.addEventListener("unhandledrejection", onRejection);
    return () => {
      window.removeEventListener("error", onError);
      window.removeEventListener("unhandledrejection", onRejection);
    };
  }, []);
  return null;
}
