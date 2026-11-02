import { NextRequest, NextResponse } from "next/server";
import { checkRateLimit } from "@/lib/rate-limit";

// Receives browser-side errors (see ClientErrorReporter) and writes them to
// the server log, so they show up in Vercel's function logs next to the
// server errors. Truncated and rate-limited; stores nothing.
export async function POST(req: NextRequest) {
  const ip = req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ?? "anon";
  const rl = await checkRateLimit(`client-error:${ip}`, 20, 600);
  if (!rl.allowed) return new NextResponse(null, { status: 204 });
  try {
    const raw = (await req.text()).slice(0, 2000);
    const b = JSON.parse(raw) as { message?: string; stack?: string; url?: string };
    console.error(`[client-error] ${String(b.message ?? "").slice(0, 300)} @ ${String(b.url ?? "").slice(0, 200)}\n${String(b.stack ?? "").slice(0, 800)}`);
  } catch {
    /* ignore malformed reports */
  }
  return new NextResponse(null, { status: 204 });
}
