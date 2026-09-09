import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { isValidSessionToken, getSessionCookieName } from "@/lib/admin-auth";
import { MOCK_TITLES } from "@/data/mock-data";
import { listWeeks } from "@/lib/data-source";

// Lets the admin panel warn when the curated fallback/supplement pool has
// gone stale for the current week — since curated titles are now
// date-anchored (see mock-data.ts's weekStartDate + the freshness fix in
// data-source.ts), a title stops supplementing live results once its own
// week has passed. If that count drops to zero, it's a signal the
// curated pool needs a fresh research pass.
export async function GET() {
  const authenticated = isValidSessionToken(cookies().get(getSessionCookieName())?.value);
  if (!authenticated) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const current = listWeeks().find((w) => w.isCurrent);
  const currentWeekIso = current?.weekStartDate.slice(0, 10) ?? "";
  const activeThisWeek = MOCK_TITLES.filter((s) => s.weekStartDate === currentWeekIso).length;

  return NextResponse.json({
    totalSeeds: MOCK_TITLES.length,
    activeThisWeek,
    currentWeekLabel: current?.label ?? "unknown",
    currentWeekStartDate: currentWeekIso,
    stale: activeThisWeek === 0
  });
}
