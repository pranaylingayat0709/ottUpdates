import { NextRequest, NextResponse } from "next/server";
import { getAllSubscriptionRecords, removeTitleFromSubscription } from "@/lib/push-subscriptions";
import { sendPushNotification, isPushEnabled } from "@/lib/push";
import { listTitlesForWeek, listWeeks } from "@/lib/data-source";

// Triggered daily by Vercel Cron (see vercel.json) — checks every stored
// push subscription's watched-title list against the current week's live
// catalog, and sends a real browser push notification for any match, then
// stops tracking that title for that subscription (one notification per
// title, not a repeat every day it's still "current").
export async function GET(req: NextRequest) {
  const authHeader = req.headers.get("authorization");
  if (process.env.CRON_SECRET && authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  if (!isPushEnabled()) {
    return NextResponse.json({ skipped: true, reason: "VAPID keys not configured" });
  }

  const weeks = listWeeks();
  const current = weeks.find((w) => w.isCurrent);
  if (!current) return NextResponse.json({ error: "No current week found" }, { status: 500 });

  const currentTitles = await listTitlesForWeek(current.id);
  const currentNames = new Set(currentTitles.map((t) => t.title));

  const records = await getAllSubscriptionRecords();
  let notified = 0;

  for (const record of records) {
    for (const title of record.titles) {
      if (!currentNames.has(title)) continue;
      const result = await sendPushNotification(record.subscription, {
        title: "Now streaming",
        body: `${title} is now live in this week's picks.`,
        url: "/"
      });
      if (result.ok) notified++;
      if (result.ok || result.expired) {
        await removeTitleFromSubscription(record.subscription.endpoint, title);
      }
    }
  }

  return NextResponse.json({ checkedSubscriptions: records.length, notified });
}
