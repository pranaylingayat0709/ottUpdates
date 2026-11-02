"use client";
import { useMemo } from "react";
import { Sparkles } from "lucide-react";
import { useWatchlistStore } from "@/hooks/useWatchlistStore";
import { useTasteStore } from "@/hooks/useTasteStore";
import { useI18n } from "@/components/LanguageProvider";
import { Rail } from "@/components/Rail";
import { useDiaryStore } from "@/hooks/useDiaryStore";
import { GENRE_LABELS, type Title } from "@/lib/types";

interface ScoredTitle {
  title: Title;
  score: number;
  reason: string;
}

// Fully client-side "because you watched X" recommendations — no ML model
// or server round-trip. Builds a taste profile from EVERY watchlisted
// title (genre + cast frequency), not just the most recent one, and falls
// back to your onboarding genre picks (useTasteStore) if the watchlist is
// empty. Cast overlap is weighted higher than genre overlap since sharing
// an actor/director is a rarer, stronger signal than sharing a genre.
// Honest scope: only considers titles from the currently-loaded week, so
// it may show nothing if your watchlist picks are all from other weeks.
export function RecommendedForYou({ titles }: { titles: Title[] }) {
  const watchlistIds = useWatchlistStore((s) => s.titleIds);
  const tasteGenres = useTasteStore((s) => s.favoriteGenres);
  const diary = useDiaryStore((s) => s.entries);
  const { t } = useI18n();

  const recommendations = useMemo<ScoredTitle[]>(() => {
    const watchlisted = titles.filter((title) => watchlistIds.includes(title.id));

    const genreCounts = new Map<string, number>();
    const castCounts = new Map<string, number>();
    const genreSource = new Map<string, string>(); // genre -> a watchlisted title name that has it
    const castSource = new Map<string, string>();

    for (const w of watchlisted) {
      for (const g of w.genres) {
        genreCounts.set(g, (genreCounts.get(g) ?? 0) + 1);
        if (!genreSource.has(g)) genreSource.set(g, w.title);
      }
      for (const c of w.cast) {
        castCounts.set(c, (castCounts.get(c) ?? 0) + 1);
        if (!castSource.has(c)) castSource.set(c, w.title);
      }
    }

    // Titles you rated 4★ or higher in your diary count double (and work even
    // when they aren't in the currently loaded week, because the diary keeps
    // a snapshot of each title's genres and cast).
    for (const d of diary) {
      if (d.rating < 4) continue;
      for (const g of d.genres) {
        genreCounts.set(g, (genreCounts.get(g) ?? 0) + 2);
        if (!genreSource.has(g)) genreSource.set(g, d.title);
      }
      for (const c of d.cast) {
        castCounts.set(c, (castCounts.get(c) ?? 0) + 2);
        if (!castSource.has(c)) castSource.set(c, d.title);
      }
    }

    // No watchlist history yet — fall back to onboarding genre picks so
    // there's still something useful to show from a first visit.
    if (watchlisted.length === 0 && tasteGenres.length > 0) {
      for (const g of tasteGenres) genreCounts.set(g, 1);
    }

    if (genreCounts.size === 0 && castCounts.size === 0) return [];

    const watchlistSet = new Set(watchlistIds);
    const scored: ScoredTitle[] = [];

    for (const title of titles) {
      if (watchlistSet.has(title.id)) continue;

      let score = 0;
      let bestCastMatch: string | null = null;
      let matchedGenres: string[] = [];

      for (const c of title.cast) {
        const weight = castCounts.get(c);
        if (weight) {
          score += weight * 3; // cast match weighted higher than genre
          bestCastMatch = bestCastMatch ?? c;
        }
      }
      for (const g of title.genres) {
        const weight = genreCounts.get(g);
        if (weight) {
          score += weight;
          matchedGenres.push(g);
        }
      }

      if (score === 0) continue;

      const reason = bestCastMatch
        ? `Also stars ${bestCastMatch}, from ${castSource.get(bestCastMatch) ?? "your watchlist"}`
        : matchedGenres.length > 0
          ? `Shares ${matchedGenres.slice(0, 2).map((g) => GENRE_LABELS[g as keyof typeof GENRE_LABELS] ?? g).join(", ")} with ${genreSource.get(matchedGenres[0]) ?? "your picks"}`
          : "Matches your taste picks";

      scored.push({ title, score, reason });
    }

    return scored.sort((a, b) => b.score - a.score).slice(0, 12);
  }, [watchlistIds, titles, tasteGenres, diary]);

  if (recommendations.length === 0) return null;

  const reasons = new Map(recommendations.map((r) => [r.title.id, r.reason]));
  return (
    <Rail
      title={t("recommendations.forYou")}
      icon={<Sparkles className="h-4.5 w-4.5 text-accent" />}
      titles={recommendations.map((r) => r.title)}
      caption={(title) => reasons.get(title.id) ?? null}
    />
  );
}
