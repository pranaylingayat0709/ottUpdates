"use client";
import { useEffect, useMemo, useState } from "react";
import { AnimatePresence, motion, type PanInfo } from "framer-motion";
import { useTitles, useWeeks, DEFAULT_TITLE_FILTERS } from "@/hooks/useTitles";
import { WeekSelector } from "@/components/WeekSelector";
import { WeekStatsBar } from "@/components/WeekStatsBar";
import { HeroCarousel } from "@/components/HeroCarousel";
import { HeroSkeleton } from "@/components/HeroSkeleton";
import { FilterBar } from "@/components/FilterBar";
import { ReleaseCalendar, CatalogSection } from "@/components/ReleaseCalendar";
import { EmptyState } from "@/components/EmptyState";
import { ErrorBoundary } from "@/components/ErrorBoundary";
import { RecommendedForYou } from "@/components/RecommendedForYou";
import { ContinueWatching } from "@/components/ContinueWatching";
import { ReminderBanner } from "@/components/ReminderBanner";
import { AnimatedCounter } from "@/components/AnimatedCounter";
import { useI18n } from "@/components/LanguageProvider";
import { useTasteStore } from "@/hooks/useTasteStore";
import { Clapperboard, Tv } from "lucide-react";
import type { TitleFilters, Title, WeekMeta } from "@/lib/types";
import { matchesMood, matchesRuntime, type MoodKey, type RuntimeKey } from "@/lib/moods";
import { SurpriseMeButton } from "@/components/SurpriseMeButton";
import { TonightWizard } from "@/components/TonightWizard";
import { Wand2 } from "lucide-react";
import { useLastFiltersStore } from "@/hooks/useLastFiltersStore";


interface DashboardClientProps {
  initialWeeks?: WeekMeta[];
  initialTitles?: Title[];
}

export function DashboardClient({ initialWeeks, initialTitles }: DashboardClientProps) {
  const { data: weeks = [] } = useWeeks(initialWeeks);
  const [weekId, setWeekId] = useState<string | undefined>(undefined);
  const [filters, setFilters] = useState<TitleFilters>(DEFAULT_TITLE_FILTERS);
  const [mood, setMood] = useState<MoodKey | "ALL">("ALL");
  const [runtime, setRuntime] = useState<RuntimeKey | "ALL">("ALL");
  const [wizardOpen, setWizardOpen] = useState(false);
  const { t } = useI18n();
  const lastFilters = useLastFiltersStore((s) => s.filters);
  const setLastFilters = useLastFiltersStore((s) => s.setFilters);

  // Restore the last non-search filter combo once the persisted store has
  // hydrated on the client (its initial value matches DEFAULT_TITLE_FILTERS
  // until then, so this is a no-op for a first-ever visit).
  useEffect(() => {
    setFilters((f) => ({ ...f, ...lastFilters }));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  function updateFilters(next: Partial<TitleFilters>) {
    setFilters((f) => {
      const merged = { ...f, ...next };
      if ("type" in next || "language" in next || "platform" in next || "genre" in next || "minRating" in next) {
        setLastFilters({ type: merged.type, language: merged.language, platform: merged.platform, genre: merged.genre, minRating: merged.minRating });
      }
      return merged;
    });
  }

  const activeWeekId = weekId ?? weeks.find((w) => w.isCurrent)?.id;
  const { data, isLoading } = useTitles(
    activeWeekId,
    filters,
    initialTitles ? { titles: initialTitles, total: initialTitles.length } : undefined
  );

  const rawTitles = data?.titles ?? [];
  // Mood and runtime are fuzzy/compound filters, applied client-side on top
  // of whatever the server already returned rather than as another exact
  // server-side field.
  const titles = useMemo(
    () => rawTitles.filter((t) => matchesMood(t.genres, mood) && matchesRuntime(t, runtime)),
    [rawTitles, mood, runtime]
  );
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
    filters.type !== "ALL" || filters.language !== "ALL" || filters.platform !== "ALL" || filters.genre !== "ALL" || !!filters.minRating || !!filters.search || mood !== "ALL" || runtime !== "ALL";

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
      <WeekStatsBar
        weeks={weeks}
        extraAction={
          !isLoading && rawTitles.length > 0 ? (
            <>
              <button onClick={() => setWizardOpen(true)} className="chip flex items-center gap-1.5">
                <Wand2 className="h-3.5 w-3.5" /> Tonight?
              </button>
              <SurpriseMeButton titles={rawTitles} />
            </>
          ) : undefined
        }
      />
      <TonightWizard titles={rawTitles} open={wizardOpen} onOpenChange={setWizardOpen} />

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

          <FilterBar
            filters={filters}
            onChange={updateFilters}
            mood={mood}
            onMoodChange={setMood}
            runtime={runtime}
            onRuntimeChange={setRuntime}
          />

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
                <AnimatedCounter value={titles.length} /> result{titles.length !== 1 ? "s" : ""}
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
              {titles.length === 0 && <EmptyState message={t("noResults")} />}
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
