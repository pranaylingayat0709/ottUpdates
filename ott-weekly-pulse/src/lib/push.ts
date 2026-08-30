// Web Push notifications via VAPID — the open browser-native push
// standard, no third-party service (Firebase/OneSignal) required. Every
// major browser supports it directly.
//
// Setup (one-time): generate a VAPID key pair with
//   npx web-push generate-vapid-keys
// then set VAPID_PUBLIC_KEY and VAPID_PRIVATE_KEY as env vars. The public
// key is also needed client-side — it's exposed (safely; it's public by
// design) via GET /api/push/vapid-public-key rather than baked into the
// bundle, so it can be rotated without a redeploy.
import "server-only";
import webpush, { type PushSubscription } from "web-push";

let configured = false;

function ensureConfigured(): boolean {
  const publicKey = process.env.VAPID_PUBLIC_KEY;
  const privateKey = process.env.VAPID_PRIVATE_KEY;
  if (!publicKey || !privateKey) return false;
  if (!configured) {
    webpush.setVapidDetails(process.env.VAPID_SUBJECT ?? "mailto:admin@example.com", publicKey, privateKey);
    configured = true;
  }
  return true;
}

export function isPushEnabled(): boolean {
  return !!(process.env.VAPID_PUBLIC_KEY && process.env.VAPID_PRIVATE_KEY);
}

export async function sendPushNotification(
  subscription: PushSubscription,
  payload: { title: string; body: string; url?: string }
): Promise<{ ok: boolean; expired: boolean }> {
  if (!ensureConfigured()) return { ok: false, expired: false };
  try {
    await webpush.sendNotification(subscription, JSON.stringify(payload));
    return { ok: true, expired: false };
  } catch (err: unknown) {
    // 404/410 means the subscription is no longer valid (user cleared
    // site data, uninstalled, etc.) — caller should stop tracking it.
    const statusCode = (err as { statusCode?: number })?.statusCode;
    const expired = statusCode === 404 || statusCode === 410;
    return { ok: false, expired };
  }
}
