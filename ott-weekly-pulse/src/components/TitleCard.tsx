"use client";
import Image from "next/image";
import { useState } from "react";
import { motion } from "framer-motion";
import { Bookmark, Star } from "lucide-react";
import type { Title } from "@/lib/types";
import { PLATFORM_LABELS } from "@/lib/types";
import { cn, formatRuntime } from "@/lib/utils";
import { EditorialBadgePill } from "@/components/EditorialBadgePill";
import { useWatchlistStore } from "@/hooks/useWatchlistStore";
import { TitleModal } from "@/components/TitleModal";

export function TitleCard({ title, className }: { title: Title; className?: string }) {
  const [open, setOpen] = useState(false);
  const saved = useWatchlistStore((s) => s.isSaved(title.id));
  const toggle = useWatchlistStore((s) => s.toggle);

  return (
    <>
      <motion.div
        className={cn("group glass-card cursor-pointer overflow-hidden", className)}
        onClick={() => setOpen(true)}
        whileHover={{ y: -6, scale: 1.02 }}
        whileTap={{ scale: 0.98 }}
        transition={{ type: "spring", stiffness: 350, damping: 22 }}
      >
        <div className="relative aspect-[2/3] w-full overflow-hidden">
          <Image
            src={title.posterUrl}
            alt={title.title}
            fill
            sizes="(max-width: 640px) 45vw, (max-width: 1024px) 25vw, 200px"
            className="object-cover transition-transform duration-500 group-hover:scale-105"
          />
          <div className="absolute inset-x-0 bottom-0 h-2/3 bg-gradient-to-t from-black/90 via-black/40 to-transparent" />

          <button
            onClick={(e) => {
              e.stopPropagation();
              toggle(title.id);
            }}
            className={cn(
              "absolute right-2 top-2 z-10 rounded-full p-1.5 backdrop-blur-md transition-colors",
              saved ? "bg-accent text-white" : "bg-black/40 text-white/80 hover:bg-black/60"
            )}
            aria-label="Toggle watchlist"
          >
            <Bookmark className={cn("h-3.5 w-3.5", saved && "fill-current")} />
          </button>

          {title.editorialBadges[0] && (
            <div className="absolute left-2 top-2 z-10">
              <EditorialBadgePill badge={title.editorialBadges[0]} />
            </div>
          )}

          <div className="absolute inset-x-0 bottom-0 space-y-1 p-3">
            <p className="line-clamp-1 text-sm font-bold text-white">{title.title}</p>
            <div className="flex flex-wrap items-center gap-1.5 text-[10px] text-white/70">
              <span>{title.type === "MOVIE" ? formatRuntime(title.runtimeMinutes) : `${title.totalEpisodes} eps`}</span>
              <span>·</span>
              <span>{PLATFORM_LABELS[title.platforms[0]]}</span>
              {title.imdbRating && (
                <>
                  <span>·</span>
                  <span className="flex items-center gap-0.5">
                    <Star className="h-2.5 w-2.5 fill-yellow-400 text-yellow-400" /> {title.imdbRating}
                  </span>
                </>
              )}
            </div>
          </div>
        </div>
      </motion.div>
      <TitleModal titleId={title.id} open={open} onOpenChange={setOpen} />
    </>
  );
}

