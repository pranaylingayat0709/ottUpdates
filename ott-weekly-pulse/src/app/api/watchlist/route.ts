import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { checkRateLimit, getClientIp } from "@/lib/rate-limit";

// Demo-only in-memory watchlist keyed by anonymous userToken (see
// src/lib/utils.ts:getOrCreateUserToken). Swap for a WatchlistItem Prisma
// table (already defined in prisma/schema.prisma) for real persistence.
const WATCHLISTS = new Map<string, Set<string>>();

const BodySchema = z.object({ userToken: z.string().min(1), titleId: z.string().min(1) });

export async function GET(req: NextRequest) {
  const userToken = req.nextUrl.searchParams.get("userToken");
  if (!userToken) return NextResponse.json({ error: "userToken is required" }, { status: 400 });
  const set = WATCHLISTS.get(userToken) ?? new Set<string>();
  return NextResponse.json({ titleIds: Array.from(set) });
}

export async function POST(req: NextRequest) {
  const ip = getClientIp(req);
  const { allowed } = await checkRateLimit(`watchlist:${ip}`, 60, 60); // 60 toggles/minute/IP — generous, this is legitimate frequent use
  if (!allowed) return NextResponse.json({ error: "Too many requests" }, { status: 429 });

  const body = await req.json().catch(() => null);
  const parsed = BodySchema.safeParse(body);
  if (!parsed.success) return NextResponse.json({ error: "userToken and titleId are required" }, { status: 400 });

  const { userToken, titleId } = parsed.data;
  const set = WATCHLISTS.get(userToken) ?? new Set<string>();
  const wasPresent = set.has(titleId);
  wasPresent ? set.delete(titleId) : set.add(titleId);
  WATCHLISTS.set(userToken, set);

  return NextResponse.json({ titleIds: Array.from(set), added: !wasPresent });
}
