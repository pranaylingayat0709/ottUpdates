"use client";
import { useEffect, useState } from "react";
import { WifiOff } from "lucide-react";

// Small notice when the device is offline: the app keeps showing the last
// catalog it cached (see public/sw.js), so say so instead of looking broken.
export function OfflineBanner() {
  const [offline, setOffline] = useState(false);
  useEffect(() => {
    const sync = () => setOffline(!navigator.onLine);
    sync();
    window.addEventListener("online", sync);
    window.addEventListener("offline", sync);
    return () => {
      window.removeEventListener("online", sync);
      window.removeEventListener("offline", sync);
    };
  }, []);
  if (!offline) return null;
  return (
    <div role="status" className="fixed inset-x-0 top-0 z-[70] flex items-center justify-center gap-2 bg-amber-500 px-3 py-1.5 text-xs font-medium text-black">
      <WifiOff className="h-3.5 w-3.5" /> You&apos;re offline — showing the last saved picks.
    </div>
  );
}
