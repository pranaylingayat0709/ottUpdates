import { NextResponse } from "next/server";
import { listWeeks } from "@/lib/data-source";

// Pure date math, no KV/live-API/Node-specific dependencies — safe to run
// on Vercel's Edge Runtime for faster cold starts globally, and cacheable
// since the week list only changes once real time crosses a Friday.
export const runtime = "edge";

export async function GET() {
  return NextResponse.json(
    { weeks: listWeeks() },
    { headers: { "Cache-Control": "public, s-maxage=3600, stale-while-revalidate=86400" } }
  );
}
