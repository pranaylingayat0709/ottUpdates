import Link from "next/link";
import { ArrowLeft, Trophy } from "lucide-react";
import { listWeeks, safeListTitlesForWeek } from "@/lib/data-source";
import { TitleCard } from "@/components/TitleCard";
import { ErrorBoundary } from "@/components/ErrorBoundary";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Best of the Month — OTT Weekly Pulse",
  description: "The highest-rated movies and web series across the last several weeks of Indian OTT releases."
};

export const revalidate = 600;

// Aggregates across every currently-tracked past + current week (not just
// the current week, unlike the homepage), deduplicated by title name, and
// sorted by rating — a monthly retrospective rather than a weekly one.
export default async function BestOfMonthPage() {
  const weeks = listWeeks();
  const seen = new Set<string>();
  const all = [];
  for (const week of weeks) {
    const titles = await safeListTitlesForWeek(week.id);
    for (const t of titles) {
      if (!seen.has(t.title.toLowerCase()) && new Date(t.releaseDate) <= new Date()) {
        seen.add(t.title.toLowerCase());
        all.push(t);
      }
    }
  }

  const ranked = all
    .sort((a, b) => (b.imdbRating ?? b.internalCriticRating ?? 0) - (a.imdbRating ?? a.internalCriticRating ?? 0))
    .slice(0, 20);

  return (
    <div>
      <Link href="/" className="mb-4 inline-flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground">
        <ArrowLeft className="h-3.5 w-3.5" /> Back to Weekly Pulse
      </Link>
      <h1 className="mb-2 flex items-center gap-2 font-display text-2xl font-bold tracking-tight sm:text-3xl">
        <Trophy className="h-6 w-6 text-accent" /> Best of the Month
      </h1>
      <p className="mb-6 text-sm text-muted-foreground">The {ranked.length} highest-rated picks across recent weeks, all in one place.</p>

      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5">
        {ranked.map((t) => (
          <ErrorBoundary key={t.id} fallbackLabel="">
            <TitleCard title={t} />
          </ErrorBoundary>
        ))}
      </div>
    </div>
  );
}
