// Simple fixed-window rate limiter for public POST endpoints (reviews,
// newsletter signup, push subscribe, watchlist). Uses Vercel KV if
// configured for cross-instance consistency, otherwise in-memory (which
// only rate-limits per serverless instance — better than nothing, same
// honest limitation as the other optional-KV stores in this project).
import "server-only";
import { kvGet, kvSet } from "@/lib/kv-cache";

const MEMORY_COUNTS = new Map<string, { count: number; resetAt: number }>();

export interface RateLimitResult {
  allowed: boolean;
  remaining: number;
}

export async function checkRateLimit(key: string, limit: number, windowSeconds: number): Promise<RateLimitResult> {
  const now = Date.now();
  const kvKey = `owp:ratelimit:${key}`;

  const kvEntry = await kvGet<{ count: number; resetAt: number }>(kvKey);
  const memEntry = MEMORY_COUNTS.get(key);
  const entry = kvEntry ?? memEntry;

  if (!entry || entry.resetAt < now) {
    const fresh = { count: 1, resetAt: now + windowSeconds * 1000 };
    MEMORY_COUNTS.set(key, fresh);
    await kvSet(kvKey, fresh, windowSeconds);
    return { allowed: true, remaining: limit - 1 };
  }

  if (entry.count >= limit) {
    return { allowed: false, remaining: 0 };
  }

  const updated = { count: entry.count + 1, resetAt: entry.resetAt };
  MEMORY_COUNTS.set(key, updated);
  await kvSet(kvKey, updated, Math.ceil((entry.resetAt - now) / 1000));
  return { allowed: true, remaining: limit - updated.count };
}

/** Best-effort client identifier from request headers — not foolproof (no
 * proxy/VPN detection), but sufficient to slow down casual abuse. */
export function getClientIp(req: Request): string {
  const forwarded = req.headers.get("x-forwarded-for");
  if (forwarded) return forwarded.split(",")[0].trim();
  return req.headers.get("x-real-ip") ?? "unknown";
}

// Minimal spam/profanity guard for free-text user input (reviews). Not a
// comprehensive moderation system — a basic first line of defense.
const BLOCKED_PATTERNS = [/\bviagra\b/i, /\bfree\s*money\b/i, /https?:\/\/\S+\.(xyz|top|click)\b/i];

export function looksLikeSpam(text: string): boolean {
  return BLOCKED_PATTERNS.some((pattern) => pattern.test(text));
}
