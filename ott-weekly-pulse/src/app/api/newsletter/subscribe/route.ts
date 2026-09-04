import { NextResponse } from "next/server";
import { z } from "zod";
import { addSubscriber } from "@/lib/subscribers";
import { checkRateLimit, getClientIp } from "@/lib/rate-limit";

const BodySchema = z.object({ email: z.string().email() });

export async function POST(req: Request) {
  const ip = getClientIp(req);
  const { allowed } = await checkRateLimit(`newsletter:${ip}`, 5, 300); // 5 signups/5min/IP
  if (!allowed) return NextResponse.json({ error: "Too many requests — please try again shortly." }, { status: 429 });

  const body = await req.json().catch(() => null);
  const parsed = BodySchema.safeParse(body);
  if (!parsed.success) return NextResponse.json({ error: "Valid email required" }, { status: 400 });

  await addSubscriber(parsed.data.email.toLowerCase().trim());
  return NextResponse.json({ subscribed: true });
}
