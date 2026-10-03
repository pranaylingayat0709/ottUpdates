"use client";
import { create } from "zustand";
import { persist } from "zustand/middleware";
import { scopedStoreName } from "@/lib/household";

export interface Collection {
  id: string;
  name: string;
  titleIds: string[];
  createdAt: string;
}

interface CollectionsState {
  collections: Collection[];
  createCollection: (name: string) => string;
  renameCollection: (id: string, name: string) => void;
  deleteCollection: (id: string) => void;
  toggleTitle: (collectionId: string, titleId: string) => void;
  isInCollection: (collectionId: string, titleId: string) => boolean;
}

// Custom, user-named collections — separate from the primary "Watchlist"
// bookmark (useWatchlistStore), which stays as the single default list.
// These are purely local/client-side, same as every other preference in
// this app (no accounts, so no server sync needed here).
export const useCollectionsStore = create<CollectionsState>()(
  persist(
    (set, get) => ({
      collections: [],
      createCollection: (name) => {
        const id = `col_${Date.now().toString(36)}${Math.random().toString(36).slice(2, 6)}`;
        set({ collections: [...get().collections, { id, name: name.trim() || "Untitled", titleIds: [], createdAt: new Date().toISOString() }] });
        return id;
      },
      renameCollection: (id, name) => {
        set({ collections: get().collections.map((c) => (c.id === id ? { ...c, name: name.trim() || c.name } : c)) });
      },
      deleteCollection: (id) => {
        set({ collections: get().collections.filter((c) => c.id !== id) });
      },
      toggleTitle: (collectionId, titleId) => {
        set({
          collections: get().collections.map((c) => {
            if (c.id !== collectionId) return c;
            const has = c.titleIds.includes(titleId);
            return { ...c, titleIds: has ? c.titleIds.filter((id) => id !== titleId) : [...c.titleIds, titleId] };
          })
        });
      },
      isInCollection: (collectionId, titleId) => get().collections.find((c) => c.id === collectionId)?.titleIds.includes(titleId) ?? false
    }),
    { name: scopedStoreName("owp-collections") }
  )
);
