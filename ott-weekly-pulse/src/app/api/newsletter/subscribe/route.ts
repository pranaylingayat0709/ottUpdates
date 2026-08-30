import { NextResponse } from "next/server";
import { z } from "zod";
import { addSubscriber } from "@/lib/subscribers";

const BodySchema = z.object({ email: z.string().email() });

export async function POST(req: Request) {
  const body = await req.json().catch(() => null);
  const parsed = BodySchema.safeParse(body);
  if (!parsed.success) return NextResponse.json({ error: "Valid email required" }, { status: 400 });

  await addSubscriber(parsed.data.email.toLowerCase().trim());
  return NextResponse.json({ subscribed: true });
}
