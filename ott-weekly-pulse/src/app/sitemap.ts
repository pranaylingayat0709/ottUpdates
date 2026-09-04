import type { MetadataRoute } from "next";
import { listWeeks, safeListTitlesForWeek } from "@/lib/data-source";
import { GENRE_LABELS } from "@/lib/types";

// Auto-generated from the live catalog — every title detail page across
// every currently-tracked week (archive + current + upcoming) gets a
// sitemap entry, so search engines can discover and index them without
// needing every page to be linked from the homepage. Genre pages are also
// included (a fixed, stable set of 14) — person pages are deliberately
// left out since names change weekly and offer less individual page value;
// Google will still discover them via the internal links from title pages.
export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const baseUrl = process.env.NEXT_PUBLIC_APP_URL ?? "https://ott-weekly-pulse.vercel.app";
  const weeks = listWeeks();

  const staticEntries: MetadataRoute.Sitemap = [
    { url: baseUrl, changeFrequency: "daily", priority: 1 },
    { url: `${baseUrl}/compare`, changeFrequency: "weekly", priority: 0.6 },
    ...Object.keys(GENRE_LABELS).map((genre) => ({
      url: `${baseUrl}/genre/${genre.toLowerCase().replace(/_/g, "-")}`,
      changeFrequency: "weekly" as const,
      priority: 0.5
    }))
  ];

  const titleEntries: MetadataRoute.Sitemap = [];
  for (const week of weeks) {
    const titles = await safeListTitlesForWeek(week.id);
    for (const title of titles) {
      titleEntries.push({
        url: `${baseUrl}/title/${title.id}`,
        lastModified: title.releaseDate,
        changeFrequency: "weekly",
        priority: week.isCurrent ? 0.9 : 0.5
      });
    }
  }

  return [...staticEntries, ...titleEntries];
}
