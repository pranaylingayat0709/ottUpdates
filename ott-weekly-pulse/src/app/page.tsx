import { DashboardClient } from "@/components/DashboardClient";
import { listWeeks, listTitlesForWeek } from "@/lib/data-source";

// How long Next.js can serve a statically-rendered copy of this page
// before regenerating it from listTitlesForWeek() again. This does NOT
// control how often Watchmode gets called — that's entirely gated by
// data-source.ts's own LIVE_CACHE (1h) / KV (35-day) freeze, which this
// page reads from either way. A cache miss there still only costs one
// cheap in-process/KV read; the expensive live Watchmode fetch only
// happens on an actual cache miss in THAT layer. So this number is safe
// to keep short — it only trades "how stale can the public page be after
// the underlying data already refreshed" against regeneration frequency.
// Lowered from 600s (10min) to 120s: at 600s, a visitor (or the admin
// panel, which reads the same data uncached) could see genuinely fresh
// data while the public page kept serving a pre-refresh snapshot for up
// to 10 minutes — exactly the "admin shows titles the site doesn't"
// symptom. 120s keeps that gap small without adding any Watchmode cost.
export const revalidate = 120;

// Server Component: fetches the current week's real catalog server-side so
// it's present in the initial HTML (readable by search engines and fast on
// first paint) and hands it to the client as React Query's initialData —
// the interactive dashboard (filters, week switching, etc.) still runs
// entirely client-side from there.
export default async function Page() {
  const weeks = listWeeks();
  const current = weeks.find((w) => w.isCurrent);
  const titles = current ? await listTitlesForWeek(current.id) : [];

  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "ItemList",
    name: `OTT Weekly Pulse — ${current?.label ?? "This Week"}`,
    itemListElement: titles.slice(0, 20).map((t, i) => ({
      "@type": "ListItem",
      position: i + 1,
      url: `${process.env.APP_URL ?? ""}/title/${t.id}`,
      name: t.title
    }))
  };

  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />
      <DashboardClient initialWeeks={weeks} initialTitles={titles} />
    </>
  );
}
