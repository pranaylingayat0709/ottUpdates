// Optional persistent cache for the live catalog via Vercel KV (Redis).
// Activates automatically if KV_REST_API_URL / KV_REST_API_TOKEN are set
// (Vercel injects these when you attach a KV store to your project) —
// otherwise every function here is a silent no-op and data-source.ts falls
// back to its existing in-memory Map cache. This means the app works
// identically with or without KV configured; KV just makes the cache
// survive across serverless cold starts / multiple instances instead of
// resetting per-instance.
import "server-only";

export function isKvEnabled(): boolean {
  return !!(process.env.KV_REST_API_URL && process.env.KV_REST_API_TOKEN);
}

type KvClient = { get: (key: string) => Promise<unknown>; set: (key: string, value: unknown, opts?: { ex?: number }) => Promise<unknown> };

let cachedClient: KvClient | null = null;
let attempted = false;

async function getClient(): Promise<KvClient | null> {
  if (!isKvEnabled()) return null;
  if (attempted) return cachedClient;
  attempted = true;
  try {
    const mod = await import("@vercel/kv");
    cachedClient = mod.kv as unknown as KvClient;
  } catch {
    cachedClient = null;
  }
  return cachedClient;
}

export async function kvGet<T>(key: string): Promise<T | null> {
  const client = await getClient();
  if (!client) return null;
  try {
    const value = await client.get(key);
    return (value as T) ?? null;
  } catch {
    return null;
  }
}

export async function kvSet(key: string, value: unknown, ttlSeconds: number): Promise<void> {
  const client = await getClient();
  if (!client) return;
  try {
    await client.set(key, value, { ex: ttlSeconds });
  } catch {
    // Best-effort — in-memory cache in data-source.ts covers this request either way.
  }
}
