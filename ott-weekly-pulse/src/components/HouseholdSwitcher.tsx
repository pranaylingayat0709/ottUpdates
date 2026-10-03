"use client";
import { useState } from "react";
import { Plus, Check } from "lucide-react";
import { useHouseholdStore } from "@/hooks/useHouseholdStore";
import { cn } from "@/lib/utils";

// Compact dropdown in the header — switching profiles reloads the page
// (see useHouseholdStore.switchProfile) since each profile's watchlist/
// taste/etc. live in separately-keyed localStorage, read once at store
// module init. Full profile management (rename, add, delete) lives on
// /profile; this is just the quick switcher.
export function HouseholdSwitcher() {
  const [open, setOpen] = useState(false);
  const profiles = useHouseholdStore((s) => s.profiles);
  const activeProfileId = useHouseholdStore((s) => s.activeProfileId);
  const switchProfile = useHouseholdStore((s) => s.switchProfile);

  if (profiles.length <= 1) return null; // nothing to switch between yet

  const active = profiles.find((p) => p.id === activeProfileId) ?? profiles[0];

  return (
    <div className="relative">
      <button onClick={() => setOpen((v) => !v)} className="chip hidden items-center gap-1.5 sm:inline-flex" aria-label="Switch profile">
        <span>{active.emoji}</span> {active.name}
      </button>
      {open && (
        <>
          <div className="fixed inset-0 z-40" onClick={() => setOpen(false)} />
          <div className="glass-panel absolute right-0 top-full z-50 mt-2 w-48 space-y-1 rounded-xl p-2">
            {profiles.map((p) => (
              <button
                key={p.id}
                onClick={() => { if (p.id !== activeProfileId) switchProfile(p.id); setOpen(false); }}
                className={cn(
                  "flex w-full items-center justify-between gap-2 rounded-lg px-2 py-1.5 text-left text-xs hover:bg-[hsl(var(--foreground)/0.06)]",
                  p.id === activeProfileId && "text-accent"
                )}
              >
                <span className="flex items-center gap-1.5">{p.emoji} {p.name}</span>
                {p.id === activeProfileId && <Check className="h-3.5 w-3.5" />}
              </button>
            ))}
            <a href="/profile" className="mt-1 flex items-center gap-1.5 rounded-lg px-2 py-1.5 text-left text-xs text-muted-foreground hover:bg-[hsl(var(--foreground)/0.06)] hover:text-accent">
              <Plus className="h-3.5 w-3.5" /> Manage profiles
            </a>
          </div>
        </>
      )}
    </div>
  );
}
