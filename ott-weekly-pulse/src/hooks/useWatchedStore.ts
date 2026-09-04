"use client";
import { create } from "zustand";
import { persist } from "zustand/middleware";

interface WatchedItem {
  id: string;
  title: string;
  posterUrl: string;
  watchedAt: number;
}
interface WatchedState {
  items: WatchedItem[];
  toggle: (item: Omit<WatchedItem, "watchedAt">) => void;
  isWatched: (id: string) => boolean;
}

// Distinct from the watchlist ("want to watch") — this is "I watched
// this," a real personal viewing log (Letterboxd-style), so features like
// /wrapped can be honestly based on titles you've actually marked watched
// rather than just what you bookmarked.
export const useWatchedStore = create<WatchedState>()(
  persist(
    (set, get) => ({
      items: [],
      isWatched: (id) => get().items.some((i) => i.id === id),
      toggle: (item) => {
        const current = get().items;
        const exists = current.some((i) => i.id === item.id);
        set({ items: exists ? current.filter((i) => i.id !== item.id) : [{ ...item, watchedAt: Date.now() }, ...current] });
      }
    }),
    { name: "owp-watched" }
  )
);
