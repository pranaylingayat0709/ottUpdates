import { NextResponse } from "next/server";
import { voteReviewHelpful } from "@/lib/data-source";
import { checkRateLimit, getClientIp } from "@/lib/rate-limit";

export async function POST(req: Request, { params }: { params: { id: string; reviewId: string } }) {
  const ip = getClientIp(req);
  const { allowed } = await checkRateLimit(`review-vote:${ip}`, 30, 60); // 30 votes/minute/IP — generous, this is lightweight
  if (!allowed) return NextResponse.json({ error: "Too many requests" }, { status: 429 });

  const review = voteReviewHelpful(params.id, params.reviewId);
  if (!review) return NextResponse.json({ error: "Review not found" }, { status: 404 });

  return NextResponse.json({ review });
}
