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
import type { Genre, Platform, Title, OriginalLanguage } from "@/lib/types";

const WATCHMODE_BASE_URL = "https://api.watchmode.com/v1";
const REVALIDATE_SECONDS = 6 * 60 * 60; // 6 hours, via Vercel's persistent Data Cache

// A random stock photo masquerading as a poster is worse than an honest
// "no art available" placeholder — see the matching comment in tmdb.ts.
const NO_POSTER_PLACEHOLDER = "https://placehold.co/500x750/1a1a24/6a6a7a?text=Poster+Not+Available";

function apiKey(): string | undefined {
  return process.env.WATCHMODE_API_KEY;
}

export function isWatchmodeEnabled(): boolean {
  return !!apiKey();
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
  network_names?: string[];
  original_language?: string;
  season_count?: number;
  episode_count?: number;
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
    if (!res.ok) return null;
    return (await res.json()) as T;
  } catch {
    return null;
  }
}

async function listWeeklyTitles(weekStart: Date, weekEnd: Date): Promise<WmListItem[]> {
  // Same honest limitation as the TMDB path: no exact per-platform digital
  // premiere date, so we bias toward a recent window and let popularity
  // sort do the rest.
  const recentFrom = new Date(weekStart);
  recentFrom.setDate(recentFrom.getDate() - 21);

  const data = await wmFetch<WmListResponse>("/list-titles/", {
    types: "movie,tv_series,tv_miniseries",
    source_types: "sub",
    regions: "IN",
    release_date_start: fmt(recentFrom),
    release_date_end: fmt(weekEnd),
    sort_by: "relevance_desc",
    limit: "60"
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
    posterUrl: details.poster || details.backdrop || NO_POSTER_PLACEHOLDER,
    backdropUrl: details.backdrop ?? null,
    trailerUrl: null,
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
    heroRank: null
  };
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
