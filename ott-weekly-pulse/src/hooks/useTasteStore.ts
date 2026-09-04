"use client";
import { create } from "zustand";
import { persist } from "zustand/middleware";
import type { Genre } from "@/lib/types";

interface TasteState {
  favoriteGenres: Genre[];
  hasOnboarded: boolean;
  toggle: (genre: Genre) => void;
  markOnboarded: () => void;
}

// Captures TASTE (favorite genres) as distinct from My Platforms (access).
// Used to bias the Hero carousel ordering and to give Recommended For You
// something to work with before any watchlist history exists.
export const useTasteStore = create<TasteState>()(
  persist(
    (set, get) => ({
      favoriteGenres: [],
      hasOnboarded: false,
      toggle: (genre) => {
        const current = get().favoriteGenres;
        set({ favoriteGenres: current.includes(genre) ? current.filter((g) => g !== genre) : [...current, genre] });
      },
      markOnboarded: () => set({ hasOnboarded: true })
    }),
    { name: "owp-taste" }
  )
);
