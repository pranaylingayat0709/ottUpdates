// Demo-scoped newsletter subscriber storage: uses Vercel KV if configured
// (see src/lib/kv-cache.ts), otherwise an in-memory Set that resets on
// cold start — same honest limitation as the reviews/watchlist stores
// elsewhere in this project. Fine for getting the feature working; swap
// for a real database table for production durability.
import "server-only";
import { kvGet, kvSet } from "@/lib/kv-cache";

const MEMORY_SUBSCRIBERS = new Set<string>();
const KV_KEY = "owp:newsletter:subscribers";

export async function addSubscriber(email: string): Promise<void> {
  MEMORY_SUBSCRIBERS.add(email);
  const kvList = (await kvGet<string[]>(KV_KEY)) ?? [];
  if (!kvList.includes(email)) {
    kvList.push(email);
    await kvSet(KV_KEY, kvList, 60 * 60 * 24 * 365); // effectively permanent
  }
}

export async function getAllSubscribers(): Promise<string[]> {
  const kvList = await kvGet<string[]>(KV_KEY);
  if (kvList && kvList.length > 0) return kvList;
  return Array.from(MEMORY_SUBSCRIBERS);
}
