import { NextResponse } from "next/server";
import { getOrGenerateVerdict, getTitleById } from "@/lib/data-source";
import { z } from "zod";

const BodySchema = z.object({ titleId: z.string().min(1) });

// On-demand "Quick AI Verdict" generation via NVIDIA NIM, cached in-memory
// per title so repeat modal opens don't re-hit the API.
export async function POST(req: Request) {
  const body = await req.json().catch(() => null);
  const parsed = BodySchema.safeParse(body);
  if (!parsed.success) return NextResponse.json({ error: "titleId is required" }, { status: 400 });

  const title = getTitleById(parsed.data.titleId);
  if (!title) return NextResponse.json({ error: "Title not found" }, { status: 404 });

  const verdict = await getOrGenerateVerdict(title);
  return NextResponse.json({ verdict });
}
