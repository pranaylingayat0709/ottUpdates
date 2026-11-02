"use client";
import { useState } from "react";
import { Share2 } from "lucide-react";

// Shares the generated "Top 5" story image: native share sheet with the
// image file where supported (mobile), otherwise downloads the PNG.
export function ShareWeekButton({ weekId }: { weekId?: string }) {
  const [busy, setBusy] = useState(false);
  async function share() {
    setBusy(true);
    try {
      const res = await fetch(`/api/share-card${weekId ? `?week=${encodeURIComponent(weekId)}` : ""}`);
      if (!res.ok) throw new Error("card failed");
      const blob = await res.blob();
      const file = new File([blob], "ott-weekly-pulse-top5.png", { type: "image/png" });
      if (navigator.canShare?.({ files: [file] })) {
        await navigator.share({ files: [file], title: "OTT Weekly Pulse — Top 5 this week", url: window.location.origin });
      } else {
        const a = document.createElement("a");
        a.href = URL.createObjectURL(blob);
        a.download = file.name;
        a.click();
        URL.revokeObjectURL(a.href);
      }
    } catch {
      /* cancelled or unsupported — nothing to do */
    } finally {
      setBusy(false);
    }
  }
  return (
    <button onClick={share} disabled={busy} className="chip" aria-label="Share this week's top 5 as an image">
      <Share2 className="h-3.5 w-3.5" /> {busy ? "Preparing…" : "Share top 5"}
    </button>
  );
}
