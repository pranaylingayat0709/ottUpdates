"use client";
import { useMemo, useState } from "react";
import { format, isSameDay } from "date-fns";
import { motion } from "framer-motion";
import type { Title } from "@/lib/types";
import { cn } from "@/lib/utils";
import { TitleCard } from "@/components/TitleCard";
import { TitleListRow } from "@/components/TitleListRow";
import { ErrorBoundary } from "@/components/ErrorBoundary";
import { AnimatedCounter } from "@/components/AnimatedCounter";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useI18n } from "@/components/LanguageProvider";
import { useViewPreferences, sortTitles, type SortMode } from "@/hooks/useViewPreferences";
import { useMyPlatformsStore } from "@/hooks/useMyPlatformsStore";
import { CalendarRange, Clapperboard, Tv, BookOpen, ChevronDown, LayoutGrid, List, ArrowUpDown } from "lucide-react";

const gridVariants = {
  hidden: {},
  visible: { transition: { staggerChildren: 0.045 } }
};
const cardVariants = {
  hidden: { opacity: 0, y: 18 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.4, ease: [0.22, 1, 0.36, 1] } }
};

const PAGE_SIZE = 12;

const SORT_OPTIONS: { value: SortMode; label: string }[] = [
  { value: "newest", label: "Newest First" },
  { value: "rating", label: "Highest Rated" },
  { value: "popular", label: "Most Popular" },
  { value: "alpha", label: "A–Z" }
];

export function CatalogSection({
  title,
  icon: Icon,
  titles,
  emptyLabel
}: {
  title: string;
  icon: React.ElementType;
  titles: Title[];
  emptyLabel: string;
}) {
  const { t } = useI18n();
  const [expanded, setExpanded] = useState(false);
  const viewMode = useViewPreferences((s) => s.viewMode);
  const sortMode = useViewPreferences((s) => s.sortMode);

  const sorted = useMemo(() => sortTitles(titles, sortMode), [titles, sortMode]);

  if (sorted.length === 0) return null;
  const shown = expanded ? sorted : sorted.slice(0, PAGE_SIZE);
  const hasMore = !expanded && sorted.length > PAGE_SIZE;

  return (
    <motion.section className="mb-12" initial="hidden" animate="visible" variants={gridVariants}>
      <div className="mb-4 flex items-center justify-between">
        <h2 className="flex items-center gap-2 font-display text-xl font-bold tracking-tight sm:text-2xl">
          <Icon className="h-5 w-5 text-accent" /> {title}
        </h2>
        <span className="chip !py-1 text-[11px]"><AnimatedCounter value={sorted.length} /> title{sorted.length !== 1 ? "s" : ""}</span>
      </div>

      {viewMode === "grid" ? (
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5">
          {shown.map((t) => (
            <motion.div key={t.id} variants={cardVariants}>
              <ErrorBoundary fallbackLabel="Couldn't load this title.">
                <TitleCard title={t} />
              </ErrorBoundary>
            </motion.div>
          ))}
        </div>
      ) : (
        <div className="space-y-2">
          {shown.map((t) => (
            <motion.div key={t.id} variants={cardVariants}>
              <ErrorBoundary fallbackLabel="Couldn't load this title.">
                <TitleListRow title={t} />
              </ErrorBoundary>
            </motion.div>
          ))}
        </div>
      )}

      {hasMore && (
        <div className="mt-5 flex justify-center">
          <Button variant="outline" size="sm" onClick={() => setExpanded(true)}>
            {t("viewAll")} ({sorted.length}) <ChevronDown className="h-3.5 w-3.5" />
          </Button>
        </div>
      )}
      {sorted.length === 0 && <p className="py-10 text-center text-sm text-muted-foreground">{emptyLabel}</p>}
    </motion.section>
  );
}

function DisplayToolbar() {
  const viewMode = useViewPreferences((s) => s.viewMode);
  const setViewMode = useViewPreferences((s) => s.setViewMode);
  const sortMode = useViewPreferences((s) => s.sortMode);
  const setSortMode = useViewPreferences((s) => s.setSortMode);
  const myPlatformsOnly = useViewPreferences((s) => s.myPlatformsOnly);
  const setMyPlatformsOnly = useViewPreferences((s) => s.setMyPlatformsOnly);
  const myPlatformsCount = useMyPlatformsStore((s) => s.platforms.length);

  return (
    <div className="mb-6 flex flex-wrap items-center justify-between gap-2">
      <div className="flex items-center gap-2">
        {myPlatformsCount > 0 && (
          <button
            onClick={() => setMyPlatformsOnly(!myPlatformsOnly)}
            className={cn("chip", myPlatformsOnly && "chip-active")}
          >
            My Platforms Only
          </button>
        )}
      </div>
      <div className="flex items-center gap-2">
        <Select value={sortMode} onValueChange={(v) => setSortMode(v as SortMode)}>
          <SelectTrigger className="!min-w-0 gap-1.5 px-3">
            <ArrowUpDown className="h-3.5 w-3.5" />
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {SORT_OPTIONS.map((o) => <SelectItem key={o.value} value={o.value}>{o.label}</SelectItem>)}
          </SelectContent>
        </Select>
        <div className="flex overflow-hidden rounded-full border border-[hsl(var(--foreground)/0.1)]">
          <button
            onClick={() => setViewMode("grid")}
            className={cn("flex h-9 w-9 items-center justify-center transition-colors", viewMode === "grid" ? "bg-accent text-white" : "hover:bg-[hsl(var(--foreground)/0.06)]")}
            aria-label="Grid view"
          >
            <LayoutGrid className="h-4 w-4" />
          </button>
          <button
            onClick={() => setViewMode("list")}
            className={cn("flex h-9 w-9 items-center justify-center transition-colors", viewMode === "list" ? "bg-accent text-white" : "hover:bg-[hsl(var(--foreground)/0.06)]")}
            aria-label="List view"
          >
            <List className="h-4 w-4" />
          </button>
        </div>
      </div>
    </div>
  );
}

export function ReleaseCalendar({ titles }: { titles: Title[] }) {
  const { t } = useI18n();
  const myPlatforms = useMyPlatformsStore((s) => s.platforms);
  const myPlatformsOnly = useViewPreferences((s) => s.myPlatformsOnly);

  const scoped = useMemo(() => {
    if (!myPlatformsOnly || myPlatforms.length === 0) return titles;
    return titles.filter((t) => t.platforms.some((p) => myPlatforms.includes(p)));
  }, [titles, myPlatformsOnly, myPlatforms]);

  const days = useMemo(
    () =>
      Array.from(new Map(scoped.map((t) => [new Date(t.releaseDate).toDateString(), new Date(t.releaseDate)])).values()).sort(
        (a, b) => a.getTime() - b.getTime()
      ),
    [scoped]
  );

  const [activeDay, setActiveDay] = useState<Date | null>(null);

  const visible = activeDay ? scoped.filter((t) => isSameDay(new Date(t.releaseDate), activeDay)) : scoped;
  const movies = visible.filter((t) => t.type === "MOVIE");
  const series = visible.filter((t) => t.type === "SERIES");
  const documentaries = visible.filter((t) => t.type === "DOCUMENTARY");

  return (
    <div>
      <h2 className="mb-4 flex items-center gap-2 font-display text-xl font-bold tracking-tight sm:text-2xl">
        <CalendarRange className="h-5 w-5 text-accent" /> {t("calendar.title")}
      </h2>

      <div className="mb-6 grid grid-cols-7 gap-1.5 sm:gap-2">
        {days.map((day) => {
          const count = scoped.filter((t) => isSameDay(new Date(t.releaseDate), day)).length;
          const isActive = activeDay && isSameDay(activeDay, day);
          return (
            <button
              key={day.toISOString()}
              onClick={() => setActiveDay(isActive ? null : day)}
              className={cn(
                "glass-panel flex flex-col items-center gap-0.5 rounded-xl py-2.5 transition-all duration-200 sm:py-3",
                isActive ? "border-accent/60 bg-accent/10 scale-[1.03]" : "hover:bg-[hsl(var(--foreground)/0.05)] hover:-translate-y-0.5"
              )}
            >
              <span className="text-[10px] uppercase tracking-wide text-muted-foreground">{format(day, "EEE")}</span>
              <span className="text-base font-bold sm:text-lg">{format(day, "d")}</span>
              <span className="text-[10px] text-muted-foreground">{count} title{count !== 1 ? "s" : ""}</span>
            </button>
          );
        })}
      </div>

      <DisplayToolbar />

      <CatalogSection title={t("section.movies")} icon={Clapperboard} titles={movies} emptyLabel="No movies match this filter." />
      <CatalogSection title={t("section.webSeries")} icon={Tv} titles={series} emptyLabel="No web series match this filter." />
      <CatalogSection title={t("section.documentaries")} icon={BookOpen} titles={documentaries} emptyLabel="" />

      {visible.length === 0 && (
        <p className="py-16 text-center text-sm text-muted-foreground">No releases match this filter — try another day{myPlatformsOnly ? " or turn off My Platforms Only" : ""}.</p>
      )}
    </div>
  );
}
