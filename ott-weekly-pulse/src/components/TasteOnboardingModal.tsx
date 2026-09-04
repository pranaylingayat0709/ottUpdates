"use client";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { useTasteStore } from "@/hooks/useTasteStore";
import { GENRE_LABELS, type Genre } from "@/lib/types";
import { Check, Heart } from "lucide-react";
import { cn } from "@/lib/utils";

const ALL_GENRES = Object.keys(GENRE_LABELS) as Genre[];

export function TasteOnboardingModal({ open, onOpenChange }: { open: boolean; onOpenChange: (v: boolean) => void }) {
  const favoriteGenres = useTasteStore((s) => s.favoriteGenres);
  const toggle = useTasteStore((s) => s.toggle);
  const markOnboarded = useTasteStore((s) => s.markOnboarded);

  return (
    <Dialog open={open} onOpenChange={(v) => { onOpenChange(v); if (!v) markOnboarded(); }}>
      <DialogContent className="max-w-md">
        <div className="p-6">
          <h2 className="flex items-center gap-2 text-lg font-bold">
            <Heart className="h-5 w-5 text-accent" /> What do you like watching?
          </h2>
          <p className="mb-4 mt-1 text-xs text-muted-foreground">
            Pick a few genres — we'll use this to sharpen recommendations before you've even saved anything. Optional, skippable.
          </p>
          <div className="flex flex-wrap gap-2">
            {ALL_GENRES.map((g) => {
              const selected = favoriteGenres.includes(g);
              return (
                <button
                  key={g}
                  onClick={() => toggle(g)}
                  className={cn("chip", selected && "chip-active")}
                >
                  {selected && <Check className="h-3 w-3" />}
                  {GENRE_LABELS[g]}
                </button>
              );
            })}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
