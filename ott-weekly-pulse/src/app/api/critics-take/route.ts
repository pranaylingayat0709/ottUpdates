import { NextResponse } from "next/server";
import { getOrGenerateCriticsTake, getTitleById } from "@/lib/data-source";
import { z } from "zod";

const BodySchema = z.object({ titleId: z.string().min(1) });

// On-demand "AI Critic's Take" — a longer editorial paragraph distinct
// from the 2-line Quick AI Verdict. Cached per title, same pattern as
// /api/verdict.
export async function POST(req: Request) {
  const body = await req.json().catch(() => null);
  const parsed = BodySchema.safeParse(body);
  if (!parsed.success) return NextResponse.json({ error: "titleId is required" }, { status: 400 });

  const title = await getTitleById(parsed.data.titleId);
  if (!title) return NextResponse.json({ error: "Title not found" }, { status: 404 });

  const take = await getOrGenerateCriticsTake(title);
  return NextResponse.json({ take });
}
