import { NextResponse } from "next/server";
import { fetchLeavingSoon } from "@/lib/watchmode";

// One Watchmode credit per cache window. The list changes slowly, so a day
// of CDN caching keeps this to roughly 30 calls a month.
export const revalidate = 86400;

export async function GET() {
  const items = await fetchLeavingSoon().catch(() => []);
  return NextResponse.json(
    { items },
    { headers: { "Cache-Control": "public, s-maxage=86400, stale-while-revalidate=172800" } }
  );
}
