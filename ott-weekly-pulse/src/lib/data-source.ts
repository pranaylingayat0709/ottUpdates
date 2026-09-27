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
import type { Title, WeekMeta, TitleFilters, Review, SubRatings } from "@/lib/types";
import { generateAiVerdict, generateCriticsTake } from "@/lib/nvidia";
import { fetchLiveTitlesForWeek, isLiveDataEnabled } from "@/lib/tmdb";
import { fetchWatchmodeTitlesForWeek, isWatchmodeEnabled } from "@/lib/watchmode";
import { kvGet, kvSet } from "@/lib/kv-cache";
import { getOverrides } from "@/lib/admin-overrides";
import { addCommunityRating, getCommunityRatings, aggregateToScore } from "@/lib/community-ratings";

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

// Weeks of history shown in the selector (plus the current + next week).
// Kept intentionally small — 2 past + current + next = 4 weeks total, a
// little over a month — both because that's the useful browsing range for
// a WEEKLY release calendar, and because it bounds how much fetched live
// data the app needs to hold onto at all (see STORED_SNAPSHOT_TTL_SECONDS
// below, which expires a week's cached catalog once it's aged out of this
// window).
const WEEK_WINDOW = 2;

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

/**
 * Curated titles that are actually DATED for the queried week — used when
 * live data is configured but happened to return nothing for this
 * specific week (a transient API hiccup, quota exhaustion, or a
 * genuinely sparse window under the tightened 10-day live-query lookback).
 *
 * This is deliberately NOT the same as listTitlesForWeekMock(), which
 * recomputes the ENTIRE curated catalog fresh for whatever week is
 * passed in — that's correct behavior only for the "no live source
 * configured at all" demo-mode case (a permanent, known state). Reusing
 * it here for a live-but-momentarily-empty week would silently relabel
 * old curated titles (Alpha, Bandar, etc.) as brand new every time it
 * triggered — exactly the "same titles keep reappearing" bug this
 * project has hit multiple times. Returning an honest empty result when
 * nothing is date-matched is the correct behavior once live data is
 * meant to be the source of truth: better a quiet/thin week than fake
 * "new" content.
 */
function listDateMatchedCuratedTitles(weekId: string | undefined, weekStartDate: Date, weekEndDate: Date): Title[] {
  const queryWeekIso = weekStartDate.toISOString().slice(0, 10);
  return MOCK_TITLES.filter((seed) => seed.weekStartDate === queryWeekIso).map((seed) =>
    seedToTitle(seed, weekStartDate, weekEndDate)
  );
}

// In-process cache so repeated requests within the same warm serverless
// instance don't redundantly re-fetch+reassemble the live catalog. This is
// purely a per-instance speed optimization (it's wiped on every cold
// start) — the real, durable source of truth is the KV-backed snapshot
// below, which is what actually controls how often Watchmode/TMDB get
// called.
const LIVE_CACHE = new Map<string, { data: Title[]; expiresAt: number }>();
const LIVE_CACHE_TTL_MS = 60 * 60 * 1000; // 1 hour — just avoids redundant reprocessing within a warm instance

// A week's assembled live catalog is fetched ONCE and then frozen: once
// stored, it's reused for the rest of that week and for every later
// request to that same week (via the WeekSelector, best-of-month,
// wrapped, genre/person pages, the sitemap, etc.) instead of ever being
// re-fetched from Watchmode/TMDB again. Real releases for a week that has
// already happened don't change, so there's nothing to gain by
// re-querying — only quota to lose. This is also what makes the refresh
// cadence effectively "once per week, whenever the week rolls over"
// (WEEK_WINDOW's Friday boundary changes the week's id, which is a cache
// miss) without needing an actual cron schedule.
//
// The TTL below is intentionally NOT "forever" — it's sized to a little
// past WEEK_WINDOW's visible range (2 past weeks + current + next) so a
// week's snapshot expires out of storage once nothing in the app can
// show it anymore, rather than accumulating unbounded old data.
const STORED_SNAPSHOT_TTL_SECONDS = 35 * 24 * 60 * 60; // 35 days

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
  //
  // NOW date-gated, same as mergeCuratedTitles — an earlier version left
  // this ungated on the theory that it would rarely trigger, but in
  // practice live Hindi/Marathi supply is thin often enough that it fired
  // most weeks, meaning the same 2-3 curated Hindi titles (Alpha, Bandar,
  // Babita Singh Reporting) kept reappearing indefinitely with their
  // dates silently recomputed — exactly the "content never changes" bug
  // this project has now hit twice. Accuracy wins: if a curated title
  // isn't dated for the week being viewed, it does not show, even if
  // that means fewer Hindi/Marathi titles some weeks than the old
  // "guarantee minimum 6" behavior promised.
  const queryWeekIso = weekStart.toISOString().slice(0, 10);
  const minimumIndian = 6;
  const gap = minimumIndian - liveIndian.length;

  let indianPool = liveIndian;
  if (gap > 0) {
    const usedTitles = new Set(liveIndian.map((t) => t.title.toLowerCase()));
    const mockIndianSeeds = MOCK_TITLES.filter(
      (s) =>
        (s.originalLanguage === "HINDI" || s.originalLanguage === "MARATHI") &&
        s.weekStartDate === queryWeekIso &&
        !usedTitles.has(s.title.toLowerCase())
    );
    const supplemented = mockIndianSeeds.slice(0, gap).map((seed) => seedToTitle(seed, weekStart, weekEnd));
    indianPool = [...liveIndian, ...supplemented];
  }

  // Every real title is kept — Hindi/Marathi just get sorted to the front.
  return [...indianPool, ...liveOthers];
}

// Adds any curated title (src/data/mock-data.ts) not already present in the
// live results, by name — a second, independent data source stacked on top
// of whichever live API(s) are configured, so a title missing from the live
// feed for any reason (a niche title Watchmode/TMDB hasn't indexed yet, a
// query-window miss, etc.) still shows up if it's one we've verified by
// hand. This never removes anything the live source found; it only adds.
function mergeCuratedTitles(liveTitles: Title[], weekStart: Date, weekEnd: Date): Title[] {
  const existingNames = new Set(liveTitles.map((t) => t.title.toLowerCase()));
  const queryWeekIso = weekStart.toISOString().slice(0, 10);
  // Only inject a curated title into the week it actually belongs to — a
  // seed researched for the 28 Aug week must not resurface as "new" in
  // every subsequent week forever. It's added on top of live results only
  // while its own week is the one being viewed; after that it ages out
  // naturally, exactly like a real released title would.
  const additions = MOCK_TITLES.filter(
    (seed) => seed.weekStartDate === queryWeekIso && !existingNames.has(seed.title.toLowerCase())
  ).map((seed) => seedToTitle(seed, weekStart, weekEnd));
  return [...liveTitles, ...additions];
}

/**
 * The catalog for a given week, assembled from every source configured:
 *   1. Watchmode (WATCHMODE_API_KEY) and/or TMDB (TMDB_API_KEY) — both are
 *      queried and merged (deduplicated by title) if both keys are set,
 *      rather than one being a fallback for the other. More sources
 *      queried = fewer real titles missed.
 *   2. The curated snapshot in src/data/mock-data.ts is always merged in
 *      on top (see mergeCuratedTitles) — a second, hand-verified source
 *      that catches anything the live APIs miss, rather than only
 *      appearing when live data is completely unavailable.
 *   3. If NEITHER live source is configured at all, the curated snapshot
 *      is used alone.
 */
async function assembleTitlesForWeek(weekId?: string): Promise<Title[]> {
  if (!isWatchmodeEnabled() && !isLiveDataEnabled()) return listTitlesForWeekMock(weekId);

  const { weekStartDate, weekEndDate } = getWeekRangeById(weekId);
  const weeks = listWeeks();
  const resolvedWeekId = weekId ?? weeks.find((w) => w.isCurrent)?.id ?? weekStartDate.toISOString().slice(0, 10);
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

  // Only the CURRENT week is worth an actual live API call. Pages that
  // aggregate across many weeks (sitemap.xml, best-of-month, wrapped,
  // genre/person pages) all go through this same function, and each
  // distinct week used to trigger its own full Watchmode fetch (1
  // list-titles call + 2 calls per candidate title) — 6+ weeks' worth of
  // calls on every sitemap crawl, which is what actually burned through
  // the 2,500/month free-tier quota in under a month even though a
  // single week's refresh cadence was well inside budget. A past week's
  // real releases don't change after the fact, and the upcoming week is
  // preview-only anyway, so both are served from the curated/mock
  // fallback below at zero API cost instead of re-fetching live data
  // nobody asked to see refresh.
  const isCurrentWeek = weeks.find((w) => w.id === resolvedWeekId)?.isCurrent ?? false;
  if (!isCurrentWeek) {
    return listDateMatchedCuratedTitles(weekId, weekStartDate, weekEndDate);
  }

  const [watchmodeResults, tmdbResults] = await Promise.all([
    isWatchmodeEnabled() ? fetchWatchmodeTitlesForWeek(weekStartDate, weekEndDate, resolvedWeekId) : Promise.resolve(null),
    isLiveDataEnabled() ? fetchLiveTitlesForWeek(weekStartDate, weekEndDate, resolvedWeekId) : Promise.resolve(null)
  ]);

  const seenNames = new Set<string>();
  let live: Title[] = [];
  for (const pool of [watchmodeResults ?? [], tmdbResults ?? []]) {
    for (const t of pool) {
      const key = t.title.toLowerCase();
      if (seenNames.has(key)) continue;
      seenNames.add(key);
      live.push(t);
    }
  }

  if (live.length === 0) {
    // Live is configured but returned nothing for this specific week —
    // NOT the same as "no live source configured at all". Only show
    // curated titles actually dated for this week; if none match, the
    // catalog is genuinely thin/empty this time rather than papered over
    // with recycled old titles relabeled as new.
    return listDateMatchedCuratedTitles(weekId, weekStartDate, weekEndDate);
  }

  const withCurated = mergeCuratedTitles(live, weekStartDate, weekEndDate);
  const balanced = prioritizeIndianLanguages(withCurated, weekStartDate, weekEndDate);
  LIVE_CACHE.set(resolvedWeekId, { data: balanced, expiresAt: Date.now() + LIVE_CACHE_TTL_MS });
  // Stored with the long TTL, not the 1-hour in-memory one — this is the
  // frozen snapshot every later request to this week (this week and every
  // week after, until it ages out of WEEK_WINDOW) will be served from,
  // without ever calling Watchmode/TMDB again for it.
  await kvSet(kvKey, balanced, STORED_SNAPSHOT_TTL_SECONDS);
  // Records the moment this week's snapshot was actually fetched, so the
  // UI can show a genuine "Updated on <date>" instead of today's date —
  // with the fetch-once-and-freeze cache above, a week's data may well be
  // several days old by the time someone's looking at it.
  await kvSet(`${GENERATED_AT_KV_PREFIX}${resolvedWeekId}`, new Date().toISOString(), STORED_SNAPSHOT_TTL_SECONDS);
  return balanced;
}

const GENERATED_AT_KV_PREFIX = "owp:generatedAt:";

// When this week's catalog was actually fetched from Watchmode/TMDB —
// null if it's never been live-fetched (demo mode, KV not configured, or
// a genuinely curated-only week). Read by /api/titles to show a real
// freshness timestamp rather than the current date.
export async function getGeneratedAt(weekId: string): Promise<string | null> {
  return kvGet<string>(`${GENERATED_AT_KV_PREFIX}${weekId}`);
}

/**
 * The catalog for a given week, assembled from every configured source
 * (see assembleTitlesForWeek), then with any admin curation overrides
 * applied on top — hidden titles removed, poster overrides swapped in,
 * and manually-pinned titles added. Overrides are checked fresh on every
 * call regardless of the underlying data-source cache, so an admin change
 * takes effect immediately without waiting for cache expiry.
 */
export async function listTitlesForWeek(weekId?: string): Promise<Title[]> {
  const base = await assembleTitlesForWeek(weekId);
  const withOverrides = await applyAdminOverrides(base, weekId);
  return applyCommunityRatings(withOverrides);
}

// Same as listTitlesForWeek, but never throws — returns [] on any failure
// instead. Used by multi-week aggregation pages (sitemap, best-of-month,
// genre/person pages) so one bad week can't take down the whole page;
// each week's contribution degrades independently.
export async function safeListTitlesForWeek(weekId?: string): Promise<Title[]> {
  try {
    return await listTitlesForWeek(weekId);
  } catch {
    return [];
  }
}

// Merges real review-derived community ratings on top of whatever base
// communityScore/communityVotes the data source provided (usually 0 for a
// brand-new live/curated title) — see community-ratings.ts for why this
// is keyed by title name rather than titleId.
async function applyCommunityRatings(titles: Title[]): Promise<Title[]> {
  const ratings = await getCommunityRatings();
  if (ratings.size === 0) return titles;
  return titles.map((t) => {
    const agg = ratings.get(t.title.toLowerCase());
    if (!agg) return t;
    const { score, votes } = aggregateToScore(agg);
    return { ...t, communityScore: score, communityVotes: votes };
  });
}

async function applyAdminOverrides(titles: Title[], weekId?: string): Promise<Title[]> {
  const overrides = await getOverrides();
  if (overrides.hiddenTitles.length === 0 && Object.keys(overrides.posterOverrides).length === 0 && overrides.pinnedTitles.length === 0) {
    return titles;
  }

  const hiddenSet = new Set(overrides.hiddenTitles.map((n) => n.toLowerCase()));
  let result = titles
    .filter((t) => !hiddenSet.has(t.title.toLowerCase()))
    .map((t) => {
      const override = overrides.posterOverrides[t.title.toLowerCase()];
      return override ? { ...t, posterUrl: override } : t;
    });

  if (overrides.pinnedTitles.length > 0) {
    const { weekStartDate, weekEndDate } = getWeekRangeById(weekId);
    const queryWeekIso = weekStartDate.toISOString().slice(0, 10);
    const existingNames = new Set(result.map((t) => t.title.toLowerCase()));
    // FOURTH previously-undiscovered leak path, found in this audit: unlike
    // every other curated-title injection point in this file, pinned titles
    // were never gated by weekStartDate — an admin "pin this title" action
    // re-stamped the pinned seed onto whatever week was being viewed, every
    // single week, forever, with a fresh id/releaseDate each time. That is
    // precisely the "same titles keep reappearing as new" symptom. A pin is
    // now anchored to the week it was made for, exactly like every other
    // curated seed, and ages out once that week has passed.
    const pinned = overrides.pinnedTitles
      .filter((seed) => seed.weekStartDate === queryWeekIso && !existingNames.has(seed.title.toLowerCase()))
      .map((seed) => seedToTitle(seed, weekStartDate, weekEndDate));
    result = [...pinned, ...result];
  }

  return result;
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

export async function addReview(
  titleId: string,
  titleName: string,
  userName: string,
  rating: number,
  body: string,
  options?: { verifiedWatch?: boolean; subRatings?: SubRatings }
): Promise<Review> {
  const review: Review = {
    id: makeId(`${titleId}-${userName}`, new Date().toISOString()),
    titleId,
    userName,
    rating,
    body,
    createdAt: new Date().toISOString(),
    helpfulCount: 0,
    unhelpfulCount: 0,
    verifiedWatch: options?.verifiedWatch ?? false,
    subRatings: options?.subRatings
  };
  const existing = REVIEW_STORE.get(titleId) ?? [];
  REVIEW_STORE.set(titleId, [review, ...existing]);
  await addCommunityRating(titleName, rating);
  return review;
}

export function voteReview(titleId: string, reviewId: string, direction: "up" | "down"): Review | undefined {
  const reviews = REVIEW_STORE.get(titleId);
  if (!reviews) return undefined;
  const review = reviews.find((r) => r.id === reviewId);
  if (!review) return undefined;
  if (direction === "up") review.helpfulCount += 1;
  else review.unhelpfulCount += 1;
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

// Same caching pattern for the longer-form "Critic's Take".
const CRITICS_TAKE_CACHE = new Map<string, { paragraph: string }>();

export async function getOrGenerateCriticsTake(title: Title) {
  const cached = CRITICS_TAKE_CACHE.get(title.id);
  if (cached) return cached;
  const take = await generateCriticsTake({
    title: title.title,
    type: title.type,
    synopsis: title.synopsis,
    genres: title.genres,
    imdbRating: title.imdbRating
  });
  CRITICS_TAKE_CACHE.set(title.id, take);
  return take;
}
