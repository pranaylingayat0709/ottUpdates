import { NextRequest, NextResponse } from "next/server";
import { filterTitles, listTitlesForWeek, getGeneratedAt, listWeeks } from "@/lib/data-source";
import type { TitleFilters } from "@/lib/types";

export async function GET(req: NextRequest) {
  const sp = req.nextUrl.searchParams;
  const weekId = sp.get("weekId") ?? undefined;

  const filters: TitleFilters = {
    type: (sp.get("type") as TitleFilters["type"]) ?? "ALL",
    language: (sp.get("language") as TitleFilters["language"]) ?? "ALL",
    platform: (sp.get("platform") as TitleFilters["platform"]) ?? "ALL",
    genre: (sp.get("genre") as TitleFilters["genre"]) ?? "ALL",
    minRating: sp.get("minRating") ? Number(sp.get("minRating")) : undefined,
    search: sp.get("search") ?? undefined
  };

  const all = await listTitlesForWeek(weekId);
  const filtered = filterTitles(all, filters);

  const resolvedWeekId = weekId ?? listWeeks().find((w) => w.isCurrent)?.id;
  const generatedAt = resolvedWeekId ? await getGeneratedAt(resolvedWeekId) : null;

  return NextResponse.json(
    {
      titles: filtered,
      total: filtered.length,
      weekId: weekId ?? "current",
      generatedAt
    },
    {
      // Lets Vercel's edge CDN cache this response for repeat visitors
      // (same filter combo = same cache entry), cutting origin function
      // invocations, WITHOUT adding to Watchmode's call count — this only
      // caches the already-assembled JSON; listTitlesForWeek() underneath
      // still only hits Watchmode on its own cache miss regardless of this
      // header. Shortened from 300s/600s (up to a 10-minute-stale window)
      // to 60s/120s (up to 3 minutes): the longer window meant this route
      // could keep serving a response cached from BEFORE the underlying
      // data last refreshed, well after admin's uncached view already
      // showed the new data — the exact "admin shows titles the site
      // doesn't" symptom.
      headers: { "Cache-Control": "public, s-maxage=60, stale-while-revalidate=120" }
    }
  );
}
