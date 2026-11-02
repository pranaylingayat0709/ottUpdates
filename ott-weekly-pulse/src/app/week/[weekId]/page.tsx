import Link from "next/link";
import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { CalendarPlus } from "lucide-react";
import { listTitlesForWeek, listWeeks } from "@/lib/data-source";
import { TitleCard } from "@/components/TitleCard";
import { PLATFORM_LABELS } from "@/lib/types";

// One crawlable page per release week: plain server-rendered HTML + JSON-LD,
// so search engines get a stable, shareable URL ("new OTT releases, 23–29 Oct").
// Archived weeks are still viewable but marked noindex (see sitemap.ts for the
// reasoning on duplicate content).
export const revalidate = 600;

function findWeek(id: string) {
  return listWeeks().find((w) => w.id === id);
}

export async function generateMetadata({ params }: { params: { weekId: string } }): Promise<Metadata> {
  const week = findWeek(params.weekId);
  if (!week) return { title: "Week not found — OTT Weekly Pulse" };
  const indexable = week.isCurrent || new Date(week.weekStartDate) > new Date();
  return {
    title: `New OTT releases ${week.label} — OTT Weekly Pulse`,
    description: `Every new movie and web series on Netflix, Prime Video, JioHotstar, SonyLIV and ZEE5 for ${week.label} — Hindi, Marathi and English.`,
    alternates: { canonical: `/week/${week.id}` },
    robots: indexable ? { index: true, follow: true } : { index: false, follow: true }
  };
}

export default async function WeekPage({ params }: { params: { weekId: string } }) {
  const week = findWeek(params.weekId);
  if (!week) return notFound();
  const titles = await listTitlesForWeek(week.id).catch(() => []);
  const base = process.env.APP_URL ?? "";

  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "ItemList",
    name: `New OTT releases, ${week.label}`,
    itemListElement: titles.slice(0, 30).map((t, i) => ({
      "@type": "ListItem",
      position: i + 1,
      item: {
        "@type": t.type === "MOVIE" ? "Movie" : "TVSeries",
        name: t.title,
        url: `${base}/title/${t.id}`,
        datePublished: t.releaseDate.slice(0, 10),
        inLanguage: t.originalLanguage.toLowerCase(),
        description: t.synopsis
      }
    }))
  };

  const groups = [
    { label: "Movies", list: titles.filter((t) => t.type === "MOVIE") },
    { label: "Web series", list: titles.filter((t) => t.type === "SERIES") },
    { label: "Documentaries", list: titles.filter((t) => t.type === "DOCUMENTARY") }
  ].filter((g) => g.list.length > 0);

  return (
    <div>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />
      <nav className="mb-4 text-xs text-muted-foreground">
        <Link href="/" className="hover:text-foreground">Home</Link> / <span>Week of {week.label}</span>
      </nav>
      <div className="mb-6 flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="font-display text-fluid-h1 font-bold tracking-tight">New on OTT: {week.label}</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            {titles.length} title{titles.length === 1 ? "" : "s"} across {Object.keys(PLATFORM_LABELS).length} tracked platforms.
          </p>
        </div>
        <a href={`/api/calendar?week=${week.id}`} className="chip" download>
          <CalendarPlus className="h-3.5 w-3.5" /> Add to calendar
        </a>
      </div>

      {groups.length === 0 && <p className="text-sm text-muted-foreground">No releases listed for this week yet.</p>}
      {groups.map((g) => (
        <section key={g.label} className="mb-10" aria-label={g.label}>
          <h2 className="mb-3 font-display text-xl font-bold">{g.label}</h2>
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5">
            {g.list.map((t) => (
              <TitleCard key={t.id} title={t} />
            ))}
          </div>
        </section>
      ))}

      <p className="text-xs text-muted-foreground">
        Other weeks:{" "}
        {listWeeks().filter((w) => w.id !== week.id).map((w, i) => (
          <span key={w.id}>{i > 0 && " · "}<Link href={`/week/${w.id}`} className="underline hover:text-foreground">{w.label}</Link></span>
        ))}
      </p>
    </div>
  );
}
