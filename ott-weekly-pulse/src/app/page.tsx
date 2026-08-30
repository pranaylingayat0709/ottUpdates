"use client";
import { useMemo, useState } from "react";
import { motion } from "framer-motion";
import { useTitles, useWeeks } from "@/hooks/useTitles";
import { WeekSelector } from "@/components/WeekSelector";
import { HeroCarousel } from "@/components/HeroCarousel";
import { FilterBar } from "@/components/FilterBar";
import { ReleaseCalendar, CatalogSection } from "@/components/ReleaseCalendar";
import { Clapperboard, Tv } from "lucide-react";
import type { TitleFilters } from "@/lib/types";

const DEFAULT_FILTERS: TitleFilters = { type: "ALL", language: "ALL", platform: "ALL", genre: "ALL" };

export default function DashboardPage() {
  const { data: weeks = [] } = useWeeks();
  const [weekId, setWeekId] = useState<string | undefined>(undefined);
  const [filters, setFilters] = useState<TitleFilters>(DEFAULT_FILTERS);

  const activeWeekId = weekId ?? weeks.find((w) => w.isCurrent)?.id;
  const { data, isLoading } = useTitles(activeWeekId, filters);

  const titles = data?.titles ?? [];
  const heroTitles = useMemo(
    () => titles.filter((t) => t.isMustWatch).sort((a, b) => (a.heroRank ?? 99) - (b.heroRank ?? 99)),
    [titles]
  );

  const hasActiveFilters =
    filters.type !== "ALL" || filters.language !== "ALL" || filters.platform !== "ALL" || filters.genre !== "ALL" || !!filters.minRating || !!filters.search;

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.4 }}>
      <WeekSelector weekId={activeWeekId} onChange={setWeekId} />

      {!hasActiveFilters && heroTitles.length > 0 && <HeroCarousel titles={heroTitles} />}

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
            {data?.total ?? 0} result{(data?.total ?? 0) !== 1 ? "s" : ""}
          </p>
          <CatalogSection
            title="Movies"
            icon={Clapperboard}
            titles={titles.filter((t) => t.type === "MOVIE")}
            emptyLabel=""
          />
          <CatalogSection
            title="Web Series"
            icon={Tv}
            titles={titles.filter((t) => t.type === "SERIES")}
            emptyLabel=""
          />
          {titles.length === 0 && (
            <p className="py-16 text-center text-sm text-muted-foreground">No titles match your filters this week — try widening your search.</p>
          )}
        </div>
      )}

      {!isLoading && !hasActiveFilters && <ReleaseCalendar titles={titles} />}
    </motion.div>
  );
}
