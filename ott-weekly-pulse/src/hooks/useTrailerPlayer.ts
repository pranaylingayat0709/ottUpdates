"use client";
import { create } from "zustand";

type PlayerMode = "closed" | "modal" | "mini";

interface TrailerPlayerState {
  mode: PlayerMode;
  videoId: string | null;
  title: string | null;
  play: (videoId: string, title: string) => void;
  minimize: () => void;
  restore: () => void;
  close: () => void;
}

// Global (not persisted) trailer-player state — a modal by default, or a
// floating bottom-right mini player if minimized, so trailers can keep
// playing while browsing the rest of the site (YouTube's own "mini player"
// pattern). Mounted once at the root layout.
export const useTrailerPlayer = create<TrailerPlayerState>((set) => ({
  mode: "closed",
  videoId: null,
  title: null,
  play: (videoId, title) => set({ mode: "modal", videoId, title }),
  minimize: () => set((s) => ({ ...s, mode: s.videoId ? "mini" : "closed" })),
  restore: () => set((s) => ({ ...s, mode: s.videoId ? "modal" : "closed" })),
  close: () => set({ mode: "closed", videoId: null, title: null })
}));
