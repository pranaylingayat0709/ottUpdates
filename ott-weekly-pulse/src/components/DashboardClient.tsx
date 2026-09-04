"use client";
import { useMemo, useState } from "react";
import { AnimatePresence, motion, type PanInfo } from "framer-motion";
import { useTitles, useWeeks } from "@/hooks/useTitles";
import { WeekSelector } from "@/components/WeekSelector";
import { HeroCarousel } from "@/components/HeroCarousel";
import { HeroSkeleton } from "@/components/HeroSkeleton";
import { FilterBar } from "@/components/FilterBar";
import { ReleaseCalendar, CatalogSection } from "@/components/ReleaseCalendar";
import { ErrorBoundary } from "@/components/ErrorBoundary";
import { RecommendedForYou } from "@/components/RecommendedForYou";
import { ContinueWatching } from "@/components/ContinueWatching";
import { ReminderBanner } from "@/components/ReminderBanner";
import { AnimatedCounter } from "@/components/AnimatedCounter";
import { useI18n } from "@/components/LanguageProvider";
import { useTasteStore } from "@/hooks/useTasteStore";
import { Clapperboard, Tv } from "lucide-react";
import type { TitleFilters, Title, WeekMeta } from "@/lib/types";

const DEFAULT_FILTERS: TitleFilters = { type: "ALL", language: "ALL", platform: "ALL", genre: "ALL" };

interface DashboardClientProps {
  initialWeeks?: WeekMeta[];
  initialTitles?: Title[];
}

export function DashboardClient({ initialWeeks, initialTitles }: DashboardClientProps) {
  const { data: weeks = [] } = useWeeks(initialWeeks);
  const [weekId, setWeekId] = useState<string | undefined>(undefined);
  const [filters, setFilters] = useState<TitleFilters>(DEFAULT_FILTERS);
  const { t } = useI18n();

  const activeWeekId = weekId ?? weeks.find((w) => w.isCurrent)?.id;
  const { data, isLoading } = useTitles(
    activeWeekId,
    filters,
    initialTitles ? { titles: initialTitles, total: initialTitles.length } : undefined
  );

  const titles = data?.titles ?? [];
  const tasteGenres = useTasteStore((s) => s.favoriteGenres);
  const heroTitles = useMemo(() => {
    const musts = titles.filter((t) => t.isMustWatch);
    if (tasteGenres.length === 0) return musts.sort((a, b) => (a.heroRank ?? 99) - (b.heroRank ?? 99));
    // Editorial curation (heroRank) stays the primary order; taste-genre
    // matches only nudge the ordering within that small curated set,
    // rather than overriding it entirely.
    return musts.sort((a, b) => {
      const scoreA = -(a.heroRank ?? 99) * 10 + a.genres.filter((g) => tasteGenres.includes(g)).length;
      const scoreB = -(b.heroRank ?? 99) * 10 + b.genres.filter((g) => tasteGenres.includes(g)).length;
      return scoreB - scoreA;
    });
  }, [titles, tasteGenres]);

  const hasActiveFilters =
    filters.type !== "ALL" || filters.language !== "ALL" || filters.platform !== "ALL" || filters.genre !== "ALL" || !!filters.minRating || !!filters.search;

  const isCurrentWeek = weeks.find((w) => w.id === activeWeekId)?.isCurrent ?? true;

  // Swipe left/right (mobile) or click-drag (desktop) to move between weeks,
  // in addition to tapping the week-selector chips.
  function handleSwipe(_e: MouseEvent | TouchEvent | PointerEvent, info: PanInfo) {
    const threshold = 80;
    const idx = weeks.findIndex((w) => w.id === activeWeekId);
    if (idx === -1) return;
    if (info.offset.x < -threshold && idx < weeks.length - 1) setWeekId(weeks[idx + 1].id);
    else if (info.offset.x > threshold && idx > 0) setWeekId(weeks[idx - 1].id);
  }

  return (
    <div>
      <WeekSelector weekId={activeWeekId} onChange={setWeekId} />

      <AnimatePresence mode="wait">
        <motion.div
          key={activeWeekId ?? "loading"}
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -8 }}
          transition={{ duration: 0.3, ease: [0.22, 1, 0.36, 1] }}
          drag="x"
          dragConstraints={{ left: 0, right: 0 }}
          dragElastic={0.15}
          onDragEnd={handleSwipe}
        >
          {isCurrentWeek && !isLoading && <ReminderBanner currentWeekTitles={titles} />}

          {isLoading && !hasActiveFilters && <HeroSkeleton />}
          {!isLoading && !hasActiveFilters && heroTitles.length > 0 && (
            <ErrorBoundary fallbackLabel="This week's featured picks couldn't be displayed right now.">
              <HeroCarousel titles={heroTitles} />
            </ErrorBoundary>
          )}

          <FilterBar filters={filters} onChange={(next) => setFilters((f) => ({ ...f, ...next }))} />

          {isLoading && (
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5">
              {Array.from({ length: 10 }).map((_, i) => (
                <div key={i} className="skeleton aspect-[2/3] rounded-lg" />
              ))}
            </div>
          )}

          {!isLoading && hasActiveFilters && (
            <div>
              <p className="mb-4 text-sm text-muted-foreground">
                <AnimatedCounter value={data?.total ?? 0} /> result{(data?.total ?? 0) !== 1 ? "s" : ""}
              </p>
              <CatalogSection
                title={t("section.filteredMovies")}
                icon={Clapperboard}
                titles={titles.filter((t) => t.type === "MOVIE")}
                emptyLabel=""
              />
              <CatalogSection
                title={t("section.filteredSeries")}
                icon={Tv}
                titles={titles.filter((t) => t.type === "SERIES")}
                emptyLabel=""
              />
              {titles.length === 0 && (
                <p className="py-16 text-center text-sm text-muted-foreground">{t("noResults")}</p>
              )}
            </div>
          )}

          {!isLoading && !hasActiveFilters && (
            <>
              <ContinueWatching />
              <ErrorBoundary fallbackLabel="">
                <RecommendedForYou titles={titles} />
              </ErrorBoundary>
              <ErrorBoundary fallbackLabel="This week's catalog couldn't be displayed right now — try refreshing.">
                <ReleaseCalendar titles={titles} />
              </ErrorBoundary>
            </>
          )}
        </motion.div>
      </AnimatePresence>
    </div>
  );
}
