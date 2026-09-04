import { notFound } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, Tag } from "lucide-react";
import { listWeeks, safeListTitlesForWeek } from "@/lib/data-source";
import { GENRE_LABELS, type Genre } from "@/lib/types";
import { TitleCard } from "@/components/TitleCard";
import { ErrorBoundary } from "@/components/ErrorBoundary";
import type { Metadata } from "next";

function resolveGenre(param: string): Genre | null {
  const upper = param.toUpperCase().replace(/-/g, "_");
  return (Object.keys(GENRE_LABELS) as Genre[]).includes(upper as Genre) ? (upper as Genre) : null;
}

export async function generateMetadata({ params }: { params: { genre: string } }): Promise<Metadata> {
  const genre = resolveGenre(params.genre);
  if (!genre) return { title: "Collection not found — OTT Weekly Pulse" };
  return { title: `${GENRE_LABELS[genre]} — OTT Weekly Pulse`, description: `New ${GENRE_LABELS[genre]} movies and web series across Indian OTT platforms.` };
}

export const revalidate = 600;

// Genre collection page — aggregates across every currently-tracked week
// (archive + current + upcoming), not just the current week, so it works
// as a real "browse by theme" page rather than a copy of the homepage.
export default async function GenrePage({ params }: { params: { genre: string } }) {
  const genre = resolveGenre(params.genre);
  if (!genre) return notFound();

  const weeks = listWeeks();
  const seen = new Set<string>();
  const matches = [];
  for (const week of weeks) {
    const titles = await safeListTitlesForWeek(week.id);
    for (const t of titles) {
      if (t.genres.includes(genre) && !seen.has(t.title.toLowerCase())) {
        seen.add(t.title.toLowerCase());
        matches.push(t);
      }
    }
  }

  return (
    <div>
      <Link href="/" className="mb-4 inline-flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground">
        <ArrowLeft className="h-3.5 w-3.5" /> Back to Weekly Pulse
      </Link>
      <h1 className="mb-2 flex items-center gap-2 font-display text-2xl font-bold tracking-tight sm:text-3xl">
        <Tag className="h-6 w-6 text-accent" /> {GENRE_LABELS[genre]}
      </h1>
      <p className="mb-6 text-sm text-muted-foreground">{matches.length} title{matches.length !== 1 ? "s" : ""} across recent and upcoming weeks.</p>

      {matches.length === 0 ? (
        <p className="py-16 text-center text-sm text-muted-foreground">No {GENRE_LABELS[genre]} titles found right now.</p>
      ) : (
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5">
          {matches.map((t) => (
            <ErrorBoundary key={t.id} fallbackLabel="">
              <TitleCard title={t} />
            </ErrorBoundary>
          ))}
        </div>
      )}
    </div>
  );
}
