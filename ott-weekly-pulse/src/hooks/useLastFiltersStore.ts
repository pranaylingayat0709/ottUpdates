"use client";
import { create } from "zustand";
import { persist } from "zustand/middleware";
import type { TitleFilters } from "@/lib/types";

type PersistedFilters = Pick<TitleFilters, "type" | "language" | "platform" | "genre" | "minRating">;

interface LastFiltersState {
  filters: PersistedFilters;
  setFilters: (f: PersistedFilters) => void;
}

// Remembers the last non-search filter combo (type/language/platform/genre/
// rating) across visits — search text and mood/runtime stay session-only
// since those feel more like a one-off query than a standing preference.
export const useLastFiltersStore = create<LastFiltersState>()(
  persist(
    (set) => ({
      filters: { type: "ALL", language: "ALL", platform: "ALL", genre: "ALL" },
      setFilters: (filters) => set({ filters })
    }),
    { name: "owp-last-filters" }
  )
);
