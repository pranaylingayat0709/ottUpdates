"use client";
import { AnimatePresence, motion } from "framer-motion";
import { Minimize2, Maximize2, X } from "lucide-react";
import { useTrailerPlayer } from "@/hooks/useTrailerPlayer";

// Renders nothing when closed; a centered modal player when "modal"; or a
// small floating bottom-right player (YouTube-style mini player) when
// minimized — same underlying <iframe>, just repositioned/resized, so
// playback continues uninterrupted across the transition. Mounted once at
// the root layout so it persists across page navigation.
export function TrailerPlayer() {
  const { mode, videoId, title, minimize, restore, close } = useTrailerPlayer();

  if (mode === "closed" || !videoId) return null;

  const embedSrc = `https://www.youtube.com/embed/${videoId}?autoplay=1&rel=0`;

  return (
    <AnimatePresence>
      {mode === "modal" && (
        <motion.div
          key="modal"
          className="fixed inset-0 z-[70] flex items-center justify-center bg-black/80 p-4 backdrop-blur-sm"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={(e) => e.target === e.currentTarget && close()}
        >
          <motion.div
            className="relative w-full max-w-4xl overflow-hidden rounded-2xl border border-[hsl(var(--foreground)/0.1)] bg-black shadow-2xl"
            initial={{ scale: 0.92, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.92, opacity: 0 }}
            transition={{ type: "spring", stiffness: 300, damping: 28 }}
          >
            <div className="flex items-center justify-between bg-black/90 px-4 py-2.5">
              <p className="truncate text-sm font-medium text-white">{title}</p>
              <div className="flex items-center gap-1 shrink-0">
                <button onClick={minimize} aria-label="Minimize" className="rounded-full p-1.5 text-white/70 hover:bg-white/10 hover:text-white">
                  <Minimize2 className="h-4 w-4" />
                </button>
                <button onClick={close} aria-label="Close" className="rounded-full p-1.5 text-white/70 hover:bg-white/10 hover:text-white">
                  <X className="h-4 w-4" />
                </button>
              </div>
            </div>
            <div className="aspect-video w-full">
              <iframe
                key={videoId}
                src={embedSrc}
                title={title ?? "Trailer"}
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                allowFullScreen
                className="h-full w-full"
              />
            </div>
          </motion.div>
        </motion.div>
      )}

      {mode === "mini" && (
        <motion.div
          key="mini"
          className="fixed bottom-4 right-4 z-[70] w-72 overflow-hidden rounded-xl border border-[hsl(var(--foreground)/0.12)] bg-black shadow-2xl sm:w-80"
          initial={{ opacity: 0, y: 40, scale: 0.9 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: 40, scale: 0.9 }}
          transition={{ type: "spring", stiffness: 320, damping: 26 }}
          drag
          dragConstraints={{ top: -400, left: -300, right: 20, bottom: 20 }}
          dragMomentum={false}
        >
          <div className="flex cursor-grab items-center justify-between bg-black/90 px-3 py-1.5 active:cursor-grabbing">
            <p className="truncate text-xs font-medium text-white">{title}</p>
            <div className="flex items-center gap-0.5 shrink-0">
              <button onClick={restore} aria-label="Expand" className="rounded-full p-1 text-white/70 hover:bg-white/10 hover:text-white">
                <Maximize2 className="h-3.5 w-3.5" />
              </button>
              <button onClick={close} aria-label="Close" className="rounded-full p-1 text-white/70 hover:bg-white/10 hover:text-white">
                <X className="h-3.5 w-3.5" />
              </button>
            </div>
          </div>
          <div className="aspect-video w-full">
            <iframe
              key={videoId}
              src={embedSrc}
              title={title ?? "Trailer"}
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
              allowFullScreen
              className="h-full w-full"
            />
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
