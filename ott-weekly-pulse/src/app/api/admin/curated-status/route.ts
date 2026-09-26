import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { isValidSessionToken, getSessionCookieName } from "@/lib/admin-auth";
import { MOCK_TITLES } from "@/data/mock-data";
import { listWeeks, listTitlesForWeek } from "@/lib/data-source";
import { isWatchmodeEnabled, getLastWatchmodeError } from "@/lib/watchmode";
import { isLiveDataEnabled } from "@/lib/tmdb";

// Lets the admin panel warn when the curated fallback/supplement pool has
// gone stale for the current week — since curated titles are now
// date-anchored (see mock-data.ts's weekStartDate + the freshness fix in
// data-source.ts), a title stops supplementing live results once its own
// week has passed. If that count drops to zero, it's a signal the
// curated pool needs a fresh research pass.
//
// Also reports whether the site is ACTUALLY serving live data right now —
// not just whether an API key env var is set, but whether this week's
// assembled catalog contains at least one title that really came from
// Watchmode/TMDB (id prefix "wm-"/"tmdb-"). This is the one thing that
// silently misconfiguring env vars in Vercel (or deploying an older build)
// can't fake, and it's the fastest way to confirm/rule out "the site has
// quietly fallen back to demo mode, which is why the same curated titles
// keep reappearing every week."
export async function GET() {
  const authenticated = isValidSessionToken(cookies().get(getSessionCookieName())?.value);
  if (!authenticated) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const current = listWeeks().find((w) => w.isCurrent);
  const currentWeekIso = current?.weekStartDate.slice(0, 10) ?? "";
  const activeThisWeek = MOCK_TITLES.filter((s) => s.weekStartDate === currentWeekIso).length;

  const watchmodeKeyPresent = isWatchmodeEnabled();
  const tmdbKeyPresent = isLiveDataEnabled();
  let liveTitleCount = 0;
  let curatedTitleCount = 0;
  let totalTitleCount = 0;
  try {
    const titles = await listTitlesForWeek(current?.id);
    totalTitleCount = titles.length;
    for (const t of titles) {
      if (t.id.startsWith("wm-") || t.id.startsWith("tmdb-")) liveTitleCount++;
      else curatedTitleCount++;
    }
  } catch {
    // leave counts at 0 — the dashboard's own title fetch will surface the error
  }

  const mode: "live" | "demo-fallback" | "demo-mode" =
    liveTitleCount > 0 ? "live" : watchmodeKeyPresent || tmdbKeyPresent ? "demo-fallback" : "demo-mode";

  // The specific reason Watchmode came back empty, if it errored rather
  // than genuinely finding nothing — see getLastWatchmodeError in
  // watchmode.ts. Distinguishing "401: bad key" / "429: quota exhausted"
  // from "genuinely no releases this week" is the whole point of this
  // field; both used to look identical from here.
  const watchmodeError = watchmodeKeyPresent ? getLastWatchmodeError() : null;

  return NextResponse.json({
    totalSeeds: MOCK_TITLES.length,
    activeThisWeek,
    currentWeekLabel: current?.label ?? "unknown",
    currentWeekStartDate: currentWeekIso,
    stale: activeThisWeek === 0,
    dataSource: {
      mode,
      watchmodeKeyPresent,
      tmdbKeyPresent,
      liveTitleCount,
      curatedTitleCount,
      totalTitleCount,
      watchmodeError
    }
  });
}
