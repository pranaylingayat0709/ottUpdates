import { notFound } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, User } from "lucide-react";
import { listWeeks, safeListTitlesForWeek } from "@/lib/data-source";
import { TitleCard } from "@/components/TitleCard";
import { ErrorBoundary } from "@/components/ErrorBoundary";
import type { Metadata } from "next";

export async function generateMetadata({ params }: { params: { name: string } }): Promise<Metadata> {
  const name = decodeURIComponent(params.name);
  return { title: `${name} — OTT Weekly Pulse`, description: `Movies and web series featuring ${name} across Indian OTT platforms.` };
}

export const revalidate = 600;

// Person page — searches across every currently-tracked week for titles
// where this name appears as cast or director, so it works as a real
// "browse everything they're in" page rather than being scoped to one week.
export default async function PersonPage({ params }: { params: { name: string } }) {
  const name = decodeURIComponent(params.name);
  if (!name) return notFound();

  const weeks = listWeeks();
  const seen = new Set<string>();
  const matches = [];
  for (const week of weeks) {
    const titles = await safeListTitlesForWeek(week.id);
    for (const t of titles) {
      const isMatch = t.cast.some((c) => c.toLowerCase() === name.toLowerCase()) || t.director?.toLowerCase() === name.toLowerCase();
      if (isMatch && !seen.has(t.title.toLowerCase())) {
        seen.add(t.title.toLowerCase());
        matches.push(t);
      }
    }
  }

  if (matches.length === 0) return notFound();

  return (
    <div>
      <Link href="/" className="mb-4 inline-flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground">
        <ArrowLeft className="h-3.5 w-3.5" /> Back to Weekly Pulse
      </Link>
      <h1 className="mb-2 flex items-center gap-2 font-display text-2xl font-bold tracking-tight sm:text-3xl">
        <User className="h-6 w-6 text-accent" /> {name}
      </h1>
      <p className="mb-6 text-sm text-muted-foreground">{matches.length} title{matches.length !== 1 ? "s" : ""} across recent and upcoming weeks.</p>

      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5">
        {matches.map((t) => (
          <ErrorBoundary key={t.id} fallbackLabel="">
            <TitleCard title={t} />
          </ErrorBoundary>
        ))}
      </div>
    </div>
  );
}
