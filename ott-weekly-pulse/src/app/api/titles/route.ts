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
      // invocations. 5-minute fresh window, serves stale for up to 10
      // minutes while quietly refreshing in the background — matches the
      // app's own internal cache window (LIVE_CACHE_TTL_MS) so this
      // never serves noticeably staler data than the app already would.
      headers: { "Cache-Control": "public, s-maxage=300, stale-while-revalidate=600" }
    }
  );
}
