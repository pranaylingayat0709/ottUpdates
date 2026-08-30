"use client";
import { useMemo, useState } from "react";
import { format, isSameDay } from "date-fns";
import { motion } from "framer-motion";
import type { Title } from "@/lib/types";
import { cn } from "@/lib/utils";
import { TitleCard } from "@/components/TitleCard";
import { ErrorBoundary } from "@/components/ErrorBoundary";
import { Button } from "@/components/ui/button";
import { useI18n } from "@/components/LanguageProvider";
import { CalendarRange, Clapperboard, Tv, BookOpen, ChevronDown } from "lucide-react";

const gridVariants = {
  hidden: {},
  visible: { transition: { staggerChildren: 0.045 } }
};
const cardVariants = {
  hidden: { opacity: 0, y: 18 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.4, ease: [0.22, 1, 0.36, 1] } }
};

const PAGE_SIZE = 10;

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
  const [visibleCount, setVisibleCount] = useState(PAGE_SIZE);

  if (titles.length === 0) return null;
  const shown = titles.slice(0, visibleCount);
  const hasMore = titles.length > visibleCount;

  return (
    <motion.section
      className="mb-12"
      initial="hidden"
      animate="visible"
      variants={gridVariants}
    >
      <div className="mb-4 flex items-center justify-between">
        <h2 className="flex items-center gap-2 font-display text-xl font-bold tracking-tight sm:text-2xl">
          <Icon className="h-5 w-5 text-accent" /> {title}
        </h2>
        <span className="chip !py-1 text-[11px]">{titles.length} title{titles.length !== 1 ? "s" : ""}</span>
      </div>
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5">
        {shown.map((t) => (
          <motion.div key={t.id} variants={cardVariants}>
            <ErrorBoundary fallbackLabel="Couldn't load this title.">
              <TitleCard title={t} />
            </ErrorBoundary>
          </motion.div>
        ))}
      </div>
      {hasMore && (
        <div className="mt-5 flex justify-center">
          <Button variant="outline" size="sm" onClick={() => setVisibleCount((c) => c + PAGE_SIZE)}>
            {t("loadMore")} <ChevronDown className="h-3.5 w-3.5" />
          </Button>
        </div>
      )}
      {titles.length === 0 && <p className="py-10 text-center text-sm text-muted-foreground">{emptyLabel}</p>}
    </motion.section>
  );
}

export function ReleaseCalendar({ titles }: { titles: Title[] }) {
  const { t } = useI18n();
  const days = useMemo(
    () =>
      Array.from(new Map(titles.map((t) => [new Date(t.releaseDate).toDateString(), new Date(t.releaseDate)])).values()).sort(
        (a, b) => a.getTime() - b.getTime()
      ),
    [titles]
  );

  const [activeDay, setActiveDay] = useState<Date | null>(null);

  const visible = activeDay ? titles.filter((t) => isSameDay(new Date(t.releaseDate), activeDay)) : titles;
  const movies = visible.filter((t) => t.type === "MOVIE");
  const series = visible.filter((t) => t.type === "SERIES");
  const documentaries = visible.filter((t) => t.type === "DOCUMENTARY");

  return (
    <div>
      <h2 className="mb-4 flex items-center gap-2 font-display text-xl font-bold tracking-tight sm:text-2xl">
        <CalendarRange className="h-5 w-5 text-accent" /> {t("calendar.title")}
      </h2>

      <div className="mb-10 grid grid-cols-7 gap-1.5 sm:gap-2">
        {days.map((day) => {
          const count = titles.filter((t) => isSameDay(new Date(t.releaseDate), day)).length;
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

      <CatalogSection title={t("section.movies")} icon={Clapperboard} titles={movies} emptyLabel="No movies match this filter." />
      <CatalogSection title={t("section.webSeries")} icon={Tv} titles={series} emptyLabel="No web series match this filter." />
      <CatalogSection title={t("section.documentaries")} icon={BookOpen} titles={documentaries} emptyLabel="" />

      {visible.length === 0 && (
        <p className="py-16 text-center text-sm text-muted-foreground">No releases match this filter — try another day.</p>
      )}
    </div>
  );
}
