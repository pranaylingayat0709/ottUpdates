"use client";
import { useEffect, useRef, useState } from "react";
import { motion, useMotionValue, useSpring, useTransform } from "framer-motion";
import { Bookmark, PlayCircle, Star, Languages } from "lucide-react";
import type { Title } from "@/lib/types";
import { PLATFORM_LABELS, PLATFORM_COLORS } from "@/lib/types";
import { cn, formatRuntime } from "@/lib/utils";
import { EditorialBadgePill } from "@/components/EditorialBadgePill";
import { isNewThisWeek } from "@/lib/freshness";
import { Clock3 } from "lucide-react";
import { PosterImage } from "@/components/PosterImage";
import { useWatchlistStore } from "@/hooks/useWatchlistStore";
import { useTrailerPlayer } from "@/hooks/useTrailerPlayer";
import { getTrailerAction } from "@/lib/youtube";
import { TitleModal } from "@/components/TitleModal";

export function TitleCard({ title, className }: { title: Title; className?: string }) {
  const [open, setOpen] = useState(false);
  const [justSaved, setJustSaved] = useState(false);
  const saved = useWatchlistStore((s) => s.isSaved(title.id));
  const toggle = useWatchlistStore((s) => s.toggle);
  const playTrailer = useTrailerPlayer((s) => s.play);
  const trailerAction = getTrailerAction(title.title, title.trailerUrl);

  // Subtle 3D tilt that follows the cursor (desktop only — pointer-fine
  // devices; touch devices don't get useless residual tilt after a tap).
  // Kept small (±6deg) so it reads as depth, not a gimmick.
  const cardRef = useRef<HTMLDivElement>(null);
  const tiltX = useMotionValue(0);
  const tiltY = useMotionValue(0);
  const springX = useSpring(tiltX, { stiffness: 300, damping: 30 });
  const springY = useSpring(tiltY, { stiffness: 300, damping: 30 });
  const rotateX = useTransform(springY, [-0.5, 0.5], [6, -6]);
  const rotateY = useTransform(springX, [-0.5, 0.5], [-6, 6]);

  // Hover video preview (desktop only): wait ~450ms of sustained hover
  // before loading the trailer, so a quick mouse pass across the grid
  // never triggers a fetch — only one iframe is ever mounted at a time,
  // and it unmounts immediately on mouse-leave.
  const [previewReady, setPreviewReady] = useState(false);
  const hoverTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  useEffect(() => () => { if (hoverTimer.current) clearTimeout(hoverTimer.current); }, []);

  function handleMouseMove(e: React.MouseEvent<HTMLDivElement>) {
    const el = cardRef.current;
    if (!el) return;
    const rect = el.getBoundingClientRect();
    tiltX.set((e.clientX - rect.left) / rect.width - 0.5);
    tiltY.set((e.clientY - rect.top) / rect.height - 0.5);
  }
  function handleMouseEnter() {
    if (trailerAction.kind !== "play") return;
    hoverTimer.current = setTimeout(() => setPreviewReady(true), 450);
  }
  function handleMouseLeave() {
    tiltX.set(0);
    tiltY.set(0);
    if (hoverTimer.current) clearTimeout(hoverTimer.current);
    setPreviewReady(false);
  }

  return (
    <>
      <motion.div
        ref={cardRef}
        className={cn("group glass-card cursor-pointer overflow-hidden [perspective:800px]", className)}
        onClick={() => setOpen(true)}
        onMouseMove={handleMouseMove}
        onMouseEnter={handleMouseEnter}
        onMouseLeave={handleMouseLeave}
        whileHover={{ y: -6, scale: 1.02 }}
        whileTap={{ scale: 0.98 }}
        style={{ rotateX, rotateY }}
        transition={{ type: "spring", stiffness: 350, damping: 22 }}
      >
        <div className="relative aspect-[2/3] w-full overflow-hidden">
          <PosterImage
            src={title.posterUrl}
            alt={title.title}
            fill
            sizes="(max-width: 640px) 45vw, (max-width: 1024px) 25vw, 200px"
            className="object-cover transition-transform duration-500 group-hover:scale-105"
          />
          {previewReady && trailerAction.kind === "play" && (
            <iframe
              className="absolute inset-0 hidden h-full w-full sm:block"
              style={{ pointerEvents: "none" }}
              src={`https://www.youtube-nocookie.com/embed/${trailerAction.videoId}?autoplay=1&mute=1&controls=0&modestbranding=1&playsinline=1&loop=1&playlist=${trailerAction.videoId}&iv_load_policy=3`}
              title={`${title.title} trailer preview`}
              allow="autoplay; encrypted-media"
              tabIndex={-1}
            />
          )}
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

          <motion.button
            onClick={(e) => {
              e.stopPropagation();
              toggle(title.id);
              setJustSaved(true);
              setTimeout(() => setJustSaved(false), 400);
            }}
            animate={justSaved ? { scale: [1, 1.4, 1] } : {}}
            transition={{ duration: 0.4, ease: "easeOut" }}
            className={cn(
              "absolute right-2 top-2 z-10 rounded-full p-1.5 backdrop-blur-md transition-colors",
              saved ? "bg-accent text-white" : "bg-black/40 text-white/80 hover:bg-black/60"
            )}
            aria-label="Toggle watchlist"
          >
            <Bookmark className={cn("h-3.5 w-3.5", saved && "fill-current")} />
          </motion.button>

          <div className="absolute left-2 top-2 z-10 flex flex-col items-start gap-1">
            {title.editorialBadges[0] && <EditorialBadgePill badge={title.editorialBadges[0]} />}
            {title.isHindiDubbed && (
              <span className="badge-pill bg-black/50 text-white/90 backdrop-blur-sm">
                <Languages className="h-2.5 w-2.5" /> Hindi Dub
              </span>
            )}
          </div>

          <div className="absolute inset-x-0 bottom-0 space-y-1 p-3">
            {!isNewThisWeek(title) && (
              <span className="mb-0.5 inline-flex items-center gap-1 rounded-full bg-black/50 px-2 py-0.5 text-[9px] font-medium uppercase tracking-wide text-white/80 backdrop-blur-sm">
                <Clock3 className="h-2.5 w-2.5" /> Still Streaming
              </span>
            )}
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
              {title.platforms[0] && (
                <span className="flex items-center gap-1">
                  <span className="h-1.5 w-1.5 shrink-0 rounded-full" style={{ backgroundColor: PLATFORM_COLORS[title.platforms[0]] }} />
                  {PLATFORM_LABELS[title.platforms[0]] ?? title.platforms[0]}
                </span>
              )}
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

