"use client";
import { useMemo, useState } from "react";
import { motion } from "framer-motion";
import { ArrowLeftRight, Scale } from "lucide-react";
import { useTitles, useWeeks } from "@/hooks/useTitles";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { PLATFORM_LABELS, PLATFORM_COLORS, GENRE_LABELS, type Platform } from "@/lib/types";
import { formatStartingPrice } from "@/lib/platform-pricing";
import { TitleCard } from "@/components/TitleCard";
import { ErrorBoundary } from "@/components/ErrorBoundary";

const PLATFORM_OPTIONS = Object.entries(PLATFORM_LABELS) as [Platform, string][];

function PlatformColumn({ platform, count, genreBreakdown }: { platform: Platform; count: number; genreBreakdown: [string, number][] }) {
  const price = formatStartingPrice(platform);
  return (
    <div className="glass-panel flex-1 p-4">
      <div className="mb-3 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className="h-3 w-3 rounded-full" style={{ backgroundColor: PLATFORM_COLORS[platform] }} />
          <h3 className="font-display text-lg font-bold">{PLATFORM_LABELS[platform]}</h3>
        </div>
        {price && <span className="chip !py-1 text-[10px]">from {price}*</span>}
      </div>
      <p className="mb-3 text-3xl font-extrabold text-gradient">{count}</p>
      <p className="mb-4 text-xs text-muted-foreground">new titles this week</p>
      <div className="space-y-1.5">
        {genreBreakdown.slice(0, 5).map(([genre, n]) => (
          <div key={genre} className="flex items-center justify-between text-xs">
            <span className="text-muted-foreground">{genre}</span>
            <span className="font-medium">{n}</span>
          </div>
        ))}
        {genreBreakdown.length === 0 && <p className="text-xs text-muted-foreground">No titles to break down.</p>}
      </div>
    </div>
  );
}

export default function ComparePage() {
  const { data: weeks = [] } = useWeeks();
  const currentWeekId = weeks.find((w) => w.isCurrent)?.id;
  const { data, isLoading } = useTitles(currentWeekId, { type: "ALL", language: "ALL", platform: "ALL", genre: "ALL" });

  const [left, setLeft] = useState<Platform>("NETFLIX");
  const [right, setRight] = useState<Platform>("PRIME_VIDEO");

  const titles = data?.titles ?? [];

  const stats = useMemo(() => {
    function statsFor(platform: Platform) {
      const matched = titles.filter((t) => t.platforms.includes(platform));
      const genreCounts = new Map<string, number>();
      for (const t of matched) {
        for (const g of t.genres) {
          const label = GENRE_LABELS[g] ?? g;
          genreCounts.set(label, (genreCounts.get(label) ?? 0) + 1);
        }
      }
      const genreBreakdown = Array.from(genreCounts.entries()).sort((a, b) => b[1] - a[1]);
      return { matched, genreBreakdown };
    }
    return { left: statsFor(left), right: statsFor(right) };
  }, [titles, left, right]);

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.4 }}>
      <h1 className="mb-2 flex items-center gap-2 font-display text-2xl font-bold tracking-tight sm:text-3xl">
        <Scale className="h-6 w-6 text-accent" /> Platform Comparison
      </h1>
      <p className="mb-6 text-sm text-muted-foreground">See which platform has more of what you're looking for this week.</p>

      <div className="mb-8 flex flex-col items-center gap-3 sm:flex-row sm:justify-center">
        <Select value={left} onValueChange={(v) => setLeft(v as Platform)}>
          <SelectTrigger className="w-48"><SelectValue /></SelectTrigger>
          <SelectContent>
            {PLATFORM_OPTIONS.map(([value, label]) => <SelectItem key={value} value={value}>{label}</SelectItem>)}
          </SelectContent>
        </Select>
        <ArrowLeftRight className="h-4 w-4 shrink-0 text-muted-foreground" />
        <Select value={right} onValueChange={(v) => setRight(v as Platform)}>
          <SelectTrigger className="w-48"><SelectValue /></SelectTrigger>
          <SelectContent>
            {PLATFORM_OPTIONS.map(([value, label]) => <SelectItem key={value} value={value}>{label}</SelectItem>)}
          </SelectContent>
        </Select>
      </div>

      {isLoading ? (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <div className="skeleton h-40 rounded-2xl" />
          <div className="skeleton h-40 rounded-2xl" />
        </div>
      ) : (
        <>
          <div className="mb-2 grid grid-cols-1 gap-4 sm:grid-cols-2">
            <PlatformColumn platform={left} count={stats.left.matched.length} genreBreakdown={stats.left.genreBreakdown} />
            <PlatformColumn platform={right} count={stats.right.matched.length} genreBreakdown={stats.right.genreBreakdown} />
          </div>
          <p className="mb-8 text-[10px] text-muted-foreground/70">*Approximate starting price, varies by plan/promo — check the platform directly for current pricing.</p>

          <div className="grid grid-cols-1 gap-8 sm:grid-cols-2">
            <div>
              <h3 className="mb-3 text-sm font-bold">{PLATFORM_LABELS[left]} titles</h3>
              <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
                {stats.left.matched.map((t) => (
                  <ErrorBoundary key={t.id} fallbackLabel="">
                    <TitleCard title={t} />
                  </ErrorBoundary>
                ))}
              </div>
            </div>
            <div>
              <h3 className="mb-3 text-sm font-bold">{PLATFORM_LABELS[right]} titles</h3>
              <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
                {stats.right.matched.map((t) => (
                  <ErrorBoundary key={t.id} fallbackLabel="">
                    <TitleCard title={t} />
                  </ErrorBoundary>
                ))}
              </div>
            </div>
          </div>
        </>
      )}
    </motion.div>
  );
}
