import Link from "next/link";
import { PosterImage } from "@/components/PosterImage";
import { ArrowLeft, TrendingUp } from "lucide-react";
import { listWeeks, safeListTitlesForWeek } from "@/lib/data-source";
import { PLATFORM_LABELS } from "@/lib/types";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Top 10 This Week — OTT Weekly Pulse",
  description: "The 10 most popular movies and web series this week, overall and by language."
};

export const revalidate = 600;

function popularityScore(t: { communityVotes: number; communityScore: number; imdbRating?: number | null; internalCriticRating?: number | null }): number {
  // Prefer real community signal when there's enough of it; otherwise fall
  // back to whatever rating is available. Votes act as a light popularity
  // multiplier so a well-voted title edges out an unvoted one with a
  // similar score.
  const baseRating = t.communityVotes > 0 ? t.communityScore : (t.imdbRating ?? t.internalCriticRating ?? 0);
  return baseRating * (1 + Math.log10(1 + t.communityVotes));
}

function rank(titles: Awaited<ReturnType<typeof safeListTitlesForWeek>>) {
  return [...titles].sort((a, b) => popularityScore(b) - popularityScore(a)).slice(0, 10);
}

// Netflix-style numbered Top 10 chart — overall, plus a per-language cut
// (Hindi/Marathi/English) so regional charts get their own spotlight
// instead of being buried under whatever's globally most popular.
export default async function Top10Page() {
  const weeks = listWeeks();
  const current = weeks.find((w) => w.isCurrent);
  const titles = current ? await safeListTitlesForWeek(current.id) : [];

  const overall = rank(titles);
  const hindi = rank(titles.filter((t) => t.originalLanguage === "HINDI"));
  const marathi = rank(titles.filter((t) => t.originalLanguage === "MARATHI"));
  const english = rank(titles.filter((t) => t.originalLanguage === "ENGLISH"));

  const charts = [
    { label: "Overall", items: overall },
    { label: "Hindi", items: hindi },
    { label: "Marathi", items: marathi },
    { label: "English", items: english }
  ].filter((c) => c.items.length > 0);

  return (
    <div>
      <Link href="/" className="mb-4 inline-flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground">
        <ArrowLeft className="h-3.5 w-3.5" /> Back to Weekly Pulse
      </Link>
      <h1 className="mb-2 flex items-center gap-2 font-display text-2xl font-bold tracking-tight sm:text-3xl">
        <TrendingUp className="h-6 w-6 text-accent" /> Top 10 This Week
      </h1>
      <p className="mb-8 text-sm text-muted-foreground">Ranked by community rating and vote volume{current ? ` · ${current.label}` : ""}.</p>

      {charts.length === 0 && <p className="py-16 text-center text-sm text-muted-foreground">Not enough data yet to rank this week.</p>}

      {charts.map((chart) => (
        <section key={chart.label} className="mb-10">
          <h2 className="mb-4 text-lg font-bold">{chart.label}</h2>
          <div className="flex gap-4 overflow-x-auto scrollbar-thin pb-2">
            {chart.items.map((t, i) => (
              <Link key={t.id} href={`/title/${t.id}`} className="group relative flex shrink-0 items-end" style={{ width: 140 }}>
                <span
                  className="pointer-events-none select-none font-display text-[110px] font-black leading-none"
                  style={{
                    WebkitTextStroke: "2px hsl(var(--foreground) / 0.15)",
                    color: "transparent",
                    marginRight: -28
                  }}
                >
                  {i + 1}
                </span>
                <div className="glass-card relative z-10 w-24 shrink-0 overflow-hidden transition-transform group-hover:-translate-y-1">
                  <div className="relative aspect-[2/3] w-full">
                    <PosterImage src={t.posterUrl} alt={t.title} fill sizes="96px" className="object-cover" />
                  </div>
                </div>
              </Link>
            ))}
          </div>
        </section>
      ))}
    </div>
  );
}
