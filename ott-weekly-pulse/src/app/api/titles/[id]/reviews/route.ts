import { NextResponse } from "next/server";
import { addReview, getTitleById, listReviews } from "@/lib/data-source";
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
  const title = getTitleById(params.id);
  if (!title) return NextResponse.json({ error: "Title not found" }, { status: 404 });

  const body = await req.json().catch(() => null);
  const parsed = ReviewSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  }

  const review = addReview(params.id, parsed.data.userName, parsed.data.rating, parsed.data.body);
  return NextResponse.json({ review }, { status: 201 });
}
