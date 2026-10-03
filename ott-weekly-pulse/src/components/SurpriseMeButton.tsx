"use client";
import { useState } from "react";
import { motion } from "framer-motion";
import { Shuffle } from "lucide-react";
import type { Title } from "@/lib/types";
import { TitleModal } from "@/components/TitleModal";
import { useTasteStore } from "@/hooks/useTasteStore";

// Picks one random title from this week's catalog and opens its detail
// modal — a quick "just decide for me" affordance for indecisive browsing.
// Mildly weighted toward the user's favorite genres (if any) so the pick
// still feels relevant rather than purely random.
export function SurpriseMeButton({ titles }: { titles: Title[] }) {
  const [pickedId, setPickedId] = useState<string | null>(null);
  const [open, setOpen] = useState(false);
  const tasteGenres = useTasteStore((s) => s.favoriteGenres);

  function pick() {
    if (titles.length === 0) return;
    const weighted = titles.flatMap((t) => {
      const matches = tasteGenres.length > 0 && t.genres.some((g) => tasteGenres.includes(g));
      return matches ? [t, t, t] : [t];
    });
    const choice = weighted[Math.floor(Math.random() * weighted.length)];
    setPickedId(choice.id);
    setOpen(true);
  }

  return (
    <>
      <motion.button
        onClick={pick}
        whileTap={{ scale: 0.94, rotate: -4 }}
        disabled={titles.length === 0}
        className="chip flex items-center gap-1.5 disabled:opacity-40"
      >
        <Shuffle className="h-3.5 w-3.5" /> Surprise Me
      </motion.button>
      {pickedId && <TitleModal titleId={pickedId} open={open} onOpenChange={setOpen} />}
    </>
  );
}
