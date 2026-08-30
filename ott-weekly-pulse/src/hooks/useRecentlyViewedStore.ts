"use client";
import { create } from "zustand";
import { persist } from "zustand/middleware";

interface RecentItem {
  id: string;
  title: string;
  posterUrl: string;
  viewedAt: number;
}
interface RecentlyViewedState {
  items: RecentItem[];
  record: (item: Omit<RecentItem, "viewedAt">) => void;
}

const MAX_ITEMS = 10;

// Honest scope: this app doesn't have real in-app full-length video
// playback (titles link out to their actual streaming platform), so
// "Continue Watching" here tracks recently *viewed* titles (opened detail
// view or trailer) rather than a literal resume-from-timestamp position —
// there's no video position to resume within this app itself.
export const useRecentlyViewedStore = create<RecentlyViewedState>()(
  persist(
    (set, get) => ({
      items: [],
      record: (item) => {
        const withoutDupe = get().items.filter((i) => i.id !== item.id);
        const next = [{ ...item, viewedAt: Date.now() }, ...withoutDupe].slice(0, MAX_ITEMS);
        set({ items: next });
      }
    }),
    { name: "owp-recently-viewed" }
  )
);
