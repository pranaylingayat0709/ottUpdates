"use client";
import { Sparkle } from "lucide-react";
import type { Title } from "@/lib/types";
import { useTasteStore } from "@/hooks/useTasteStore";
import { useWatchlistStore } from "@/hooks/useWatchlistStore";

// A lightweight, fully client-side "you'd probably rate this X" heuristic —
// no ML model. Anchors on the title's own public rating, then nudges it up
// or down slightly based on how many of your favorite genres it shares.
// Deliberately conservative (max ±0.6) and only shown when there's an
// actual taste signal to work from, so it never overclaims certainty.
export function PredictedRatingChip({ title }: { title: Title }) {
  const favoriteGenres = useTasteStore((s) => s.favoriteGenres);
  const watchlistCount = useWatchlistStore((s) => s.titleIds.length);

  if (favoriteGenres.length === 0) return null;

  const baseline = title.imdbRating ?? title.internalCriticRating ?? (title.communityVotes > 0 ? title.communityScore : null);
  if (baseline == null) return null;

  const matches = title.genres.filter((g) => favoriteGenres.includes(g)).length;
  const matchRatio = matches / Math.max(1, favoriteGenres.length);
  const nudge = matches === 0 ? -0.4 : Math.min(0.6, matchRatio * 0.9);
  const predicted = Math.max(0, Math.min(10, baseline + nudge));

  return (
    <div className="glass-panel flex flex-1 flex-col items-center gap-1 py-3">
      <Sparkle className="h-4 w-4 text-accent" />
      <span className="text-sm font-bold">{predicted.toFixed(1)}/10</span>
      <span className="text-[10px] uppercase tracking-wide text-muted-foreground">
        {matches > 0 ? `For You (${matches} genre${matches > 1 ? "s" : ""})` : "For You"}
      </span>
      {watchlistCount === 0 && <span className="sr-only">Based on your favorite genres</span>}
    </div>
  );
}
