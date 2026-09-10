import type { MetadataRoute } from "next";
import { listWeeks, safeListTitlesForWeek } from "@/lib/data-source";
import { GENRE_LABELS } from "@/lib/types";

// Auto-generated from the live catalog. Only the CURRENT week (plus the
// upcoming preview week) gets individual title-page entries — NOT every
// archived week. Historical weeks are still browsable on the site itself
// (via the week selector), just not pushed to search engines as separate
// indexable URLs.
//
// Why: when a live source has no real data for a past week (which is
// common — most live APIs aren't built to answer "what was airing 3
// weeks ago"), the app falls back to showing the curated catalog
// relabeled with that week's dates. Submitting every archived week to
// the sitemap meant Google was being handed the same ~19 curated titles
// repeated across 4+ different URLs with different fake dates — textbook
// near-duplicate content, which actively hurts SEO rather than helping
// it. Scoping to current + upcoming avoids that entirely, since those
// two are the only weeks guaranteed to reflect genuinely distinct
// content for their specific dates.
//
// IMPORTANT: without a revalidate window, this route tries to regenerate
// from scratch on every single request — including Google's own crawl
// attempts, which is easily enough latency to blow past Vercel's
// serverless function timeout ("Couldn't fetch" in Search Console).
export const revalidate = 600;

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const baseUrl = process.env.APP_URL ?? "https://ott-weekly-pulse.vercel.app";
  const weeks = listWeeks().filter((w) => w.isCurrent || new Date(w.weekStartDate) > new Date());

  const staticEntries: MetadataRoute.Sitemap = [
    { url: baseUrl, changeFrequency: "daily", priority: 1 },
    { url: `${baseUrl}/compare`, changeFrequency: "weekly", priority: 0.6 },
    ...Object.keys(GENRE_LABELS).map((genre) => ({
      url: `${baseUrl}/genre/${genre.toLowerCase().replace(/_/g, "-")}`,
      changeFrequency: "weekly" as const,
      priority: 0.5
    }))
  ];

  const perWeekTitles = await Promise.all(weeks.map((week) => safeListTitlesForWeek(week.id)));

  const titleEntries: MetadataRoute.Sitemap = [];
  const seenNames = new Set<string>();
  weeks.forEach((week, i) => {
    for (const title of perWeekTitles[i]) {
      // Defensive de-dupe by name too, in case the same curated title
      // ever appears in both current and upcoming (shouldn't happen given
      // the date-gating elsewhere, but cheap insurance against
      // duplicate-content sitemap entries).
      const key = title.title.toLowerCase();
      if (seenNames.has(key)) continue;
      seenNames.add(key);
      titleEntries.push({
        url: `${baseUrl}/title/${title.id}`,
        lastModified: title.releaseDate,
        changeFrequency: "weekly",
        priority: week.isCurrent ? 0.9 : 0.5
      });
    }
  });

  return [...staticEntries, ...titleEntries];
}
