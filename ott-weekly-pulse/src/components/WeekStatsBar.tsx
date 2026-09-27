"use client";
import { useState } from "react";
import { Share2, Clock3, Check } from "lucide-react";
import { useTitleCount, useTitles, DEFAULT_TITLE_FILTERS } from "@/hooks/useTitles";
import { AnimatedCounter } from "@/components/AnimatedCounter";
import type { WeekMeta } from "@/lib/types";

function formatUpdatedAt(iso: string | null | undefined): string | null {
  if (!iso) return null;
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return null;
  return d.toLocaleDateString(undefined, { day: "numeric", month: "short", year: "numeric" });
}

// A persistent, always-visible strip — deliberately NOT scoped to
// whatever week/filters the user is currently browsing, the same way a
// masthead stat wouldn't change as you scroll an article. "New this
// week"/"Coming soon" always describe the real current + next week, and
// "Updated on" is the actual last-fetch timestamp (see getGeneratedAt in
// data-source.ts) rather than today's date — with titles now fetched once
// and frozen for the week (see the caching rework), the data can
// genuinely be a few days old, and showing that honestly matters more
// than looking freshly-refreshed.
export function WeekStatsBar({ weeks }: { weeks: WeekMeta[] }) {
  const currentWeek = weeks.find((w) => w.isCurrent);
  const nextWeek = weeks.find((w) => !w.isCurrent && new Date(w.weekStartDate) > new Date());

  const { data: currentData } = useTitles(currentWeek?.id, DEFAULT_TITLE_FILTERS);
  const { data: comingSoonCount } = useTitleCount(nextWeek?.id);
  const [shared, setShared] = useState(false);

  if (!currentWeek) return null;

  const newThisWeek = currentData?.total ?? 0;
  const updatedLabel = formatUpdatedAt(currentData?.generatedAt);

  async function shareWeek() {
    const top = (currentData?.titles ?? [])
      .slice(0, 8)
      .map((t) => `• ${t.title}${t.platforms?.[0] ? ` (${t.platforms[0].replace("_", " ")})` : ""}`)
      .join("\n");
    const url = typeof window !== "undefined" ? window.location.origin : "";
    const text = `OTT Weekly Pulse — ${currentWeek?.label}\n${newThisWeek} new title${newThisWeek !== 1 ? "s" : ""} this week:\n${top}\n\n${url}`;

    if (typeof navigator !== "undefined" && navigator.share) {
      try {
        await navigator.share({ title: "OTT Weekly Pulse", text });
        return;
      } catch {
        // user cancelled the share sheet, or it's unsupported — fall through to clipboard
      }
    }
    if (typeof navigator !== "undefined" && navigator.clipboard) {
      try {
        await navigator.clipboard.writeText(text);
        setShared(true);
        setTimeout(() => setShared(false), 2000);
      } catch {
        // clipboard write blocked — nothing more we can do without a user gesture
      }
    }
  }

  return (
    <div className="glass-panel mb-6 flex flex-wrap items-center justify-between gap-3 rounded-2xl px-4 py-3">
      <div className="flex flex-wrap items-center gap-x-6 gap-y-1">
        <div>
          <p className="text-[10px] uppercase tracking-wide text-muted-foreground">New This Week</p>
          <p className="text-lg font-bold leading-tight">
            <AnimatedCounter value={newThisWeek} />
          </p>
        </div>
        <div>
          <p className="text-[10px] uppercase tracking-wide text-muted-foreground">Coming Soon</p>
          <p className="text-lg font-bold leading-tight">
            <AnimatedCounter value={comingSoonCount ?? 0} />
          </p>
        </div>
        {updatedLabel && (
          <p className="flex items-center gap-1 text-xs text-muted-foreground">
            <Clock3 className="h-3.5 w-3.5 shrink-0" /> Updated on {updatedLabel}
          </p>
        )}
      </div>
      <button onClick={shareWeek} className="chip flex shrink-0 items-center gap-1.5">
        {shared ? <Check className="h-3.5 w-3.5" /> : <Share2 className="h-3.5 w-3.5" />}
        {shared ? "Copied!" : "Share This Week's List"}
      </button>
    </div>
  );
}
