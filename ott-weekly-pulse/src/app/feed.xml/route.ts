import { listWeeks, safeListTitlesForWeek } from "@/lib/data-source";

function escapeXml(str: string): string {
  return str.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");
}

export const revalidate = 600;

// RSS 2.0 feed of the current week's catalog — for RSS readers, other
// aggregators, or anyone who wants to follow new releases without
// visiting the site directly.
export async function GET() {
  const baseUrl = process.env.NEXT_PUBLIC_APP_URL ?? "https://ott-weekly-pulse.vercel.app";
  const weeks = listWeeks();
  const current = weeks.find((w) => w.isCurrent);
  const titles = current ? await safeListTitlesForWeek(current.id) : [];

  const items = titles
    .map(
      (t) => `
    <item>
      <title>${escapeXml(t.title)}</title>
      <link>${baseUrl}/title/${t.id}</link>
      <guid isPermaLink="true">${baseUrl}/title/${t.id}</guid>
      <description>${escapeXml(t.synopsis)}</description>
      <pubDate>${new Date(t.releaseDate).toUTCString()}</pubDate>
      <category>${escapeXml(t.type)}</category>
    </item>`
    )
    .join("");

  const xml = `<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0">
  <channel>
    <title>OTT Weekly Pulse${current ? ` — ${escapeXml(current.label)}` : ""}</title>
    <link>${baseUrl}</link>
    <description>Curated weekly movie and web series picks across Indian OTT platforms — Hindi, Marathi &amp; English.</description>
    <language>en-in</language>${items}
  </channel>
</rss>`;

  return new Response(xml, { headers: { "Content-Type": "application/rss+xml; charset=utf-8" } });
}
