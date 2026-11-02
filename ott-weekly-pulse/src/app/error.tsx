"use client";
import { useEffect } from "react";

// Route-level error boundary: shows a friendly retry instead of a blank page
// and logs the failure server-side.
export default function RouteError({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
  useEffect(() => {
    try {
      navigator.sendBeacon?.("/api/client-error", JSON.stringify({ message: `Route error: ${error.message}`, stack: error.stack, url: location.pathname }));
    } catch {
      /* ignore */
    }
  }, [error]);
  return (
    <div className="mx-auto max-w-md py-20 text-center">
      <h1 className="font-display text-2xl font-bold">Something went wrong</h1>
      <p className="mt-2 text-sm text-muted-foreground">This page hit an unexpected error. It has been logged.</p>
      <button onClick={reset} className="chip chip-active mt-5">Try again</button>
    </div>
  );
}
