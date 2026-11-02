import { NextRequest, NextResponse } from "next/server";
import { listTitlesForWeek, listWeeks } from "@/lib/data-source";
import { buildWeekIcs } from "@/lib/ics";

// Subscribable/downloadable calendar of a release week (current by default).
// Reads the same cached catalog as the home page, so it costs no extra API calls.
export const revalidate = 600;

export async function GET(req: NextRequest) {
  const weeks = listWeeks();
  const wanted = req.nextUrl.searchParams.get("week");
  const week = weeks.find((w) => w.id === wanted) ?? weeks.find((w) => w.isCurrent);
  if (!week) return NextResponse.json({ error: "No week" }, { status: 404 });
  const titles = await listTitlesForWeek(week.id).catch(() => []);
  const base = process.env.APP_URL ?? req.nextUrl.origin;
  return new NextResponse(buildWeekIcs(week.label, titles, base), {
    headers: {
      "Content-Type": "text/calendar; charset=utf-8",
      "Content-Disposition": `attachment; filename="ott-weekly-pulse-${week.weekStartDate.slice(0, 10)}.ics"`,
      "Cache-Control": "public, s-maxage=600, stale-while-revalidate=3600"
    }
  });
}
