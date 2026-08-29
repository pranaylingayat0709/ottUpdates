import { NextRequest, NextResponse } from "next/server";
import { getTitleById } from "@/lib/data-source";

// Resolves a batch of title ids to full Title objects, regardless of which
// week they belong to — used by the Watchlist drawer.
export async function GET(req: NextRequest) {
  const ids = req.nextUrl.searchParams.get("ids")?.split(",").filter(Boolean) ?? [];
  const resolved = await Promise.all(ids.map(getTitleById));
  const titles = resolved.filter((t): t is NonNullable<typeof t> => !!t);
  return NextResponse.json({ titles });
}
