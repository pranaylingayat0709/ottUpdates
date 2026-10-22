"use client";
import { create } from "zustand";
import { persist } from "zustand/middleware";

export type ViewMode = "rails" | "grid" | "list" | "bento";
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
      viewMode: "rails",
      sortMode: "newest",
      myPlatformsOnly: false,
      setViewMode: (viewMode) => set({ viewMode }),
      setSortMode: (sortMode) => set({ sortMode }),
      setMyPlatformsOnly: (myPlatformsOnly) => set({ myPlatformsOnly })
    }),
    {
      name: "owp-view-preferences",
      // v2 introduced the "rails" (Discover) view as the default; existing
      // users keep their sort / My Platforms choices but land on rails once.
      version: 2,
      migrate: (persisted) => ({ ...(persisted as object), viewMode: "rails" }) as never
    }
  )
);

export function sortTitles<T extends { releaseDate: string; imdbRating?: number | null; internalCriticRating?: number | null; communityScore?: number; communityVotes?: number; popularity?: number | null; title: string }>(
  titles: T[],
  mode: SortMode
): T[] {
  const copy = [...titles];
  switch (mode) {
    case "rating":
      return copy.sort((a, b) => (b.imdbRating ?? b.internalCriticRating ?? 0) - (a.imdbRating ?? a.internalCriticRating ?? 0));
    case "popular":
      return copy.sort((a, b) => (b.popularity ?? 0) - (a.popularity ?? 0) || (b.communityVotes ?? 0) - (a.communityVotes ?? 0) || (b.communityScore ?? 0) - (a.communityScore ?? 0));
    case "alpha":
      return copy.sort((a, b) => a.title.localeCompare(b.title));
    case "newest":
    default:
      return copy.sort((a, b) => new Date(b.releaseDate).getTime() - new Date(a.releaseDate).getTime());
  }
}
