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

export function listTitlesForWeek(weekId?: string): Title[] {
  const { weekStartDate, weekEndDate } = getWeekRangeById(weekId);
  const meta = listWeeks().find((w) => w.id === (weekId ?? listWeeks().find((x) => x.isCurrent)?.id));
  const isFutureWeek = meta ? new Date(meta.weekStartDate) > new Date() && !meta.isCurrent : false;

  // The "upcoming" preview week intentionally surfaces fewer confirmed
  // titles (streaming platforms typically confirm release-week lineups a
  // few days out) — trim to first 5 for a realistic "preview" feel.
  const seeds = isFutureWeek ? MOCK_TITLES.slice(0, 5) : MOCK_TITLES;
  return seeds.map((seed) => seedToTitle(seed, weekStartDate, weekEndDate));
}

export function getTitleById(id: string): Title | undefined {
  for (const week of listWeeks()) {
    const titles = listTitlesForWeek(week.id);
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
    if (filters.minRating && (t.imdbRating ?? 0) < filters.minRating) return false;
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
