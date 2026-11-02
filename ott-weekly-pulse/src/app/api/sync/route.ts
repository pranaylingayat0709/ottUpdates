import { NextRequest, NextResponse } from "next/server";
import { randomBytes } from "crypto";
import { isKvEnabled, kvGet, kvSet } from "@/lib/kv-cache";
import { checkRateLimit } from "@/lib/rate-limit";

// "Sync code" cross-device transfer. Not accounts: a snapshot of the
// person's local lists is stored under a random 8-character code, and any
// device that enters the code can read it back. Requires Vercel KV; without
// it every call returns 503 and the UI explains that sync isn't enabled.
const ALPHABET = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789"; // no 0/O/1/I
const TTL = 180 * 24 * 3600;
const MAX_BYTES = 200_000;

function newCode() {
  const bytes = randomBytes(8);
  return Array.from(bytes, (b) => ALPHABET[b % ALPHABET.length]).join("");
}
const valid = (c: string) => new RegExp(`^[${ALPHABET}]{8}$`).test(c);

function ip(req: NextRequest) {
  return req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ?? "anon";
}

export async function POST(req: NextRequest) {
  if (!isKvEnabled()) return NextResponse.json({ error: "not_configured" }, { status: 503 });
  const rl = await checkRateLimit(`sync-write:${ip(req)}`, 20, 3600);
  if (!rl.allowed) return NextResponse.json({ error: "rate_limited" }, { status: 429 });

  const raw = await req.text();
  if (raw.length > MAX_BYTES) return NextResponse.json({ error: "too_large" }, { status: 413 });
  let body: { code?: string; data?: Record<string, string> };
  try {
    body = JSON.parse(raw);
  } catch {
    return NextResponse.json({ error: "bad_json" }, { status: 400 });
  }
  if (!body.data || typeof body.data !== "object") return NextResponse.json({ error: "no_data" }, { status: 400 });

  // Only string values under owp- keys are accepted.
  const clean: Record<string, string> = {};
  for (const [k, v] of Object.entries(body.data)) if (k.startsWith("owp-") && typeof v === "string") clean[k] = v;

  const code = body.code && valid(body.code) ? body.code : newCode();
  await kvSet(`owp:sync:${code}`, { data: clean, savedAt: new Date().toISOString() }, TTL);
  return NextResponse.json({ code });
}

export async function GET(req: NextRequest) {
  if (!isKvEnabled()) return NextResponse.json({ error: "not_configured" }, { status: 503 });
  const rl = await checkRateLimit(`sync-read:${ip(req)}`, 30, 3600); // slows code guessing
  if (!rl.allowed) return NextResponse.json({ error: "rate_limited" }, { status: 429 });
  const code = (req.nextUrl.searchParams.get("code") ?? "").toUpperCase().replace(/[^A-Z0-9]/g, "");
  if (!valid(code)) return NextResponse.json({ error: "bad_code" }, { status: 400 });
  const rec = await kvGet<{ data: Record<string, string>; savedAt: string }>(`owp:sync:${code}`);
  if (!rec) return NextResponse.json({ error: "not_found" }, { status: 404 });
  return NextResponse.json(rec);
}
