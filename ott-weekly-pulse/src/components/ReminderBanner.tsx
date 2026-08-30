"use client";
import { useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { BellRing, X } from "lucide-react";
import { useReminderStore } from "@/hooks/useReminderStore";
import type { Title } from "@/lib/types";

// Shows a dismissible banner when a title the user hit "Notify Me" on
// (while it was in an upcoming week) has now appeared in the current
// week's catalog. Local-only — see useReminderStore for scope/limits.
export function ReminderBanner({ currentWeekTitles }: { currentWeekTitles: Title[] }) {
  const items = useReminderStore((s) => s.items);
  const dismissedTitles = useReminderStore((s) => s.dismissedTitles);
  const dismiss = useReminderStore((s) => s.dismiss);

  const nowLive = useMemo(() => {
    const currentNames = new Set(currentWeekTitles.map((t) => t.title));
    return items.filter((i) => currentNames.has(i.title) && !dismissedTitles.includes(i.title));
  }, [items, currentWeekTitles, dismissedTitles]);

  return (
    <AnimatePresence>
      {nowLive.length > 0 && (
        <motion.div
          initial={{ opacity: 0, height: 0 }}
          animate={{ opacity: 1, height: "auto" }}
          exit={{ opacity: 0, height: 0 }}
          className="mb-6 overflow-hidden"
        >
          <div className="glass-panel flex items-center gap-3 border-accent/30 bg-accent/5 p-3">
            <BellRing className="h-4 w-4 shrink-0 text-accent" />
            <p className="flex-1 text-sm">
              {nowLive.map((i) => i.title).join(", ")} — {nowLive.length > 1 ? "titles you were" : "a title you were"} waiting for {nowLive.length > 1 ? "are" : "is"} now live!
            </p>
            {nowLive.map((i) => (
              <button
                key={i.id}
                onClick={() => dismiss(i.title)}
                className="rounded-full p-1 text-muted-foreground hover:bg-[hsl(var(--foreground)/0.08)]"
                aria-label="Dismiss"
              >
                <X className="h-3.5 w-3.5" />
              </button>
            ))}
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
