"use client";

function urlBase64ToUint8Array(base64String: string): BufferSource {
  const padding = "=".repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding).replace(/-/g, "+").replace(/_/g, "/");
  const rawData = window.atob(base64);
  const array = Uint8Array.from([...rawData].map((c) => c.charCodeAt(0)));
  return array.buffer as ArrayBuffer;
}

/**
 * Requests notification permission (if needed), subscribes this browser
 * to push via the service worker, and registers the subscription against
 * the given title on the server. Returns true on success. Silently
 * returns false if push isn't supported, isn't configured server-side
 * (no VAPID keys), or permission is denied — callers should treat this as
 * "the in-app reminder still works, just not the real push notification."
 */
export async function subscribeForTitle(title: string): Promise<boolean> {
  if (!("serviceWorker" in navigator) || !("PushManager" in window)) return false;

  try {
    const keyRes = await fetch("/api/push/vapid-public-key");
    const keyData = await keyRes.json();
    if (!keyData.enabled) return false;

    const permission = await Notification.requestPermission();
    if (permission !== "granted") return false;

    const registration = await navigator.serviceWorker.ready;
    let subscription = await registration.pushManager.getSubscription();
    if (!subscription) {
      subscription = await registration.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: urlBase64ToUint8Array(keyData.publicKey)
      });
    }

    await fetch("/api/push/subscribe", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ subscription: subscription.toJSON(), title })
    });
    return true;
  } catch {
    return false;
  }
}
