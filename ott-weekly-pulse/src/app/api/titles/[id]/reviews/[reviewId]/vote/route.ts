import { NextResponse } from "next/server";
import { voteReview } from "@/lib/data-source";
import { checkRateLimit, getClientIp } from "@/lib/rate-limit";
import { z } from "zod";

const BodySchema = z.object({ direction: z.enum(["up", "down"]).default("up") });

export async function POST(req: Request, { params }: { params: { id: string; reviewId: string } }) {
  const ip = getClientIp(req);
  const { allowed } = await checkRateLimit(`review-vote:${ip}`, 30, 60); // 30 votes/minute/IP — generous, this is lightweight
  if (!allowed) return NextResponse.json({ error: "Too many requests" }, { status: 429 });

  const body = await req.json().catch(() => ({}));
  const { direction } = BodySchema.parse(body);

  const review = voteReview(params.id, params.reviewId, direction);
  if (!review) return NextResponse.json({ error: "Review not found" }, { status: 404 });

  return NextResponse.json({ review });
}
