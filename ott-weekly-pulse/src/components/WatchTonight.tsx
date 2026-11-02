"use client";
import { useMemo, useState } from "react";
import { Dices, Sparkles } from "lucide-react";
import type { Title } from "@/lib/types";
import { MOOD_OPTIONS, matchesMood, type MoodKey } from "@/lib/moods";
import { TitleCard } from "@/components/TitleCard";
import { ErrorBoundary } from "@/components/ErrorBoundary";
import { PLATFORM_LABELS } from "@/lib/types";
import { cn } from "@/lib/utils";

type Time = "ANY" | "QUICK" | "EVENING" | "BINGE";
const TIMES: { value: Time; label: string }[] = [
  { value: "ANY", label: "Any length" },
  { value: "QUICK", label: "Under 100 min" },
  { value: "EVENING", label: "A full evening (movie)" },
  { value: "BINGE", label: "Binge a series" }
];

function fits(t: Title, time: Time): boolean {
  if (time === "ANY") return true;
  if (time === "QUICK") return t.type === "MOVIE" && !!t.runtimeMinutes && t.runtimeMinutes <= 100;
  if (time === "EVENING") return t.type === "MOVIE";
  return t.type === "SERIES" && (t.totalEpisodes ?? 0) >= 4;
}

// "What should I watch tonight?" — pick a mood and how much time you have,
// get ONE title, and re-roll with "Show another". Only picks from this
// week's real catalog, preferring highest-rated matches first so the first
// suggestion is a good one rather than random.
export function WatchTonight({ titles }: { titles: Title[] }) {
  const [mood, setMood] = useState<MoodKey | "ALL">("ALL");
  const [time, setTime] = useState<Time>("ANY");
  const [skip, setSkip] = useState(0);

  const pool = useMemo(() => {
    const list = titles.filter((t) => matchesMood(t.genres, mood) && fits(t, time));
    return list.sort((a, b) => (b.imdbRating ?? b.internalCriticRating ?? 0) - (a.imdbRating ?? a.internalCriticRating ?? 0));
  }, [titles, mood, time]);

  const pick = pool.length ? pool[skip % pool.length] : null;

  return (
    <section className="glass-panel mb-9 p-4 sm:p-5" aria-label="What should I watch tonight?">
      <h2 className="mb-3 flex items-center gap-2 font-display text-lg font-bold sm:text-xl">
        <Sparkles className="h-5 w-5 text-accent" /> What should I watch tonight?
      </h2>
      <div className="grid gap-4 sm:grid-cols-[1fr_11rem]">
        <div className="space-y-3">
          <div>
            <p className="mb-1.5 text-xs font-medium text-muted-foreground">Mood</p>
            <div className="flex flex-wrap gap-2">
              {([{ value: "ALL" as const, label: "Surprise me" }, ...MOOD_OPTIONS]).map((m) => (
                <button key={m.value} aria-pressed={mood === m.value} onClick={() => { setMood(m.value); setSkip(0); }} className={cn("chip", mood === m.value && "chip-active")}>
                  {m.label}
                </button>
              ))}
            </div>
          </div>
          <div>
            <p className="mb-1.5 text-xs font-medium text-muted-foreground">Time you have</p>
            <div className="flex flex-wrap gap-2">
              {TIMES.map((x) => (
                <button key={x.value} aria-pressed={time === x.value} onClick={() => { setTime(x.value); setSkip(0); }} className={cn("chip", time === x.value && "chip-active")}>
                  {x.label}
                </button>
              ))}
            </div>
          </div>
          {pick ? (
            <div aria-live="polite">
              <p className="text-sm font-semibold">{pick.title}</p>
              <p className="mt-1 line-clamp-3 text-xs text-muted-foreground">{pick.synopsis}</p>
              <p className="mt-1 text-xs text-muted-foreground">on {pick.platforms.map((p) => PLATFORM_LABELS[p]).slice(0, 3).join(", ")}</p>
              {pool.length > 1 && (
                <button onClick={() => setSkip((n) => n + 1)} className="chip chip-active mt-3">
                  <Dices className="h-3.5 w-3.5" /> Show another ({pool.length - 1} more)
                </button>
              )}
            </div>
          ) : (
            <p aria-live="polite" className="text-sm text-muted-foreground">Nothing this week matches that combination — try a different mood or length.</p>
          )}
        </div>
        {pick && (
          <div className="mx-auto w-40 sm:w-full">
            <ErrorBoundary fallbackLabel="">
              <TitleCard key={pick.id} title={pick} />
            </ErrorBoundary>
          </div>
        )}
      </div>
    </section>
  );
}
