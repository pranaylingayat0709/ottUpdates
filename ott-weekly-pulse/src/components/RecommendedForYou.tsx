"use client";
import { useMemo } from "react";
import { motion } from "framer-motion";
import { Sparkles } from "lucide-react";
import { useWatchlistStore } from "@/hooks/useWatchlistStore";
import { useI18n } from "@/components/LanguageProvider";
import { TitleCard } from "@/components/TitleCard";
import { ErrorBoundary } from "@/components/ErrorBoundary";
import type { Title } from "@/lib/types";

// Lightweight, fully client-side "because you watched X" recommendations —
// no ML model or server round-trip, just genre overlap against the most
// recently watchlisted title that's present in the current week's catalog.
// Honest scope: this only considers titles from the currently-loaded week,
// so it may show nothing if your watchlist picks are all from other weeks.
export function RecommendedForYou({ titles }: { titles: Title[] }) {
  const watchlistIds = useWatchlistStore((s) => s.titleIds);
  const { t } = useI18n();

  const { recommendations, anchor } = useMemo(() => {
    if (watchlistIds.length === 0) return { recommendations: [] as Title[], anchor: null as Title | null };
    const watchlisted = titles.filter((title) => watchlistIds.includes(title.id));
    if (watchlisted.length === 0) return { recommendations: [] as Title[], anchor: null as Title | null };

    const pick = watchlisted[watchlisted.length - 1];
    const pickGenres = new Set(pick.genres);

    const scored = titles
      .filter((title) => !watchlistIds.includes(title.id))
      .map((title) => ({ title, score: title.genres.filter((g) => pickGenres.has(g)).length }))
      .filter((x) => x.score > 0)
      .sort((a, b) => b.score - a.score)
      .slice(0, 5)
      .map((x) => x.title);

    return { recommendations: scored, anchor: pick };
  }, [watchlistIds, titles]);

  if (recommendations.length === 0 || !anchor) return null;

  return (
    <motion.section className="mb-12" initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4 }}>
      <h2 className="mb-1 flex items-center gap-2 font-display text-xl font-bold tracking-tight sm:text-2xl">
        <Sparkles className="h-5 w-5 text-accent" /> {t("recommendations.forYou")}
      </h2>
      <p className="mb-4 text-sm text-muted-foreground">
        {t("recommendations.because")} <span className="font-medium text-foreground">{anchor.title}</span>
      </p>
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5">
        {recommendations.map((title) => (
          <ErrorBoundary key={title.id} fallbackLabel="Couldn't load this title.">
            <TitleCard title={title} />
          </ErrorBoundary>
        ))}
      </div>
    </motion.section>
  );
}
