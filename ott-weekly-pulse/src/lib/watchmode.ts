// Live weekly OTT catalog sourced from Watchmode (api.watchmode.com) — a
// dedicated streaming-availability API (this is its entire purpose: which
// platform carries which title, by country). Used instead of TMDB because
// TMDB has been intermittently blocked by several Indian ISPs for years,
// making it hard to even sign up for a key from India. Watchmode has no
// such reports and its whole free tier is built around exactly this
// "what's streaming where" use case.
//
// Free tier: 2,500 requests/month, up to 3 regions, no credit card.
// Get a key at https://api.watchmode.com/requestApiKey
import "server-only";
import { PLATFORM_LABELS, type Genre, type Platform, type Title, type OriginalLanguage } from "@/lib/types";

const WATCHMODE_BASE_URL = "https://api.watchmode.com/v1";
// Watchmode's free tier caps at 2,500 requests/month. Each full refresh
// costs roughly 1 (list-titles) + candidates*2 (sources + details per
// title) calls. data-source.ts's fetch-once-and-freeze cache means this
// is meant to run ONCE per current week (not on a timer) — the ideal
// cost is ~1 refresh/week, not "2 refreshes/day" as an earlier version of
// this comment assumed. In practice it's run more often than that: every
// serverless cold start is a potential cache miss (the in-memory
// LIVE_CACHE resets per-instance), and the admin panel's status check
// (/api/admin/curated-status) calls the exact same listTitlesForWeek()
// path on every load. Real usage confirmed ~386 calls over the key's
// first 5 weeks (~77/week) — about 2x the single-fetch-per-week ideal,
// consistent with occasional redundant re-fetches rather than runaway
// usage, but worth trimming. CANDIDATE_LIMIT lowered from 18 to 12
// (1 + 12*2 = 25 calls/refresh, down from 37 — about a third less per
// fetch) as a safer default; both knobs stay configurable via env vars
// without a code change if you want to trade quota headroom for a
// richer/fresher catalog, or vice versa. The bigger lever is making sure
// a durable cache (Vercel KV) is actually attached in the project's
// Storage tab — without it, every cold serverless instance re-fetches
// independently instead of reusing one frozen weekly snapshot.
const REVALIDATE_SECONDS = Number(process.env.WATCHMODE_REVALIDATE_SECONDS) || 12 * 60 * 60;
const CANDIDATE_LIMIT = Number(process.env.WATCHMODE_CANDIDATE_LIMIT) || 12;

// Empty string signals "no real poster" — see the matching comment in
// tmdb.ts for why this is no longer an external placeholder-service URL.

function apiKey(): string | undefined {
  return process.env.WATCHMODE_API_KEY;
}

export function isWatchmodeEnabled(): boolean {
  return !!apiKey();
}

// Surfaces WHY the last Watchmode call failed (bad key, quota exhausted,
// rate-limited, network timeout, or the request genuinely had zero
// matches) instead of the plain `null` every internal helper here returns
// on failure. That `null` collapsing every distinct failure mode into
// "no results" is exactly why the admin panel could only ever say
// "returned zero titles" — with no way to tell an expired key apart from
// a quiet week apart from a burnt-through monthly quota. Read by the
// admin curated-status endpoint so that distinction shows up in the UI
// instead of requiring a dig through Vercel's function logs.
let lastError: { status: number | null; message: string; at: string } | null = null;

export function getLastWatchmodeError() {
  return lastError;
}

function recordError(status: number | null, message: string) {
  lastError = { status, message, at: new Date().toISOString() };
  // Also goes to Vercel's function logs for anyone who does want the raw detail.
  console.error(`[watchmode] ${status ?? "ERR"} ${message}`);
}

// ---------- Watchmode raw response shapes (only fields we use) ----------
interface WmListItem {
  id: number;
  title: string;
  year?: number;
  type: "movie" | "tv_series" | "tv_miniseries" | string;
}
interface WmListResponse {
  titles?: WmListItem[];
}
interface WmDetails {
  id: number;
  title: string;
  plot_overview?: string;
  type?: string;
  runtime_minutes?: number;
  year?: number;
  genre_names?: string[];
  user_rating?: number;
  critic_score?: number;
  poster?: string;
  backdrop?: string;
  trailer?: string;
  network_names?: string[];
  original_language?: string;
  season_count?: number;
  episode_count?: number;
  // Newer fields (Watchmode Oct-2026 update). Shapes are read defensively —
  // anything missing or unexpected simply yields null and nothing is shown.
  us_rating?: string;
  content_ratings?: unknown;
  release_time?: string;
  popularity?: number;
  popularity_score?: number;
}
interface WmSource {
  source_id: number;
  name: string;
  type: "sub" | "free" | "tve" | "buy" | "rent" | string;
  region: string;
  web_url?: string;
}

// ---------- Lookup tables ----------
const GENRE_MAP: Record<string, Genre> = {
  Action: "ACTION", Adventure: "ACTION", War: "ACTION", Western: "ACTION",
  Comedy: "COMEDY",
  Crime: "CRIME",
  Drama: "DRAMA", History: "DRAMA",
  Family: "FAMILY", Animation: "FAMILY", Kids: "FAMILY",
  Fantasy: "FANTASY",
  Horror: "HORROR",
  Music: "MUSICAL", Musical: "MUSICAL",
  Mystery: "MYSTERY",
  Romance: "ROMANCE",
  "Science Fiction": "SCI_FI", "Sci-Fi & Fantasy": "SCI_FI",
  Thriller: "THRILLER",
  Biography: "BIOPIC",
  Sport: "SPORTS"
};

// Same unified-brand handling as the TMDB integration: the 2025-26
// Disney+Hotstar/JioCinema merger means both old names should map to our
// single JIOHOTSTAR platform.
const PROVIDER_MAP: Record<string, Platform> = {
  Netflix: "NETFLIX",
  "Amazon Prime Video": "PRIME_VIDEO",
  "Prime Video": "PRIME_VIDEO",
  "Disney+ Hotstar": "JIOHOTSTAR",
  "Disney+": "JIOHOTSTAR",
  Hotstar: "JIOHOTSTAR",
  JioHotstar: "JIOHOTSTAR",
  JioCinema: "JIOCINEMA",
  "Sony LIV": "SONYLIV",
  SonyLIV: "SONYLIV",
  ZEE5: "ZEE5",
  "Apple TV Plus": "APPLE_TV",
  "Apple TV+": "APPLE_TV",
  MUBI: "MUBI",
  aha: "AHA",
  "Sun NXT": "SUNNXT"
};

const LANGUAGE_MAP: Record<string, OriginalLanguage> = {
  hi: "HINDI",
  en: "ENGLISH",
  mr: "MARATHI"
};

function fmt(d: Date) {
  return d.toISOString().slice(0, 10).replace(/-/g, ""); // Watchmode wants YYYYMMDD
}

async function wmFetch<T>(path: string, params: Record<string, string>): Promise<T | null> {
  const key = apiKey();
  if (!key) return null;
  const url = new URL(`${WATCHMODE_BASE_URL}${path}`);
  url.searchParams.set("apiKey", key);
  for (const [k, v] of Object.entries(params)) url.searchParams.set(k, v);

  try {
    const res = await fetch(url.toString(), {
      next: { revalidate: REVALIDATE_SECONDS },
      signal: AbortSignal.timeout(8000)
    });
    if (!res.ok) {
      // Watchmode returns 401 for a bad/revoked key and 429 once the
      // monthly quota (2,500 req on the free tier) is exhausted — both
      // silently looked identical to "no releases this week" before this
      // was captured. Body is small (Watchmode error payloads are a short
      // JSON message), so it's safe to read and keep verbatim.
      const body = await res.text().catch(() => "");
      recordError(res.status, body.slice(0, 300) || res.statusText);
      return null;
    }
    lastError = null; // a success clears any previously recorded failure
    return (await res.json()) as T;
  } catch (err) {
    recordError(null, err instanceof Error ? err.message : "Unknown network error");
    return null;
  }
}

async function listWeeklyTitles(weekStart: Date, weekEnd: Date): Promise<WmListItem[]> {
  // Sort by release_date_desc (newest first), not relevance/popularity —
  // this is a WEEKLY RELEASE calendar, and sorting by broad relevance let
  // an already-popular back-catalog title dominate the top N slots for
  // multiple weeks running, crowding out genuinely new releases (the
  // exact "same titles every week" complaint this fixes). Lookback window
  // tightened from 21 to 10 days for the same reason — a title has to be
  // fairly recent to plausibly still be "this week's" release, not just
  // recent-ish.
  const recentFrom = new Date(weekStart);
  recentFrom.setDate(recentFrom.getDate() - 10);

  const data = await wmFetch<WmListResponse>("/list-titles/", {
    types: "movie,tv_series,tv_miniseries",
    source_types: "sub",
    regions: "IN",
    release_date_start: fmt(recentFrom),
    release_date_end: fmt(weekEnd),
    sort_by: "release_date_desc",
    limit: String(CANDIDATE_LIMIT)
  });
  return data?.titles ?? [];
}

async function getSources(id: number): Promise<Platform[]> {
  const sources = await wmFetch<WmSource[]>(`/title/${id}/sources/`, { regions: "IN" });
  const platforms = new Set<Platform>();
  for (const s of sources ?? []) {
    if (s.region !== "IN" || s.type !== "sub") continue;
    const mapped = PROVIDER_MAP[s.name];
    if (mapped) platforms.add(mapped);
  }
  return Array.from(platforms);
}

async function getDetails(id: number): Promise<WmDetails | null> {
  return wmFetch<WmDetails>(`/title/${id}/details/`, {});
}

// content_ratings may arrive as [{country:"IN", rating:"U/A 13+"}] or as
// {IN: "U/A 13+"}. Prefer India; fall back to the older us_rating field.
function pickContentRating(d: WmDetails): string | null {
  const cr = d.content_ratings;
  try {
    if (Array.isArray(cr)) {
      const hit = cr.find((r) => r && typeof r === "object" && String((r as Record<string, unknown>).country ?? (r as Record<string, unknown>).region ?? "").toUpperCase() === "IN") as Record<string, unknown> | undefined;
      const val = hit?.rating ?? hit?.certification;
      if (typeof val === "string" && val.trim()) return val.trim();
    } else if (cr && typeof cr === "object") {
      const val = (cr as Record<string, unknown>).IN ?? (cr as Record<string, unknown>).in;
      if (typeof val === "string" && val.trim()) return val.trim();
    }
  } catch {
    /* ignore malformed shape */
  }
  return typeof d.us_rating === "string" && d.us_rating.trim() ? d.us_rating.trim() : null;
}

function pickGenres(names: string[] | undefined): Genre[] {
  const out = new Set<Genre>();
  for (const name of names ?? []) {
    const g = GENRE_MAP[name];
    if (g) out.add(g);
  }
  return Array.from(out);
}

function makeId(tmdbId: number, weekId: string) {
  return `wm-${tmdbId}-${weekId}`;
}

async function toTitle(item: WmListItem, weekStart: Date, weekEnd: Date, weekId: string): Promise<Title | null> {
  const [platforms, details] = await Promise.all([getSources(item.id), getDetails(item.id)]);
  if (platforms.length === 0 || !details) return null; // not actually streaming anywhere we track

  const isSeries = item.type !== "movie";
  const language = LANGUAGE_MAP[details.original_language ?? ""] ?? "OTHER";

  return {
    id: makeId(item.id, weekId),
    title: details.title,
    type: isSeries ? "SERIES" : "MOVIE",
    releaseDate: weekStart.toISOString(),
    weekStartDate: weekStart.toISOString(),
    weekEndDate: weekEnd.toISOString(),
    weekId,
    originalLanguage: language,
    availableAudioLanguages: [language === "OTHER" ? "Original" : language.charAt(0) + language.slice(1).toLowerCase()],
    subtitleLanguages: ["English"],
    isHindiDubbed: false, // Watchmode doesn't expose per-track dub-language data
    platforms,
    platformDeepLinks: Object.fromEntries(platforms.map((p) => [p, `https://api.watchmode.com/title/${item.id}`])),
    genres: pickGenres(details.genre_names),
    runtimeMinutes: details.runtime_minutes ?? null,
    totalEpisodes: details.episode_count ?? null,
    seasonNumber: details.season_count ?? null,
    posterUrl: details.poster || details.backdrop || "",
    backdropUrl: details.backdrop ?? null,
    trailerUrl: details.trailer || null,
    synopsis: details.plot_overview || "Synopsis not available yet.",
    director: null,
    cast: [],
    imdbRating: null,
    rottenTomatoesScore: details.critic_score ?? null,
    internalCriticRating: details.user_rating ? Math.round(details.user_rating * 10) / 10 : null,
    communityScore: details.user_rating ?? 0,
    communityVotes: 0,
    editorialBadges: [],
    isMustWatch: false,
    heroRank: null,
    contentRating: pickContentRating(details),
    releaseTime: typeof details.release_time === "string" && !Number.isNaN(Date.parse(details.release_time)) ? new Date(details.release_time).toISOString() : null,
    popularity: typeof (details.popularity ?? details.popularity_score) === "number" ? (details.popularity ?? details.popularity_score)! : null
  };
}

export interface LeavingItem {
  title: string;
  platform: string;
  leavesOn: string; // YYYY-MM-DD
}

/**
 * Titles scheduled to leave streaming services in India. One request (one
 * credit), cached for a day by the route handler. Response shape is parsed
 * defensively; any failure returns an empty list so the UI just hides the strip.
 */
export async function fetchLeavingSoon(): Promise<LeavingItem[]> {
  if (!isWatchmodeEnabled()) return [];
  const data = await wmFetch<unknown>("/title-leaving-dates/", { regions: "IN", limit: "10" });
  const rows: unknown[] = Array.isArray(data)
    ? data
    : data && typeof data === "object"
      ? ((data as Record<string, unknown>).titles ?? (data as Record<string, unknown>).results ?? (data as Record<string, unknown>).title_leaving_dates ?? []) as unknown[]
      : [];
  const out: LeavingItem[] = [];
  for (const r of rows) {
    if (!r || typeof r !== "object") continue;
    const o = r as Record<string, unknown>;
    const title = String(o.title ?? o.name ?? "").trim();
    const date = String(o.leaving_date ?? o.leave_date ?? o.end_date ?? o.date ?? "").slice(0, 10);
    const rawPlatform = String(o.source_name ?? o.source ?? o.service ?? "");
    if (!title || !/^\d{4}-\d{2}-\d{2}$/.test(date)) continue;
    out.push({ title, platform: PROVIDER_MAP[rawPlatform] ? PLATFORM_LABELS[PROVIDER_MAP[rawPlatform]] : rawPlatform, leavesOn: date });
  }
  return out.sort((a, b) => a.leavesOn.localeCompare(b.leavesOn)).slice(0, 10);
}

/**
 * Live weekly catalog via Watchmode. Returns null if WATCHMODE_API_KEY
 * isn't set, or if Watchmode is unreachable/returns nothing — callers
 * should fall back to the static mock catalog in that case.
 */
export async function fetchWatchmodeTitlesForWeek(weekStart: Date, weekEnd: Date, weekId: string): Promise<Title[] | null> {
  if (!isWatchmodeEnabled()) return null;

  const items = await listWeeklyTitles(weekStart, weekEnd);
  if (items.length === 0) return null;

  const resolved = await Promise.all(items.map((item) => toTitle(item, weekStart, weekEnd, weekId)));
  const all = resolved.filter((t): t is Title => !!t);
  if (all.length === 0) return null;

  const ranked = [...all].sort((a, b) => (b.internalCriticRating ?? 0) - (a.internalCriticRating ?? 0));
  ranked.slice(0, 4).forEach((t, i) => {
    t.isMustWatch = true;
    t.heroRank = i + 1;
    if (!t.editorialBadges.includes("CRITIC_PICK")) t.editorialBadges = [...t.editorialBadges, "CRITIC_PICK"];
  });

  return all;
}
