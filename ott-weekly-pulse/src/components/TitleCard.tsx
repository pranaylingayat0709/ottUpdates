"use client";
import Image from "next/image";
import { useState } from "react";
import { motion } from "framer-motion";
import { Bookmark, PlayCircle, Star } from "lucide-react";
import type { Title } from "@/lib/types";
import { PLATFORM_LABELS } from "@/lib/types";
import { cn, formatRuntime } from "@/lib/utils";
import { EditorialBadgePill } from "@/components/EditorialBadgePill";
import { useWatchlistStore } from "@/hooks/useWatchlistStore";
import { useTrailerPlayer } from "@/hooks/useTrailerPlayer";
import { getTrailerAction } from "@/lib/youtube";
import { TitleModal } from "@/components/TitleModal";

const FALLBACK_POSTER = "https://placehold.co/500x750/1a1a24/6a6a7a?text=Poster+Not+Available";

export function TitleCard({ title, className }: { title: Title; className?: string }) {
  const [open, setOpen] = useState(false);
  const [imgError, setImgError] = useState(false);
  const saved = useWatchlistStore((s) => s.isSaved(title.id));
  const toggle = useWatchlistStore((s) => s.toggle);
  const playTrailer = useTrailerPlayer((s) => s.play);
  const trailerAction = getTrailerAction(title.title, title.trailerUrl);

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
            src={imgError || !title.posterUrl ? FALLBACK_POSTER : title.posterUrl}
            alt={title.title}
            fill
            sizes="(max-width: 640px) 45vw, (max-width: 1024px) 25vw, 200px"
            className="object-cover transition-transform duration-500 group-hover:scale-105"
            onError={() => setImgError(true)}
          />
          <div className="absolute inset-x-0 bottom-0 h-2/3 bg-gradient-to-t from-black/90 via-black/40 to-transparent" />

          {trailerAction.kind === "play" && (
            <div className="absolute inset-0 z-[5] flex items-center justify-center opacity-0 pointer-events-none transition-opacity duration-200 group-hover:opacity-100">
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  playTrailer(trailerAction.videoId, title.title);
                }}
                className="pointer-events-auto flex h-12 w-12 items-center justify-center rounded-full bg-white/90 text-black shadow-xl transition-transform hover:scale-110"
                aria-label="Play trailer"
              >
                <PlayCircle className="h-7 w-7" />
              </button>
            </div>
          )}

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
              <span>
                {title.type === "MOVIE"
                  ? formatRuntime(title.runtimeMinutes)
                  : title.totalEpisodes
                    ? `${title.totalEpisodes} eps`
                    : title.type === "SERIES"
                      ? "Series"
                      : "Documentary"}
              </span>
              <span>·</span>
              <span>{PLATFORM_LABELS[title.platforms[0]] ?? title.platforms[0] ?? ""}</span>
              {title.imdbRating && (
                <>
                  <span>·</span>
                  <span className="flex items-center gap-0.5">
                    <Star className="h-2.5 w-2.5 fill-yellow-400 text-yellow-400" /> {title.imdbRating}
                  </span>
                </>
              )}
            </div>
            {/* Hover quick-preview (desktop only — touch devices don't
                sustain :hover, so this naturally doesn't clutter mobile).
                Pure CSS max-height transition, no JS/scroll-observer
                involved, so it can't get stuck like whileInView did. */}
            <div className="hidden max-h-0 overflow-hidden opacity-0 transition-all duration-300 group-hover:max-h-24 group-hover:opacity-100 sm:block">
              <p className="line-clamp-3 pt-1 text-[10px] leading-snug text-white/80">{title.synopsis}</p>
              {title.genres.length > 0 && (
                <p className="pt-1 text-[9px] uppercase tracking-wide text-white/50">{title.genres.slice(0, 3).join(" · ")}</p>
              )}
            </div>
          </div>
        </div>
      </motion.div>
      <TitleModal titleId={title.id} open={open} onOpenChange={setOpen} />
    </>
  );
}

