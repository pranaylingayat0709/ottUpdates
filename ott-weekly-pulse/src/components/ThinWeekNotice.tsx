"use client";
import { useMemo } from "react";
import { CalendarClock } from "lucide-react";
import { useTitles, DEFAULT_TITLE_FILTERS } from "@/hooks/useTitles";
import { TitleCard } from "@/components/TitleCard";
import { ErrorBoundary } from "@/components/ErrorBoundary";
import type { Title, WeekMeta } from "@/lib/types";

// Below this many titles the week reads as "barely anything" rather than a
// real catalog, so the page explains itself instead of just looking broken.
export const THIN_WEEK_THRESHOLD = 6;

// Shown above the catalog when the current week has very few confirmed
// releases (a genuinely quiet week, a sparse source response, or live data
// still catching up). Rather than a nearly-empty page with no explanation,
// it says so plainly and — if the previous week has anything the current
// week doesn't already list — offers those as "recent releases you may have
// missed". It never relabels old titles as new: they sit in their own rail
// with their own heading.
export function ThinWeekNotice({
  weeks,
  activeWeekId,
  currentTitles
}: {
  weeks: WeekMeta[];
  activeWeekId?: string;
  currentTitles: Title[];
}) {
  const idx = weeks.findIndex((w) => w.id === activeWeekId);
  const prevWeekId = idx > 0 ? weeks[idx - 1].id : undefined;
  const { data: prev } = useTitles(prevWeekId, DEFAULT_TITLE_FILTERS);

  const recent = useMemo(() => {
    const have = new Set(currentTitles.map((t) => t.title.toLowerCase()));
    return (prev?.titles ?? []).filter((t) => !have.has(t.title.toLowerCase())).slice(0, 10);
  }, [prev, currentTitles]);

  const n = currentTitles.length;

  return (
    <section className="mb-8" aria-label="Quiet week notice">
      <div className="glass-panel flex items-start gap-3 rounded-2xl px-4 py-3.5">
        <CalendarClock className="mt-0.5 h-5 w-5 shrink-0 text-accent" />
        <div className="text-sm">
          <p className="font-semibold">
            {n === 0 ? "No new releases confirmed yet this week" : `A quiet week — ${n} new release${n !== 1 ? "s" : ""} confirmed so far`}
          </p>
          <p className="mt-0.5 text-xs text-muted-foreground">
            New titles land every Friday and platforms confirm lineups a few days out, so check back soon.
            {recent.length > 0 && " In the meantime, here's what you may have missed from last week."}
          </p>
        </div>
      </div>

      {recent.length > 0 && (
        <div className="mt-5">
          <h3 className="mb-3 font-display text-base font-bold tracking-tight">Recent releases you may have missed</h3>
          <div className="scrollbar-thin -mx-1 flex snap-x gap-3 overflow-x-auto px-1 pb-3">
            {recent.map((t) => (
              <div key={t.id} className="w-36 shrink-0 snap-start sm:w-44">
                <ErrorBoundary fallbackLabel="">
                  <TitleCard title={t} />
                </ErrorBoundary>
              </div>
            ))}
          </div>
        </div>
      )}
    </section>
  );
}
