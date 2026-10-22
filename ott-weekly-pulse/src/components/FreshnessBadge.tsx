"use client";
import { useEffect, useState } from "react";
import { cn } from "@/lib/utils";

function relative(ms: number): string {
  const mins = Math.floor(ms / 60000);
  if (mins < 1) return "just now";
  if (mins < 60) return `${mins}m ago`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  return `${days}d ago`;
}

// "● Live · updated 2h ago" — a visible data-freshness stamp. The dot is
// green while the snapshot is under 3 days old, amber after that, so stale
// data is obvious at a glance instead of silently looking current. Renders
// nothing until mounted because the relative time depends on the viewer's
// clock (server and client would otherwise disagree and trip hydration).
export function FreshnessBadge({ generatedAt, isLive }: { generatedAt?: string | null; isLive?: boolean }) {
  const [now, setNow] = useState<number | null>(null);

  useEffect(() => {
    setNow(Date.now());
    const id = setInterval(() => setNow(Date.now()), 60_000);
    return () => clearInterval(id);
  }, []);

  if (now === null) return null;

  const ts = generatedAt ? new Date(generatedAt).getTime() : NaN;
  const hasTs = !Number.isNaN(ts);
  if (!hasTs && !isLive) return null;

  const age = hasTs ? Math.max(0, now - ts) : 0;
  const stale = hasTs && age > 3 * 24 * 60 * 60 * 1000;

  return (
    <p
      className="flex items-center gap-1.5 text-xs text-muted-foreground"
      title={hasTs ? `Catalog fetched ${new Date(ts).toLocaleString()}` : "Served from live data"}
    >
      <span className="relative flex h-2 w-2">
        {!stale && <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-60" />}
        <span className={cn("relative inline-flex h-2 w-2 rounded-full", stale ? "bg-amber-400" : "bg-emerald-500")} />
      </span>
      <span>
        {stale ? "Data may be stale" : "Live"}
        {hasTs && <> · updated {relative(age)}</>}
      </span>
    </p>
  );
}
