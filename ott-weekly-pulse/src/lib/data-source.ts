// In-memory data source built from src/data/mock-data.ts.
//
// This lets the app run fully out-of-the-box (no DATABASE_URL required) for
// demos/previews. For production, point the same functions at Prisma
// (see prisma/schema.prisma + prisma/seed.ts) — the shapes returned here
// match the Prisma models field-for-field, so swapping the body of each
// function below for a `prisma.title.findMany(...)` call is a drop-in change.
import "server-only";
import { addDays } from "date-fns";
import { MOCK_TITLES, type MockTitleSeed } from "@/data/mock-data";
import { getAdjacentWeek, getCurrentWeekRange, getWeekLabel } from "@/lib/week";
import type { Title, WeekMeta, TitleFilters, Review } from "@/lib/types";
import { generateAiVerdict } from "@/lib/nvidia";
import { fetchLiveTitlesForWeek, isLiveDataEnabled } from "@/lib/tmdb";
import { fetchWatchmodeTitlesForWeek, isWatchmodeEnabled } from "@/lib/watchmode";
import { kvGet, kvSet } from "@/lib/kv-cache";

// Deterministic id so the same (title, week) always resolves the same way.
function makeId(title: string, weekStartIso: string): string {
  const raw = `${title}__${weekStartIso}`;
  let hash = 0;
  for (let i = 0; i < raw.length; i++) hash = (hash * 31 + raw.charCodeAt(i)) >>> 0;
  return hash.toString(36);
}

function toWeekMeta(weekStartDate: Date, weekEndDate: Date, isCurrent: boolean): WeekMeta {
  return {
    id: weekStartDate.toISOString().slice(0, 10),
    weekStartDate: weekStartDate.toISOString(),
    weekEndDate: weekEndDate.toISOString(),
    label: getWeekLabel(weekStartDate, weekEndDate),
    isCurrent
  };
}

function seedToTitle(seed: MockTitleSeed, weekStartDate: Date, weekEndDate: Date): Title {
  const releaseDate = addDays(weekStartDate, seed.dayOffset);
  const weekId = weekStartDate.toISOString().slice(0, 10);
  return {
    id: makeId(seed.title, weekId),
    title: seed.title,
    type: seed.type,
    releaseDate: releaseDate.toISOString(),
    weekStartDate: weekStartDate.toISOString(),
    weekEndDate: weekEndDate.toISOString(),
    weekId,
    originalLanguage: seed.originalLanguage,
    availableAudioLanguages: seed.availableAudioLanguages,
    subtitleLanguages: seed.subtitleLanguages,
    isHindiDubbed: seed.isHindiDubbed,
    platforms: seed.platforms,
    platformDeepLinks: Object.fromEntries(
      seed.platforms.map((p) => [p, `https://example-ott.com/${p.toLowerCase()}/${encodeURIComponent(seed.title)}`])
    ),
    genres: seed.genres,
    runtimeMinutes: seed.runtimeMinutes ?? null,
    totalEpisodes: seed.totalEpisodes ?? null,
    seasonNumber: seed.seasonNumber ?? null,
    posterUrl: seed.posterUrl,
    backdropUrl: seed.backdropUrl ?? null,
    trailerUrl: seed.trailerUrl ?? null,
    synopsis: seed.synopsis,
    director: seed.director ?? null,
    cast: seed.cast,
    imdbRating: seed.imdbRating ?? null,
    rottenTomatoesScore: seed.rottenTomatoesScore ?? null,
    internalCriticRating: seed.internalCriticRating ?? null,
    communityScore: seed.communityScore ?? 0,
    communityVotes: seed.communityVotes ?? 0,
    editorialBadges: seed.editorialBadges,
    aiVerdictWatch: null,
    aiVerdictSkip: null,
    isMustWatch: seed.isMustWatch,
    heroRank: seed.heroRank ?? null
  };
}

const WEEK_WINDOW = 4; // weeks of history + upcoming available in the selector

export function listWeeks(): WeekMeta[] {
  const current = getCurrentWeekRange();
  let walker = current.weekStartDate;
  const past: WeekMeta[] = [];
  for (let i = 0; i < WEEK_WINDOW; i++) {
    const prev = getAdjacentWeek(walker, -1);
    past.unshift(toWeekMeta(prev.weekStartDate, prev.weekEndDate, false));
    walker = prev.weekStartDate;
  }
  const currentMeta = toWeekMeta(current.weekStartDate, current.weekEndDate, true);
  const next = getAdjacentWeek(current.weekStartDate, 1);
  const nextMeta = toWeekMeta(next.weekStartDate, next.weekEndDate, false);
  return [...past, currentMeta, nextMeta];
}

function getWeekRangeById(weekId?: string) {
  const current = getCurrentWeekRange();
  if (!weekId) return current;
  const match = listWeeks().find((w) => w.id === weekId);
  if (!match) return current;
  return {
    weekStartDate: new Date(match.weekStartDate),
    weekEndDate: new Date(match.weekEndDate),
    label: match.label
  };
}

export function listTitlesForWeekMock(weekId?: string): Title[] {
  const { weekStartDate, weekEndDate } = getWeekRangeById(weekId);
  const meta = listWeeks().find((w) => w.id === (weekId ?? listWeeks().find((x) => x.isCurrent)?.id));
  const isFutureWeek = meta ? new Date(meta.weekStartDate) > new Date() && !meta.isCurrent : false;

  // The "upcoming" preview week intentionally surfaces fewer confirmed
  // titles (streaming platforms typically confirm release-week lineups a
  // few days out) — trim to first 5 for a realistic "preview" feel.
  const seeds = isFutureWeek ? MOCK_TITLES.slice(0, 5) : MOCK_TITLES;
  return seeds.map((seed) => seedToTitle(seed, weekStartDate, weekEndDate));
}

// In-process cache so repeated requests within the same warm serverless
// instance don't redundantly re-fetch+reassemble the live catalog; the
// underlying TMDB HTTP calls are also cached by Vercel's persistent Data
// Cache (see the `next: { revalidate }` option in src/lib/tmdb.ts), so this
// is a secondary, best-effort optimization rather than the source of truth.
const LIVE_CACHE = new Map<string, { data: Title[]; expiresAt: number }>();
const LIVE_CACHE_TTL_MS = 10 * 60 * 1000; // 10 minutes — short enough that a code/config fix is visible quickly, long enough to avoid hammering the live API on every request

// Ensures Hindi/Marathi content isn't crowded out by globally-popular
// Hollywood titles in the final displayed set. Two layers of defense:
//   1. Reorder so any Hindi/Marathi titles the live source DID return are
//      guaranteed a strong position (up to ~70% of the final list).
//   2. If the live source came back with few or zero Hindi/Marathi titles
//      — which is possible regardless of query params, since neither
//      Watchmode nor (in practice) TMDB reliably guarantee regional
//      representation for a small/niche catalog — blend in real, curated
//      Hindi/Marathi titles from the mock catalog to make up the gap.
//      This is a hard guarantee rather than a hope: the product
//      requirement ("majorly Hindi and Marathi") is met unconditionally,
//      not contingent on how any particular live API happens to rank
//      regional content on a given day.
// Ensures Hindi/Marathi content isn't crowded out by globally-popular
// Hollywood titles in the DISPLAY ORDER. Important: this must never
// reduce the total number of real titles returned — it only reorders
// (Hindi/Marathi first) and, if the live source came back with very few
// Hindi/Marathi titles, blends in extra curated ones. All other titles
// the live source found are preserved and shown, just ordered after the
// Indian-language ones.
function prioritizeIndianLanguages(titles: Title[], weekStart: Date, weekEnd: Date): Title[] {
  const isIndian = (t: Title) => t.originalLanguage === "HINDI" || t.originalLanguage === "MARATHI";
  const liveIndian = titles.filter(isIndian);
  const liveOthers = titles.filter((t) => !isIndian(t));

  // Only supplement with curated titles if the live source found very
  // little Indian content — and even then, this ADDS titles, it never
  // removes any of the real ones the live source returned.
  const minimumIndian = 6;
  const gap = minimumIndian - liveIndian.length;

  let indianPool = liveIndian;
  if (gap > 0) {
    const usedTitles = new Set(liveIndian.map((t) => t.title.toLowerCase()));
    const mockIndianSeeds = MOCK_TITLES.filter(
      (s) => (s.originalLanguage === "HINDI" || s.originalLanguage === "MARATHI") && !usedTitles.has(s.title.toLowerCase())
    );
    const supplemented = mockIndianSeeds.slice(0, gap).map((seed) => seedToTitle(seed, weekStart, weekEnd));
    indianPool = [...liveIndian, ...supplemented];
  }

  // Every real title is kept — Hindi/Marathi just get sorted to the front.
  return [...indianPool, ...liveOthers];
}

/**
 * The catalog for a given week. Priority order:
 *   1. Watchmode (WATCHMODE_API_KEY) — a dedicated streaming-availability
 *      API, unaffected by TMDB's intermittent blocks in India.
 *   2. TMDB (TMDB_API_KEY) — kept as a second live option in case you're
 *      able to get a TMDB key (e.g. via VPN once) or deploy from a region
 *      where it isn't blocked.
 *   3. The manually-curated snapshot in src/data/mock-data.ts, if neither
 *      key is set or both live sources are unreachable.
 */
export async function listTitlesForWeek(weekId?: string): Promise<Title[]> {
  if (!isWatchmodeEnabled() && !isLiveDataEnabled()) return listTitlesForWeekMock(weekId);

  const { weekStartDate, weekEndDate } = getWeekRangeById(weekId);
  const resolvedWeekId = weekId ?? listWeeks().find((w) => w.isCurrent)?.id ?? weekStartDate.toISOString().slice(0, 10);
  const kvKey = `owp:titles:${resolvedWeekId}`;

  const cached = LIVE_CACHE.get(resolvedWeekId);
  if (cached && cached.expiresAt > Date.now()) return cached.data;

  // Vercel KV (if configured) persists across serverless instances/cold
  // starts, unlike the in-memory Map above — checked second since the
  // in-memory hit above is faster when available.
  const kvCached = await kvGet<Title[]>(kvKey);
  if (kvCached && kvCached.length > 0) {
    LIVE_CACHE.set(resolvedWeekId, { data: kvCached, expiresAt: Date.now() + LIVE_CACHE_TTL_MS });
    return kvCached;
  }

  let live: Title[] | null = null;
  if (isWatchmodeEnabled()) {
    live = await fetchWatchmodeTitlesForWeek(weekStartDate, weekEndDate, resolvedWeekId);
  }
  if ((!live || live.length === 0) && isLiveDataEnabled()) {
    live = await fetchLiveTitlesForWeek(weekStartDate, weekEndDate, resolvedWeekId);
  }
  if (!live || live.length === 0) return listTitlesForWeekMock(weekId);

  const balanced = prioritizeIndianLanguages(live, weekStartDate, weekEndDate);
  LIVE_CACHE.set(resolvedWeekId, { data: balanced, expiresAt: Date.now() + LIVE_CACHE_TTL_MS });
  await kvSet(kvKey, balanced, LIVE_CACHE_TTL_MS / 1000);
  return balanced;
}

export async function getTitleById(id: string): Promise<Title | undefined> {
  for (const week of listWeeks()) {
    const titles = await listTitlesForWeek(week.id);
    const found = titles.find((t) => t.id === id);
    if (found) return found;
  }
  return undefined;
}

export function filterTitles(titles: Title[], filters: TitleFilters): Title[] {
  return titles.filter((t) => {
    if (filters.type && filters.type !== "ALL" && t.type !== filters.type) return false;
    if (filters.platform && filters.platform !== "ALL" && !t.platforms.includes(filters.platform)) return false;
    if (filters.genre && filters.genre !== "ALL" && !t.genres.includes(filters.genre)) return false;
    if (filters.language && filters.language !== "ALL") {
      if (filters.language === "HINDI_DUBBED") {
        if (!t.isHindiDubbed) return false;
      } else if (t.originalLanguage !== filters.language) {
        return false;
      }
    }
    if (filters.minRating) {
      const effectiveRating = t.imdbRating ?? t.internalCriticRating ?? t.communityScore ?? 0;
      if (effectiveRating < filters.minRating) return false;
    }
    if (filters.search) {
      const q = filters.search.toLowerCase();
      const haystack = `${t.title} ${t.director ?? ""} ${t.cast.join(" ")} ${t.synopsis}`.toLowerCase();
      if (!haystack.includes(q)) return false;
    }
    return true;
  });
}

// In-memory review store (demo-only; resets on server restart / cold start).
const REVIEW_STORE = new Map<string, Review[]>();

export function listReviews(titleId: string): Review[] {
  return REVIEW_STORE.get(titleId) ?? [];
}

export function addReview(titleId: string, userName: string, rating: number, body: string): Review {
  const review: Review = {
    id: makeId(`${titleId}-${userName}`, new Date().toISOString()),
    titleId,
    userName,
    rating,
    body,
    createdAt: new Date().toISOString()
  };
  const existing = REVIEW_STORE.get(titleId) ?? [];
  REVIEW_STORE.set(titleId, [review, ...existing]);
  return review;
}

// In-memory AI verdict cache so we don't re-call NVIDIA NIM on every request.
const VERDICT_CACHE = new Map<string, { watch: string; skip: string }>();

export async function getOrGenerateVerdict(title: Title) {
  const cached = VERDICT_CACHE.get(title.id);
  if (cached) return cached;
  const verdict = await generateAiVerdict({
    title: title.title,
    type: title.type,
    synopsis: title.synopsis,
    genres: title.genres,
    imdbRating: title.imdbRating
  });
  VERDICT_CACHE.set(title.id, verdict);
  return verdict;
}
