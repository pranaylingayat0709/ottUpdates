// Demo-scoped push subscription storage, keyed by subscription endpoint.
// Uses Vercel KV if configured, otherwise in-memory (resets on cold start
// — same honest limitation as other demo stores in this project). Each
// record pairs a browser's push subscription with the list of title names
// it wants to be notified about (populated via the "Notify Me" button).
import "server-only";
import { kvGet, kvSet } from "@/lib/kv-cache";
import type { PushSubscription as WebPushSubscription } from "web-push";

export interface SubscriptionRecord {
  subscription: WebPushSubscription;
  titles: string[];
}

const MEMORY_STORE = new Map<string, SubscriptionRecord>();
const KV_KEY = "owp:push:subscriptions";

async function loadAll(): Promise<Map<string, SubscriptionRecord>> {
  const kvData = await kvGet<Record<string, SubscriptionRecord>>(KV_KEY);
  if (kvData) return new Map(Object.entries(kvData));
  return MEMORY_STORE;
}

async function persist(map: Map<string, SubscriptionRecord>): Promise<void> {
  await kvSet(KV_KEY, Object.fromEntries(map), 60 * 60 * 24 * 180); // ~6 months
}

export async function addTitleToSubscription(subscription: WebPushSubscription, title: string): Promise<void> {
  const all = await loadAll();
  const existing = all.get(subscription.endpoint);
  const titles = new Set(existing?.titles ?? []);
  titles.add(title);
  all.set(subscription.endpoint, { subscription, titles: Array.from(titles) });
  MEMORY_STORE.set(subscription.endpoint, { subscription, titles: Array.from(titles) });
  await persist(all);
}

export async function getAllSubscriptionRecords(): Promise<SubscriptionRecord[]> {
  const all = await loadAll();
  return Array.from(all.values());
}

export async function removeTitleFromSubscription(endpoint: string, title: string): Promise<void> {
  const all = await loadAll();
  const existing = all.get(endpoint);
  if (!existing) return;
  const titles = existing.titles.filter((t) => t !== title);
  if (titles.length === 0) {
    all.delete(endpoint);
    MEMORY_STORE.delete(endpoint);
  } else {
    all.set(endpoint, { ...existing, titles });
    MEMORY_STORE.set(endpoint, { ...existing, titles });
  }
  await persist(all);
}
