// Real community rating aggregation — previously the `communityScore` /
// `communityVotes` fields on Title existed in the schema but nothing
// actually populated them from real user activity (they just sat at 0 for
// new live/curated titles). This closes that gap: every review's star
// rating now feeds into a running average, keyed by TITLE NAME rather
// than titleId (titleId is week-scoped — see makeId in data-source.ts —
// so the same real-world title could get a different id next week; the
// name is the stable identity across that boundary).
import "server-only";
import { kvGet, kvSet } from "@/lib/kv-cache";

interface Aggregate {
  sum: number;
  count: number;
}

const MEMORY_AGGREGATES = new Map<string, Aggregate>();
const KV_KEY = "owp:community-ratings";

async function loadAll(): Promise<Map<string, Aggregate>> {
  const kvData = await kvGet<Record<string, Aggregate>>(KV_KEY);
  if (kvData) return new Map(Object.entries(kvData));
  return MEMORY_AGGREGATES;
}

export async function addCommunityRating(titleName: string, rating: number): Promise<void> {
  const key = titleName.toLowerCase();
  const all = await loadAll();
  const existing = all.get(key) ?? { sum: 0, count: 0 };
  const updated = { sum: existing.sum + rating, count: existing.count + 1 };
  all.set(key, updated);
  MEMORY_AGGREGATES.set(key, updated);
  await kvSet(KV_KEY, Object.fromEntries(all), 60 * 60 * 24 * 365);
}

export async function getCommunityRatings(): Promise<Map<string, Aggregate>> {
  return loadAll();
}

export function aggregateToScore(agg: Aggregate | undefined): { score: number; votes: number } {
  if (!agg || agg.count === 0) return { score: 0, votes: 0 };
  return { score: Math.round((agg.sum / agg.count) * 10) / 10, votes: agg.count };
}
