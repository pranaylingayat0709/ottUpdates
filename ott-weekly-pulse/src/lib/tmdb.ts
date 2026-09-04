// Live weekly OTT catalog sourced from TMDB (themoviedb.org) — a free,
// public movie/TV database with a "watch providers" endpoint that reports
// which streaming platforms currently carry a title in a given country.
//
// This replaces manual/mock data with a real, auto-refreshing feed: every
// time the cache window expires, the app re-queries TMDB for whatever is
// currently popular AND actively streaming (flatrate) in India, biased
// toward recent releases — no manual updates needed.
//
// Honest limitation: TMDB doesn't expose an exact "digital premiere date"
// per platform (that's JustWatch's specialty, and JustWatch's public API
// requires a partner agreement). So instead of a strict "released exactly
// this Friday" filter, this queries "currently airing/streaming + popular
// + released recently" — in practice this converges on the same weekly
// slate, but a handful of results may be a week or two old rather than
// exactly this week. Swap in a JustWatch partner feed for exact precision
// if you get API access later.
import "server-only";
import type { Genre, Platform, Title, TitleType, OriginalLanguage } from "@/lib/types";

const TMDB_BASE_URL = process.env.TMDB_BASE_URL ?? "https://api.themoviedb.org/3";
const IMAGE_BASE = "https://image.tmdb.org/t/p";
// TMDB doesn't have a hard monthly request cap like Watchmode (it enforces
// per-second rate limits instead), so this can stay more generous — but
// it's still configurable if you want to tune freshness vs. load.
const REVALIDATE_SECONDS = Number(process.env.TMDB_REVALIDATE_SECONDS) || 6 * 60 * 60;
const CANDIDATE_LIMIT = Number(process.env.TMDB_CANDIDATE_LIMIT) || 40;

function apiKey(): string | undefined {
  return process.env.TMDB_API_KEY;
}

export function isLiveDataEnabled(): boolean {
  return !!apiKey();
}

// ---------- TMDB raw response shapes (only fields we use) ----------
interface TmdbMovieResult {
  id: number;
  title: string;
  overview: string;
  release_date?: string;
  original_language: string;
  genre_ids: number[];
  poster_path?: string | null;
  backdrop_path?: string | null;
  vote_average?: number;
  popularity?: number;
  runtime?: number;
}
interface TmdbTvResult {
  id: number;
  name: string;
  overview: string;
  first_air_date?: string;
  original_language: string;
  genre_ids: number[];
  poster_path?: string | null;
  backdrop_path?: string | null;
  vote_average?: number;
  popularity?: number;
  number_of_episodes?: number;
  seasons?: { season_number: number; episode_count: number }[];
}
interface TmdbWatchProvidersResponse {
  results?: Record<string, { flatrate?: { provider_name: string }[] }>;
}
interface TmdbCreditsResponse {
  cast?: { name: string; order: number }[];
  crew?: { name: string; job: string }[];
}

// ---------- Lookup tables ----------
const MOVIE_GENRE_MAP: Record<number, Genre> = {
  28: "ACTION", 12: "ACTION", 10752: "ACTION", 37: "ACTION",
  35: "COMEDY",
  80: "CRIME",
  18: "DRAMA", 36: "DRAMA", 10770: "DRAMA",
  10751: "FAMILY", 16: "FAMILY",
  14: "FANTASY",
  27: "HORROR",
  10402: "MUSICAL",
  9648: "MYSTERY",
  10749: "ROMANCE",
  878: "SCI_FI"
  // 53 Thriller mapped below to avoid overwrite collisions
};
MOVIE_GENRE_MAP[53] = "THRILLER";

const TV_GENRE_MAP: Record<number, Genre> = {
  10759: "ACTION", 10768: "DRAMA",
  35: "COMEDY",
  80: "CRIME",
  18: "DRAMA", 10766: "DRAMA",
  10751: "FAMILY", 16: "FAMILY", 10762: "FAMILY",
  9648: "MYSTERY",
  10765: "SCI_FI",
  37: "ACTION"
};

const PROVIDER_MAP: Record<string, Platform> = {
  "Netflix": "NETFLIX",
  "Netflix basic with Ads": "NETFLIX",
  "Amazon Prime Video": "PRIME_VIDEO",
  "Prime Video": "PRIME_VIDEO",
  // TMDB's provider list hasn't always caught up to the 2025-26 JioStar
  // merger — map both the old and new branding to our unified JIOHOTSTAR.
  "Disney+ Hotstar": "JIOHOTSTAR",
  "Hotstar": "JIOHOTSTAR",
  "JioHotstar": "JIOHOTSTAR",
  "JioCinema": "JIOCINEMA",
  "Sony LIV": "SONYLIV",
  "SonyLIV": "SONYLIV",
  "ZEE5": "ZEE5",
  "Apple TV Plus": "APPLE_TV",
  "Apple TV+": "APPLE_TV",
  "MUBI": "MUBI",
  "aha": "AHA",
  "Sun NXT": "SUNNXT"
};

const LANGUAGE_MAP: Record<string, OriginalLanguage> = {
  hi: "HINDI",
  en: "ENGLISH",
  mr: "MARATHI"
};

// A random stock photo masquerading as a poster is worse than an honest
// "no art available" placeholder — it looks like a real (wrong) poster
// rather than a clearly-missing one. placehold.co generates a plain
// solid-color graphic with text, not a photo, and works reliably with
// next/image (unlike data: URIs, which the Image optimizer doesn't
// consistently support).
const NO_POSTER_PLACEHOLDER = "https://placehold.co/500x750/1a1a24/6a6a7a?text=Poster+Not+Available";

function poster(path?: string | null, backdropPath?: string | null) {
  // Prefer the real poster; if TMDB has no poster art for this specific
  // entry yet (common for very recently added titles), fall back to the
  // backdrop image before giving up — a real backdrop crop is still real
  // art for this title, unlike a random stock photo.
  if (path) return `${IMAGE_BASE}/w500${path}`;
  if (backdropPath) return `${IMAGE_BASE}/w500${backdropPath}`;
  return NO_POSTER_PLACEHOLDER;
}
function backdrop(path?: string | null) {
  return path ? `${IMAGE_BASE}/w1280${path}` : undefined;
}

async function tmdbFetch<T>(path: string, params: Record<string, string>): Promise<T | null> {
  const key = apiKey();
  if (!key) return null;
  const url = new URL(`${TMDB_BASE_URL}${path}`);
  url.searchParams.set("api_key", key);
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

function fmt(d: Date) {
  return d.toISOString().slice(0, 10);
}

async function getWatchProviders(id: number, mediaType: "movie" | "tv"): Promise<Platform[]> {
  const data = await tmdbFetch<TmdbWatchProvidersResponse>(`/${mediaType}/${id}/watch/providers`, {});
  const inFlatrate = data?.results?.IN?.flatrate ?? [];
  const platforms = new Set<Platform>();
  for (const p of inFlatrate) {
    const mapped = PROVIDER_MAP[p.provider_name];
    if (mapped) platforms.add(mapped);
  }
  return Array.from(platforms);
}

async function getDirectorAndCast(id: number, mediaType: "movie" | "tv") {
  const data = await tmdbFetch<TmdbCreditsResponse>(`/${mediaType}/${id}/credits`, {});
  const director = data?.crew?.find((c) => c.job === "Director")?.name;
  const cast = (data?.cast ?? [])
    .sort((a, b) => a.order - b.order)
    .slice(0, 4)
    .map((c) => c.name);
  return { director, cast };
}

interface TmdbVideosResponse {
  results?: { site: string; type: string; key: string; official?: boolean }[];
}

async function getTrailerUrl(id: number, mediaType: "movie" | "tv"): Promise<string | null> {
  const data = await tmdbFetch<TmdbVideosResponse>(`/${mediaType}/${id}/videos`, {});
  const videos = data?.results ?? [];
  const trailer =
    videos.find((v) => v.site === "YouTube" && v.type === "Trailer" && v.official) ??
    videos.find((v) => v.site === "YouTube" && v.type === "Trailer") ??
    videos.find((v) => v.site === "YouTube");
  return trailer ? `https://www.youtube.com/watch?v=${trailer.key}` : null;
}

async function discoverMovies(weekStart: Date, weekEnd: Date): Promise<TmdbMovieResult[]> {
  // Recent window biased toward this week, since TMDB has no per-platform
  // digital-premiere-date field to filter on exactly.
  const recentFrom = new Date(weekStart);
  recentFrom.setDate(recentFrom.getDate() - 21);

  // Run separate queries per language instead of one global-popularity
  // query — a single popularity-sorted call is dominated by Hollywood
  // titles with far larger global vote counts, which was silently
  // crowding out Hindi/Marathi content. Fetching Hindi and Marathi pools
  // explicitly guarantees they're represented regardless of global buzz.
  const baseParams = {
    region: "IN",
    watch_region: "IN",
    with_watch_monetization_types: "flatrate",
    sort_by: "popularity.desc",
    "primary_release_date.gte": fmt(recentFrom),
    "primary_release_date.lte": fmt(weekEnd),
    "vote_count.gte": "2"
  };

  const [hindi, marathi, general] = await Promise.all([
    tmdbFetch<{ results: TmdbMovieResult[] }>("/discover/movie", { ...baseParams, with_original_language: "hi" }),
    tmdbFetch<{ results: TmdbMovieResult[] }>("/discover/movie", { ...baseParams, with_original_language: "mr" }),
    tmdbFetch<{ results: TmdbMovieResult[] }>("/discover/movie", { ...baseParams, "vote_count.gte": "5" })
  ]);

  const seen = new Set<number>();
  const merged: TmdbMovieResult[] = [];
  // Hindi and Marathi pools go first so they survive any later truncation.
  for (const pool of [hindi?.results ?? [], marathi?.results ?? [], general?.results ?? []]) {
    for (const item of pool) {
      if (seen.has(item.id)) continue;
      seen.add(item.id);
      merged.push(item);
    }
  }
  return merged.slice(0, CANDIDATE_LIMIT);
}

async function discoverTv(weekStart: Date, weekEnd: Date): Promise<TmdbTvResult[]> {
  const recentFrom = new Date(weekStart);
  recentFrom.setDate(recentFrom.getDate() - 21);

  const baseParams = {
    watch_region: "IN",
    with_watch_monetization_types: "flatrate",
    sort_by: "popularity.desc",
    "first_air_date.gte": fmt(recentFrom),
    "first_air_date.lte": fmt(weekEnd),
    "vote_count.gte": "1"
  };

  const [hindi, marathi, general] = await Promise.all([
    tmdbFetch<{ results: TmdbTvResult[] }>("/discover/tv", { ...baseParams, with_original_language: "hi" }),
    tmdbFetch<{ results: TmdbTvResult[] }>("/discover/tv", { ...baseParams, with_original_language: "mr" }),
    tmdbFetch<{ results: TmdbTvResult[] }>("/discover/tv", { ...baseParams, "vote_count.gte": "3" })
  ]);

  const seen = new Set<number>();
  const merged: TmdbTvResult[] = [];
  for (const pool of [hindi?.results ?? [], marathi?.results ?? [], general?.results ?? []]) {
    for (const item of pool) {
      if (seen.has(item.id)) continue;
      seen.add(item.id);
      merged.push(item);
    }
  }
  return merged.slice(0, CANDIDATE_LIMIT);
}

function pickGenres(ids: number[], map: Record<number, Genre>): Genre[] {
  const out = new Set<Genre>();
  for (const id of ids) {
    const g = map[id];
    if (g) out.add(g);
  }
  return Array.from(out);
}

function makeId(mediaType: string, tmdbId: number, weekId: string) {
  return `tmdb-${mediaType}-${tmdbId}-${weekId}`;
}

async function movieToTitle(m: TmdbMovieResult, weekStart: Date, weekEnd: Date, weekId: string): Promise<Title | null> {
  const platforms = await getWatchProviders(m.id, "movie");
  if (platforms.length === 0) return null; // not actually streaming anywhere we track

  const [{ director, cast }, trailerUrl] = await Promise.all([
    getDirectorAndCast(m.id, "movie"),
    getTrailerUrl(m.id, "movie")
  ]);
  const language = LANGUAGE_MAP[m.original_language] ?? "OTHER";

  return {
    id: makeId("movie", m.id, weekId),
    title: m.title,
    type: "MOVIE",
    releaseDate: m.release_date ?? weekStart.toISOString(),
    weekStartDate: weekStart.toISOString(),
    weekEndDate: weekEnd.toISOString(),
    weekId,
    originalLanguage: language,
    availableAudioLanguages: [language === "OTHER" ? "Original" : language.charAt(0) + language.slice(1).toLowerCase()],
    subtitleLanguages: ["English"],
    isHindiDubbed: false, // TMDB doesn't expose per-language dub tracks reliably
    platforms,
    platformDeepLinks: Object.fromEntries(platforms.map((p) => [p, `https://www.themoviedb.org/movie/${m.id}`])),
    genres: pickGenres(m.genre_ids, MOVIE_GENRE_MAP),
    runtimeMinutes: m.runtime ?? null,
    totalEpisodes: null,
    seasonNumber: null,
    posterUrl: poster(m.poster_path, m.backdrop_path),
    backdropUrl: backdrop(m.backdrop_path) ?? null,
    trailerUrl,
    synopsis: m.overview || "Synopsis not available yet.",
    director: director ?? null,
    cast,
    imdbRating: null,
    rottenTomatoesScore: null,
    internalCriticRating: m.vote_average ? Math.round(m.vote_average * 10) / 10 : null,
    communityScore: m.vote_average ?? 0,
    communityVotes: 0,
    editorialBadges: (m.popularity ?? 0) > 40 ? ["TRENDING"] : [],
    isMustWatch: false,
    heroRank: null
  };
}

async function tvToTitle(t: TmdbTvResult, weekStart: Date, weekEnd: Date, weekId: string): Promise<Title | null> {
  const platforms = await getWatchProviders(t.id, "tv");
  if (platforms.length === 0) return null;

  const [{ cast }, trailerUrl] = await Promise.all([getDirectorAndCast(t.id, "tv"), getTrailerUrl(t.id, "tv")]);
  const language = LANGUAGE_MAP[t.original_language] ?? "OTHER";

  return {
    id: makeId("tv", t.id, weekId),
    title: t.name,
    type: "SERIES",
    releaseDate: t.first_air_date ?? weekStart.toISOString(),
    weekStartDate: weekStart.toISOString(),
    weekEndDate: weekEnd.toISOString(),
    weekId,
    originalLanguage: language,
    availableAudioLanguages: [language === "OTHER" ? "Original" : language.charAt(0) + language.slice(1).toLowerCase()],
    subtitleLanguages: ["English"],
    isHindiDubbed: false,
    platforms,
    platformDeepLinks: Object.fromEntries(platforms.map((p) => [p, `https://www.themoviedb.org/tv/${t.id}`])),
    genres: pickGenres(t.genre_ids, TV_GENRE_MAP),
    runtimeMinutes: null,
    totalEpisodes: t.number_of_episodes ?? t.seasons?.at(-1)?.episode_count ?? null,
    seasonNumber: t.seasons?.at(-1)?.season_number ?? null,
    posterUrl: poster(t.poster_path, t.backdrop_path),
    backdropUrl: backdrop(t.backdrop_path) ?? null,
    trailerUrl,
    synopsis: t.overview || "Synopsis not available yet.",
    director: null,
    cast,
    imdbRating: null,
    rottenTomatoesScore: null,
    internalCriticRating: t.vote_average ? Math.round(t.vote_average * 10) / 10 : null,
    communityScore: t.vote_average ?? 0,
    communityVotes: 0,
    editorialBadges: (t.popularity ?? 0) > 40 ? ["TRENDING"] : [],
    isMustWatch: false,
    heroRank: null
  };
}

/**
 * Live weekly catalog for a given Friday->Thursday window. Returns null if
 * TMDB_API_KEY isn't configured, or if TMDB is unreachable — callers should
 * fall back to the static mock catalog in that case.
 */
export async function fetchLiveTitlesForWeek(weekStart: Date, weekEnd: Date, weekId: string): Promise<Title[] | null> {
  if (!isLiveDataEnabled()) return null;

  const [movies, tv] = await Promise.all([discoverMovies(weekStart, weekEnd), discoverTv(weekStart, weekEnd)]);
  if (movies.length === 0 && tv.length === 0) return null;

  const [movieTitles, tvTitles] = await Promise.all([
    Promise.all(movies.map((m) => movieToTitle(m, weekStart, weekEnd, weekId))),
    Promise.all(tv.map((t) => tvToTitle(t, weekStart, weekEnd, weekId)))
  ]);

  const all = [...movieTitles, ...tvTitles].filter((t): t is Title => !!t);

  // Editorial hero picks: top 4 by internal score, tagged as must-watch.
  const ranked = [...all].sort((a, b) => (b.internalCriticRating ?? 0) - (a.internalCriticRating ?? 0));
  ranked.slice(0, 4).forEach((t, i) => {
    t.isMustWatch = true;
    t.heroRank = i + 1;
    if (!t.editorialBadges.includes("CRITIC_PICK")) t.editorialBadges = [...t.editorialBadges, "CRITIC_PICK"];
  });

  return all;
}
