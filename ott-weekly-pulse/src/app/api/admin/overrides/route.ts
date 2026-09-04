import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { z } from "zod";
import { isValidSessionToken, getSessionCookieName } from "@/lib/admin-auth";
import { getOverrides, saveOverrides } from "@/lib/admin-overrides";

function isAuthenticated(): boolean {
  return isValidSessionToken(cookies().get(getSessionCookieName())?.value);
}

export async function GET() {
  if (!isAuthenticated()) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  return NextResponse.json(await getOverrides());
}

const OverridesSchema = z.object({
  hiddenTitles: z.array(z.string()),
  posterOverrides: z.record(z.string()),
  pinnedTitles: z.array(z.any()) // matches MockTitleSeed shape; validated loosely since it's owner-only input
});

export async function POST(req: Request) {
  if (!isAuthenticated()) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await req.json().catch(() => null);
  const parsed = OverridesSchema.safeParse(body);
  if (!parsed.success) return NextResponse.json({ error: "Invalid overrides payload" }, { status: 400 });

  await saveOverrides(parsed.data);
  return NextResponse.json({ ok: true });
}
