// Curation overrides applied on top of whatever data-source.ts assembles
// from live + curated sources — lets the site owner fix issues (hide a
// bad entry, correct a poster URL, manually pin a title the live APIs
// missed) via the /admin panel instead of a code deploy. Uses Vercel KV if
// configured, otherwise in-memory (resets on cold start — same pattern as
// every other optional-persistence store in this project).
import "server-only";
import { kvGet, kvSet } from "@/lib/kv-cache";
import type { MockTitleSeed } from "@/data/mock-data";

export interface AdminOverrides {
  hiddenTitles: string[]; // title names (case-insensitive) to exclude
  posterOverrides: Record<string, string>; // title name -> poster URL
  pinnedTitles: MockTitleSeed[]; // manually-added titles, same shape as mock-data.ts seeds
}

const EMPTY: AdminOverrides = { hiddenTitles: [], posterOverrides: {}, pinnedTitles: [] };
const KV_KEY = "owp:admin:overrides";
let memoryOverrides: AdminOverrides = { ...EMPTY };

export async function getOverrides(): Promise<AdminOverrides> {
  const kvData = await kvGet<AdminOverrides>(KV_KEY);
  return kvData ?? memoryOverrides;
}

export async function saveOverrides(overrides: AdminOverrides): Promise<void> {
  memoryOverrides = overrides;
  await kvSet(KV_KEY, overrides, 60 * 60 * 24 * 365);
}
