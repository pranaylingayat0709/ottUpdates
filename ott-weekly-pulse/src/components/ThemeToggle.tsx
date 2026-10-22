"use client";
import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Check, Monitor, Moon, Sun } from "lucide-react";
import { useTheme, type ThemePreference } from "@/components/ThemeProvider";
import { cn } from "@/lib/utils";

const OPTIONS: { value: ThemePreference; label: string; icon: typeof Sun }[] = [
  { value: "light", label: "Light", icon: Sun },
  { value: "dark", label: "Dark", icon: Moon },
  { value: "system", label: "System", icon: Monitor }
];

// Three-way picker (Light / Dark / System) in a small popover, replacing the
// old two-state flip. The button itself shows the icon for the CURRENT
// PREFERENCE (a monitor when following the OS), so it's clear at a glance
// whether the theme is fixed or automatic.
export function ThemeToggle() {
  const { preference, setPreference } = useTheme();
  const [open, setOpen] = useState(false);
  const Current = OPTIONS.find((o) => o.value === preference)?.icon ?? Monitor;

  useEffect(() => {
    if (!open) return;
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") setOpen(false);
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open]);

  return (
    <div className="relative">
      <button
        onClick={() => setOpen((v) => !v)}
        aria-label={`Theme: ${preference}. Change theme`}
        aria-haspopup="menu"
        aria-expanded={open}
        className="relative flex h-9 w-9 items-center justify-center overflow-hidden rounded-full border transition-colors hover:bg-foreground/5"
        style={{ borderColor: "hsl(var(--foreground) / 0.1)" }}
      >
        <AnimatePresence mode="wait" initial={false}>
          <motion.span
            key={preference}
            initial={{ rotate: -90, opacity: 0, scale: 0.5 }}
            animate={{ rotate: 0, opacity: 1, scale: 1 }}
            exit={{ rotate: 90, opacity: 0, scale: 0.5 }}
            transition={{ duration: 0.25, ease: "easeOut" }}
            className="flex items-center justify-center"
          >
            <Current className={cn("h-4 w-4", preference === "light" && "text-amber-500")} />
          </motion.span>
        </AnimatePresence>
      </button>

      <AnimatePresence>
        {open && (
          <>
            <div className="fixed inset-0 z-40" onClick={() => setOpen(false)} aria-hidden="true" />
            <motion.div
              role="menu"
              initial={{ opacity: 0, y: -6, scale: 0.97 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: -6, scale: 0.97 }}
              transition={{ type: "spring", stiffness: 420, damping: 30 }}
              className="glass-panel absolute right-0 top-full z-50 mt-2 w-40 space-y-0.5 rounded-xl p-1.5 shadow-xl"
            >
              {OPTIONS.map(({ value, label, icon: Icon }) => (
                <button
                  key={value}
                  role="menuitemradio"
                  aria-checked={preference === value}
                  onClick={() => {
                    setPreference(value);
                    setOpen(false);
                  }}
                  className={cn(
                    "flex w-full items-center justify-between gap-2 rounded-lg px-2.5 py-2 text-left text-xs hover:bg-[hsl(var(--foreground)/0.06)]",
                    preference === value && "text-accent"
                  )}
                >
                  <span className="flex items-center gap-2">
                    <Icon className="h-3.5 w-3.5" /> {label}
                  </span>
                  {preference === value && <Check className="h-3.5 w-3.5" />}
                </button>
              ))}
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
}
