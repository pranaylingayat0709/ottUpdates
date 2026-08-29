import { NextRequest, NextResponse } from "next/server";
import { filterTitles, listTitlesForWeek } from "@/lib/data-source";
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

  const all = listTitlesForWeek(weekId);
  const filtered = filterTitles(all, filters);

  return NextResponse.json({
    titles: filtered,
    total: filtered.length,
    weekId: weekId ?? "current"
  });
}
