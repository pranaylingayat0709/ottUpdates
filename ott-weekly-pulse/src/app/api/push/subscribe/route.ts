import { NextResponse } from "next/server";
import { z } from "zod";
import { addTitleToSubscription } from "@/lib/push-subscriptions";
import { checkRateLimit, getClientIp } from "@/lib/rate-limit";

const BodySchema = z.object({
  subscription: z.object({
    endpoint: z.string().url(),
    keys: z.object({ p256dh: z.string(), auth: z.string() })
  }),
  title: z.string().min(1)
});

export async function POST(req: Request) {
  const ip = getClientIp(req);
  const { allowed } = await checkRateLimit(`push-subscribe:${ip}`, 20, 60);
  if (!allowed) return NextResponse.json({ error: "Too many requests" }, { status: 429 });

  const body = await req.json().catch(() => null);
  const parsed = BodySchema.safeParse(body);
  if (!parsed.success) return NextResponse.json({ error: "Invalid subscription payload" }, { status: 400 });

  await addTitleToSubscription(parsed.data.subscription, parsed.data.title);
  return NextResponse.json({ ok: true });
}
