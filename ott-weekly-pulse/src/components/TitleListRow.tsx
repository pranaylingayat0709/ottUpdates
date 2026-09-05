"use client";
import { useState } from "react";
import { motion } from "framer-motion";
import { Bookmark, Star } from "lucide-react";
import type { Title } from "@/lib/types";
import { PLATFORM_LABELS, GENRE_LABELS } from "@/lib/types";
import { cn, formatRuntime } from "@/lib/utils";
import { useWatchlistStore } from "@/hooks/useWatchlistStore";
import { PosterImage } from "@/components/PosterImage";
import { TitleModal } from "@/components/TitleModal";

// Compact single-line alternative to the poster-grid TitleCard — for
// quickly scanning many titles at once rather than browsing visually.
export function TitleListRow({ title }: { title: Title }) {
  const [open, setOpen] = useState(false);
  const saved = useWatchlistStore((s) => s.isSaved(title.id));
  const toggle = useWatchlistStore((s) => s.toggle);

  return (
    <>
      <motion.div
        className="glass-card flex cursor-pointer items-center gap-3 overflow-hidden p-2"
        onClick={() => setOpen(true)}
        whileHover={{ x: 4 }}
        transition={{ type: "spring", stiffness: 350, damping: 25 }}
      >
        <div className="relative h-16 w-11 shrink-0 overflow-hidden rounded-md">
          <PosterImage src={title.posterUrl} alt={title.title} fill sizes="44px" className="object-cover" />
        </div>
        <div className="min-w-0 flex-1">
          <p className="truncate text-sm font-semibold">{title.title}</p>
          <div className="flex flex-wrap items-center gap-x-2 gap-y-0.5 text-[11px] text-muted-foreground">
            <span>{title.type === "MOVIE" ? formatRuntime(title.runtimeMinutes) || "Movie" : "Series"}</span>
            <span>·</span>
            <span>{PLATFORM_LABELS[title.platforms[0]] ?? title.platforms[0] ?? ""}</span>
            {title.genres[0] && (
              <>
                <span>·</span>
                <span>{GENRE_LABELS[title.genres[0]] ?? title.genres[0]}</span>
              </>
            )}
          </div>
        </div>
        {title.imdbRating != null && (
          <span className="flex shrink-0 items-center gap-0.5 text-xs font-medium text-yellow-400">
            <Star className="h-3 w-3 fill-yellow-400" /> {title.imdbRating}
          </span>
        )}
        <button
          onClick={(e) => {
            e.stopPropagation();
            toggle(title.id);
          }}
          className={cn("shrink-0 rounded-full p-1.5 transition-colors", saved ? "bg-accent text-white" : "hover:bg-[hsl(var(--foreground)/0.08)]")}
          aria-label="Toggle watchlist"
        >
          <Bookmark className={cn("h-3.5 w-3.5", saved && "fill-current")} />
        </button>
      </motion.div>
      <TitleModal titleId={title.id} open={open} onOpenChange={setOpen} />
    </>
  );
}
