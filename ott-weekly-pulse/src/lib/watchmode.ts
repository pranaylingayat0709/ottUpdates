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
import { kvGet, kvSet } from "@/lib/kv-cache";
import { fetchTmdbCredits } from "@/lib/tmdb";
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
// Candidates per language query (see listWeeklyTitles). Defaults give up to
// 6 Hindi + 4 Marathi + 8 English = 18 candidates, ~37 calls per refresh.
const CANDIDATE_LIMIT = Number(process.env.WATCHMODE_CANDIDATE_LIMIT) || 8;
const HINDI_LIMIT = Number(process.env.WATCHMODE_HINDI_LIMIT) || 6;
const MARATHI_LIMIT = Number(process.env.WATCHMODE_MARATHI_LIMIT) || 4;

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
  tmdb_id?: number | null;
  tmdb_type?: string | null;
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

// ---------- Usage counter + per-item memo ----------
// Every real Watchmode request is counted (in memory, and in KV by month when
// KV is attached) so /admin can show quota use instead of guessing.
let callsThisInstance = 0;
function monthKey() {
  return `owp:wm-calls:${new Date().toISOString().slice(0, 7)}`;
}
async function countCall() {
  callsThisInstance++;
  try {
    const k = monthKey();
    const n = (await kvGet<number>(k)) ?? 0;
    await kvSet(k, n + 1, 40 * 24 * 3600); // best-effort; races only under-count slightly
  } catch {
    /* ignore */
  }
}
export async function getWatchmodeUsage() {
  return {
    month: new Date().toISOString().slice(0, 7),
    callsThisInstance,
    callsThisMonthKv: await kvGet<number>(monthKey())
  };
}

// Small two-level cache (instance memory + KV) for data that doesn't change
// between weekly refreshes: a title's sources/details, the platform-ID map.
// Adjacent weeks' lookback windows overlap, so without this the same title
// was re-fetched (2 credits) for every week it appeared in.
const MEMO = new Map<string, { v: unknown; exp: number }>();
async function memo<T>(key: string, ttlSeconds: number, fn: () => Promise<T | null>): Promise<T | null> {
  const hit = MEMO.get(key);
  if (hit && hit.exp > Date.now()) return hit.v as T;
  const stored = await kvGet<T>(key);
  if (stored) {
    MEMO.set(key, { v: stored, exp: Date.now() + ttlSeconds * 1000 });
    return stored;
  }
  const fresh = await fn();
  if (fresh) {
    MEMO.set(key, { v: fresh, exp: Date.now() + ttlSeconds * 1000 });
    await kvSet(key, fresh, ttlSeconds);
  }
  return fresh;
}

async function wmFetch<T>(path: string, params: Record<string, string>): Promise<T | null> {
  const key = apiKey();
  if (!key) return null;
  const url = new URL(`${WATCHMODE_BASE_URL}${path}`);
  url.searchParams.set("apiKey", key);
  for (const [k, v] of Object.entries(params)) url.searchParams.set(k, v);

  void countCall();
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

// Watchmode source IDs for the platforms this app tracks, looked up once
// (1 credit) and cached for 30 days. Passing them as `source_ids` makes the
// list query return only titles streaming on those platforms, so candidate
// slots (and their 2-credit detail lookups) aren't wasted on titles that
// would be dropped for being on none of them. Empty => param is omitted.
async function trackedSourceIds(): Promise<string> {
  const ids = await memo<number[]>("owp:wm-source-ids:v1", 30 * 24 * 3600, async () => {
    const list = await wmFetch<{ id: number; name: string; type: string }[]>("/sources/", { regions: "IN" });
    if (!Array.isArray(list)) return null;
    const out = list.filter((s) => s.type === "sub" && PROVIDER_MAP[s.name]).map((s) => s.id);
    return out.length ? out : null;
  });
  return (ids ?? []).join(",");
}

async function listWeeklyTitles(weekStart: Date, weekEnd: Date): Promise<WmListItem[]> {
  // Sorted newest-first (this is a WEEKLY RELEASE calendar; relevance sort
  // let old back-catalog titles crowd out genuinely new ones).
  //
  // One combined query returned whatever was newest on Indian services
  // worldwide (Turkish dramas, US docs...) and almost never a Hindi or
  // Marathi title, because Hindi/Marathi releases are a small slice of the
  // global feed. So the pool is built from separate per-language queries,
  // Indian languages first, each with its own quota. Regional releases are
  // sparser, so they get a wider lookback window than English.
  const queries: { languages: string; limit: number; lookbackDays: number }[] = [
    { languages: "hi", limit: HINDI_LIMIT, lookbackDays: 21 },
    { languages: "mr", limit: MARATHI_LIMIT, lookbackDays: 45 },
    { languages: "en", limit: CANDIDATE_LIMIT, lookbackDays: 10 }
  ];

  const sourceIds = await trackedSourceIds();
  const results = await Promise.all(
    queries.map(async (q) => {
      const from = new Date(weekStart);
      from.setDate(from.getDate() - q.lookbackDays);
      const data = await wmFetch<WmListResponse>("/list-titles/", {
        types: "movie,tv_series,tv_miniseries",
        source_types: "sub",
        ...(sourceIds ? { source_ids: sourceIds } : {}),
        regions: "IN",
        languages: q.languages,
        release_date_start: fmt(from),
        release_date_end: fmt(weekEnd),
        sort_by: "release_date_desc",
        limit: String(q.limit)
      });
      return data?.titles ?? [];
    })
  );

  const seen = new Set<number>();
  const merged: WmListItem[] = [];
  for (const list of results) {
    for (const item of list) {
      if (seen.has(item.id)) continue;
      seen.add(item.id);
      merged.push(item);
    }
  }
  return merged;
}

interface SourceBundle {
  platforms: Platform[];
  links: Record<string, string>;
}

async function getSources(id: number): Promise<SourceBundle | null> {
  return memo<SourceBundle>(`owp:wm-sources:v1:${id}`, 7 * 24 * 3600, async () => {
    const sources = await wmFetch<WmSource[]>(`/title/${id}/sources/`, { regions: "IN" });
    if (!sources) return null; // failed request: don't cache an empty answer
    const platforms = new Set<Platform>();
    const links: Record<string, string> = {};
    for (const s of sources) {
      if (s.region !== "IN" || s.type !== "sub") continue;
      const mapped = PROVIDER_MAP[s.name];
      if (!mapped) continue;
      platforms.add(mapped);
      if (s.web_url && !links[mapped]) links[mapped] = s.web_url;
    }
    return { platforms: Array.from(platforms), links };
  });
}

async function getDetails(id: number): Promise<WmDetails | null> {
  return memo<WmDetails>(`owp:wm-details:v1:${id}`, 7 * 24 * 3600, () => wmFetch<WmDetails>(`/title/${id}/details/`, {}));
}

async function getCredits(d: WmDetails): Promise<{ cast: string[]; director: string | null } | null> {
  if (!d.tmdb_id) return null;
  const type = d.tmdb_type === "tv" ? "tv" : "movie";
  return memo(`owp:tmdb-credits:v1:${type}:${d.tmdb_id}`, 30 * 24 * 3600, () => fetchTmdbCredits(type, d.tmdb_id as number));
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
  const [bundle, details] = await Promise.all([getSources(item.id), getDetails(item.id)]);
  if (!bundle || bundle.platforms.length === 0 || !details) return null; // not actually streaming anywhere we track
  const platforms = bundle.platforms;
  const credits = await getCredits(details); // null when TMDB isn't configured

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
    // Real service URLs from Watchmode's sources response; the Watchmode
    // title page is only a fallback for a platform that came back without one.
    platformDeepLinks: Object.fromEntries(platforms.map((p) => [p, bundle.links[p] ?? `https://api.watchmode.com/title/${item.id}`])),
    genres: pickGenres(details.genre_names),
    runtimeMinutes: details.runtime_minutes ?? null,
    totalEpisodes: details.episode_count ?? null,
    seasonNumber: details.season_count ?? null,
    posterUrl: details.poster || details.backdrop || "",
    backdropUrl: details.backdrop ?? null,
    trailerUrl: details.trailer || null,
    synopsis: details.plot_overview || "Synopsis not available yet.",
    director: credits?.director ?? null,
    cast: credits?.cast ?? [],
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
