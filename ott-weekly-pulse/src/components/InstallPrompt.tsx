"use client";
import { useEffect, useState } from "react";
import { Download, Share, X } from "lucide-react";

interface BIPEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed" }>;
}

// "Install app" banner. Chromium browsers fire beforeinstallprompt; iOS
// Safari has no such event, so there it shows the Share → Add to Home Screen
// hint. Appears from the 3rd visit, can be dismissed for 30 days, and never
// shows inside an already-installed app.
export function InstallPrompt() {
  const [evt, setEvt] = useState<BIPEvent | null>(null);
  const [iosHint, setIosHint] = useState(false);
  const [hidden, setHidden] = useState(true);

  useEffect(() => {
    try {
      const standalone = window.matchMedia("(display-mode: standalone)").matches || (navigator as Navigator & { standalone?: boolean }).standalone;
      if (standalone) return;
      const dismissedAt = Number(localStorage.getItem("owp-install-dismissed") ?? 0);
      if (Date.now() - dismissedAt < 30 * 24 * 3600 * 1000) return;
      const visits = Number(localStorage.getItem("owp-visits") ?? 0) + 1;
      localStorage.setItem("owp-visits", String(visits));
      if (visits < 3) return;

      const isIos = /iphone|ipad|ipod/i.test(navigator.userAgent) && !/crios|fxios/i.test(navigator.userAgent);
      if (isIos) {
        setIosHint(true);
        setHidden(false);
      }
      const onBip = (e: Event) => {
        e.preventDefault();
        setEvt(e as BIPEvent);
        setHidden(false);
      };
      window.addEventListener("beforeinstallprompt", onBip);
      return () => window.removeEventListener("beforeinstallprompt", onBip);
    } catch {
      /* storage blocked: skip the prompt */
    }
  }, []);

  function dismiss() {
    setHidden(true);
    try {
      localStorage.setItem("owp-install-dismissed", String(Date.now()));
    } catch {
      /* ignore */
    }
  }

  if (hidden || (!evt && !iosHint)) return null;
  return (
    <div className="fixed inset-x-3 z-40 flex items-center gap-3 rounded-2xl border bg-card p-3 shadow-2xl sm:left-auto sm:right-4 sm:max-w-sm" style={{ bottom: "calc(4.5rem + env(safe-area-inset-bottom))", borderColor: "hsl(var(--foreground) / 0.12)" }} role="dialog" aria-label="Install app">
      <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-primary to-accent text-white"><Download className="h-5 w-5" /></span>
      <p className="min-w-0 flex-1 text-xs">
        <strong className="block text-sm">Install OTT Pulse</strong>
        {iosHint ? <span className="text-muted-foreground">Tap <Share className="inline h-3 w-3" /> then “Add to Home Screen”.</span> : <span className="text-muted-foreground">Faster launch, works offline.</span>}
      </p>
      {evt && (
        <button
          onClick={async () => {
            await evt.prompt();
            await evt.userChoice.catch(() => null);
            dismiss();
          }}
          className="chip chip-active"
        >
          Install
        </button>
      )}
      <button onClick={dismiss} aria-label="Dismiss install prompt" className="text-muted-foreground hover:text-foreground"><X className="h-4 w-4" /></button>
    </div>
  );
}
