"use client";
import { PosterImage } from "@/components/PosterImage";
import Link from "next/link";
import { motion } from "framer-motion";
import { History } from "lucide-react";
import { useRecentlyViewedStore } from "@/hooks/useRecentlyViewedStore";

// "Continue Watching" scoped honestly: this app links out to external
// platforms for actual playback rather than hosting video itself, so
// there's no real resume-position to track. This instead surfaces your
// recently-viewed titles as a quick-access row — the same spirit (pick up
// where you left off browsing) without pretending to track literal
// playback progress this app doesn't have.
export function ContinueWatching() {
  const items = useRecentlyViewedStore((s) => s.items);
  if (items.length === 0) return null;

  return (
    <motion.section
      className="mb-12"
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4 }}
    >
      <h2 className="mb-4 flex items-center gap-2 font-display text-xl font-bold tracking-tight sm:text-2xl">
        <History className="h-5 w-5 text-accent" /> Continue Browsing
      </h2>
      <div className="flex gap-3 overflow-x-auto scrollbar-thin pb-2">
        {items.map((item) => (
          <Link
            key={item.id}
            href={`/title/${item.id}`}
            className="group glass-card w-28 shrink-0 overflow-hidden transition-transform hover:-translate-y-1 sm:w-32"
          >
            <div className="relative aspect-[2/3] w-full">
              <PosterImage src={item.posterUrl} alt={item.title} fill sizes="130px" className="object-cover" />
              <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/90 to-transparent p-2">
                <p className="line-clamp-2 text-[11px] font-semibold text-white">{item.title}</p>
              </div>
            </div>
          </Link>
        ))}
      </div>
    </motion.section>
  );
}
