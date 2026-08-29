"use client";
import { create } from "zustand";
import { persist } from "zustand/middleware";
import { getOrCreateUserToken } from "@/lib/utils";

interface WatchlistState {
  titleIds: string[];
  toggle: (titleId: string) => void;
  isSaved: (titleId: string) => boolean;
}

export const useWatchlistStore = create<WatchlistState>()(
  persist(
    (set, get) => ({
      titleIds: [],
      isSaved: (titleId) => get().titleIds.includes(titleId),
      toggle: (titleId) => {
        const current = get().titleIds;
        const next = current.includes(titleId)
          ? current.filter((id) => id !== titleId)
          : [...current, titleId];
        set({ titleIds: next });

        const userToken = getOrCreateUserToken();
        if (userToken) {
          fetch("/api/watchlist", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ userToken, titleId })
          }).catch(() => {
            /* best-effort sync; local state remains source of truth for UI */
          });
        }
      }
    }),
    { name: "owp-watchlist" }
  )
);
