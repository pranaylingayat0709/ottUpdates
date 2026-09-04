import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { z } from "zod";
import { verifyPassword, getSessionCookieName, getExpectedSessionToken, isAdminConfigured } from "@/lib/admin-auth";
import { checkRateLimit, getClientIp } from "@/lib/rate-limit";

const BodySchema = z.object({ password: z.string().min(1) });

export async function POST(req: Request) {
  if (!isAdminConfigured()) return NextResponse.json({ error: "Admin panel not configured" }, { status: 503 });

  const ip = getClientIp(req);
  const { allowed } = await checkRateLimit(`admin-login:${ip}`, 5, 300); // 5 attempts/5min/IP — slows down brute force
  if (!allowed) return NextResponse.json({ error: "Too many attempts — try again later." }, { status: 429 });

  const body = await req.json().catch(() => null);
  const parsed = BodySchema.safeParse(body);
  if (!parsed.success) return NextResponse.json({ error: "Password required" }, { status: 400 });

  if (!verifyPassword(parsed.data.password)) {
    return NextResponse.json({ error: "Incorrect password" }, { status: 401 });
  }

  const token = getExpectedSessionToken();
  cookies().set(getSessionCookieName(), token!, {
    httpOnly: true,
    secure: true,
    sameSite: "lax",
    maxAge: 60 * 60 * 24 * 7, // 7 days
    path: "/"
  });

  return NextResponse.json({ ok: true });
}
