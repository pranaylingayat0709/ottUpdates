import { NextResponse } from "next/server";
import { addReview, getTitleById, listReviews } from "@/lib/data-source";
import { checkRateLimit, getClientIp, looksLikeSpam } from "@/lib/rate-limit";
import { z } from "zod";

const ReviewSchema = z.object({
  userName: z.string().min(1).max(60),
  rating: z.number().min(0).max(10),
  body: z.string().min(3).max(1000)
});

export async function GET(_req: Request, { params }: { params: { id: string } }) {
  return NextResponse.json({ reviews: listReviews(params.id) });
}

export async function POST(req: Request, { params }: { params: { id: string } }) {
  const ip = getClientIp(req);
  const { allowed } = await checkRateLimit(`reviews:${ip}`, 5, 60); // 5 reviews/minute/IP
  if (!allowed) return NextResponse.json({ error: "Too many requests — please slow down." }, { status: 429 });

  const title = await getTitleById(params.id);
  if (!title) return NextResponse.json({ error: "Title not found" }, { status: 404 });

  const body = await req.json().catch(() => null);
  const parsed = ReviewSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  }

  if (looksLikeSpam(parsed.data.body) || looksLikeSpam(parsed.data.userName)) {
    return NextResponse.json({ error: "Review couldn't be posted." }, { status: 400 });
  }

  const review = await addReview(params.id, title.title, parsed.data.userName, parsed.data.rating, parsed.data.body);
  return NextResponse.json({ review }, { status: 201 });
}
