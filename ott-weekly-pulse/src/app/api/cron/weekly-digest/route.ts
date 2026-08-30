import { NextRequest, NextResponse } from "next/server";
import { getAllSubscribers } from "@/lib/subscribers";
import { sendWeeklyDigest, isEmailEnabled } from "@/lib/email";
import { listTitlesForWeek, listWeeks } from "@/lib/data-source";

// Triggered by Vercel Cron (see vercel.json — scheduled for Friday mornings
// IST) to email the current week's top picks to newsletter subscribers.
// Protected by CRON_SECRET so this can't be triggered by anyone who finds
// the URL — Vercel automatically sends this header on scheduled runs.
export async function GET(req: NextRequest) {
  const authHeader = req.headers.get("authorization");
  if (process.env.CRON_SECRET && authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  if (!isEmailEnabled()) {
    return NextResponse.json({ skipped: true, reason: "RESEND_API_KEY not configured" });
  }

  const weeks = listWeeks();
  const current = weeks.find((w) => w.isCurrent);
  if (!current) return NextResponse.json({ error: "No current week found" }, { status: 500 });

  const titles = await listTitlesForWeek(current.id);
  const subscribers = await getAllSubscribers();
  const result = await sendWeeklyDigest(subscribers, titles, current.label);

  return NextResponse.json({ week: current.label, subscribers: subscribers.length, ...result });
}
