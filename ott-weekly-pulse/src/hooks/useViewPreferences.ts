"use client";
import { create } from "zustand";
import { persist } from "zustand/middleware";

export type ViewMode = "grid" | "list";
export type SortMode = "newest" | "rating" | "popular" | "alpha";

interface ViewPreferencesState {
  viewMode: ViewMode;
  sortMode: SortMode;
  myPlatformsOnly: boolean;
  setViewMode: (v: ViewMode) => void;
  setSortMode: (s: SortMode) => void;
  setMyPlatformsOnly: (v: boolean) => void;
}

export const useViewPreferences = create<ViewPreferencesState>()(
  persist(
    (set) => ({
      viewMode: "grid",
      sortMode: "newest",
      myPlatformsOnly: false,
      setViewMode: (viewMode) => set({ viewMode }),
      setSortMode: (sortMode) => set({ sortMode }),
      setMyPlatformsOnly: (myPlatformsOnly) => set({ myPlatformsOnly })
    }),
    { name: "owp-view-preferences" }
  )
);

export function sortTitles<T extends { releaseDate: string; imdbRating?: number | null; internalCriticRating?: number | null; communityScore?: number; communityVotes?: number; title: string }>(
  titles: T[],
  mode: SortMode
): T[] {
  const copy = [...titles];
  switch (mode) {
    case "rating":
      return copy.sort((a, b) => (b.imdbRating ?? b.internalCriticRating ?? 0) - (a.imdbRating ?? a.internalCriticRating ?? 0));
    case "popular":
      return copy.sort((a, b) => (b.communityVotes ?? 0) - (a.communityVotes ?? 0) || (b.communityScore ?? 0) - (a.communityScore ?? 0));
    case "alpha":
      return copy.sort((a, b) => a.title.localeCompare(b.title));
    case "newest":
    default:
      return copy.sort((a, b) => new Date(b.releaseDate).getTime() - new Date(a.releaseDate).getTime());
  }
}
