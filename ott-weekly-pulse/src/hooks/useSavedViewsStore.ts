"use client";
import { create } from "zustand";
import { persist } from "zustand/middleware";
import { scopedStoreName } from "@/lib/household";
import type { TitleFilters } from "@/lib/types";

export interface SavedView {
  id: string;
  name: string;
  filters: Partial<TitleFilters>;
}

interface State {
  views: SavedView[];
  save: (name: string, filters: Partial<TitleFilters>) => void;
  remove: (id: string) => void;
}

export const useSavedViewsStore = create<State>()(
  persist(
    (set, get) => ({
      views: [],
      save: (name, filters) => {
        const clean = name.trim().slice(0, 24);
        if (!clean) return;
        const views = get().views.filter((v) => v.name.toLowerCase() !== clean.toLowerCase());
        set({ views: [...views, { id: String(Date.now()), name: clean, filters }].slice(-8) });
      },
      remove: (id) => set({ views: get().views.filter((v) => v.id !== id) })
    }),
    { name: scopedStoreName("owp-saved-views") }
  )
);
