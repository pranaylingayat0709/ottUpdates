"use client";
import { useMemo } from "react";
import { motion } from "framer-motion";
import { Sparkles } from "lucide-react";
import { useWatchlistStore } from "@/hooks/useWatchlistStore";
import { useTasteStore } from "@/hooks/useTasteStore";
import { useI18n } from "@/components/LanguageProvider";
import { TitleCard } from "@/components/TitleCard";
import { ErrorBoundary } from "@/components/ErrorBoundary";
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

    return scored.sort((a, b) => b.score - a.score).slice(0, 5);
  }, [watchlistIds, titles, tasteGenres]);

  if (recommendations.length === 0) return null;

  return (
    <motion.section className="mb-12" initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4 }}>
      <h2 className="mb-4 flex items-center gap-2 font-display text-xl font-bold tracking-tight sm:text-2xl">
        <Sparkles className="h-5 w-5 text-accent" /> {t("recommendations.forYou")}
      </h2>
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5">
        {recommendations.map(({ title, reason }) => (
          <div key={title.id}>
            <ErrorBoundary fallbackLabel="Couldn't load this title.">
              <TitleCard title={title} />
            </ErrorBoundary>
            <p className="mt-1.5 line-clamp-1 text-[11px] text-muted-foreground">{reason}</p>
          </div>
        ))}
      </div>
    </motion.section>
  );
}
