"use client";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { useMyPlatformsStore } from "@/hooks/useMyPlatformsStore";
import { PLATFORM_LABELS, PLATFORM_COLORS, type Platform } from "@/lib/types";
import { Check, Tv } from "lucide-react";
import { cn } from "@/lib/utils";

const ALL_PLATFORMS = Object.keys(PLATFORM_LABELS) as Platform[];

export function MyPlatformsPicker({ open, onOpenChange }: { open: boolean; onOpenChange: (v: boolean) => void }) {
  const platforms = useMyPlatformsStore((s) => s.platforms);
  const toggle = useMyPlatformsStore((s) => s.toggle);
  const markOnboarded = useMyPlatformsStore((s) => s.markOnboarded);

  return (
    <Dialog open={open} onOpenChange={(v) => { onOpenChange(v); if (!v) markOnboarded(); }}>
      <DialogContent className="max-w-md">
        <div className="p-6">
          <h2 className="flex items-center gap-2 text-lg font-bold">
            <Tv className="h-5 w-5 text-accent" /> My Platforms
          </h2>
          <p className="mb-4 mt-1 text-xs text-muted-foreground">
            Select every OTT subscription you have — we'll default the dashboard to show what you can actually watch. You can change this anytime.
          </p>
          <div className="grid grid-cols-2 gap-2">
            {ALL_PLATFORMS.map((p) => {
              const selected = platforms.includes(p);
              return (
                <button
                  key={p}
                  onClick={() => toggle(p)}
                  className={cn(
                    "flex items-center gap-2 rounded-xl border p-3 text-left text-sm transition-all",
                    selected ? "border-accent/60 bg-accent/10" : "border-[hsl(var(--foreground)/0.1)] hover:bg-[hsl(var(--foreground)/0.04)]"
                  )}
                >
                  <span className="h-2.5 w-2.5 shrink-0 rounded-full" style={{ backgroundColor: PLATFORM_COLORS[p] }} />
                  <span className="flex-1 truncate">{PLATFORM_LABELS[p]}</span>
                  {selected && <Check className="h-4 w-4 shrink-0 text-accent" />}
                </button>
              );
            })}
          </div>
          <p className="mt-4 text-[11px] text-muted-foreground">
            {platforms.length === 0 ? "Nothing selected — you'll see everything, from every platform." : `${platforms.length} platform${platforms.length !== 1 ? "s" : ""} selected.`}
          </p>
        </div>
      </DialogContent>
    </Dialog>
  );
}
