"use client";
import { useEffect, useRef, useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { Loader2, ArrowDown } from "lucide-react";

// Touch-only pull-to-refresh at the top of the page: refetches the active
// queries (catalog, weeks) rather than reloading the whole app. Ignored when
// a dialog is open, when the page isn't scrolled to the top, and on
// non-touch devices.
export function PullToRefresh() {
  const qc = useQueryClient();
  const [pull, setPull] = useState(0);
  const [refreshing, setRefreshing] = useState(false);
  const startY = useRef<number | null>(null);
  const THRESHOLD = 70;

  useEffect(() => {
    if (!window.matchMedia("(pointer: coarse)").matches) return;

    const onStart = (e: TouchEvent) => {
      if (window.scrollY > 0 || document.querySelector('[role="dialog"]')) return;
      startY.current = e.touches[0].clientY;
    };
    const onMove = (e: TouchEvent) => {
      if (startY.current === null) return;
      const dy = e.touches[0].clientY - startY.current;
      if (dy <= 0) return setPull(0);
      setPull(Math.min(dy * 0.5, 100));
    };
    const onEnd = async () => {
      const should = pull >= THRESHOLD;
      startY.current = null;
      if (should) {
        setRefreshing(true);
        setPull(THRESHOLD);
        await qc.invalidateQueries().catch(() => {});
        setTimeout(() => {
          setRefreshing(false);
          setPull(0);
        }, 400);
      } else setPull(0);
    };
    window.addEventListener("touchstart", onStart, { passive: true });
    window.addEventListener("touchmove", onMove, { passive: true });
    window.addEventListener("touchend", onEnd);
    return () => {
      window.removeEventListener("touchstart", onStart);
      window.removeEventListener("touchmove", onMove);
      window.removeEventListener("touchend", onEnd);
    };
  }, [pull, qc]);

  if (pull === 0 && !refreshing) return null;
  return (
    <div
      className="pointer-events-none fixed inset-x-0 top-0 z-[60] flex justify-center"
      style={{ transform: `translateY(${Math.max(pull - 36, 0) + 8}px)` }}
      role="status"
      aria-live="polite"
    >
      <span className="flex h-9 w-9 items-center justify-center rounded-full border bg-card shadow-lg" style={{ borderColor: "hsl(var(--foreground) / 0.15)" }}>
        {refreshing ? <Loader2 className="h-4 w-4 animate-spin" /> : <ArrowDown className="h-4 w-4" style={{ transform: `rotate(${pull >= THRESHOLD ? 180 : 0}deg)`, transition: "transform .2s" }} />}
        <span className="sr-only">{refreshing ? "Refreshing" : pull >= THRESHOLD ? "Release to refresh" : "Pull to refresh"}</span>
      </span>
    </div>
  );
}
