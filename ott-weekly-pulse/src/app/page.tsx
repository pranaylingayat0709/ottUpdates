import { DashboardClient } from "@/components/DashboardClient";
import { listWeeks, listTitlesForWeek } from "@/lib/data-source";

// Revalidate at most every 10 minutes (matches data-source.ts's own cache
// window) — without this, Next.js would statically bake in whatever data
// was available at BUILD time and never refresh it, defeating the entire
// point of live weekly data. This keeps the SEO benefit of a server-
// rendered page while still reflecting the actual current week.
export const revalidate = 600;

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
      url: `${process.env.NEXT_PUBLIC_APP_URL ?? ""}/title/${t.id}`,
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
