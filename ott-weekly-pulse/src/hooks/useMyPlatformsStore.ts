"use client";
import { create } from "zustand";
import { persist } from "zustand/middleware";
import type { Platform } from "@/lib/types";

interface MyPlatformsState {
  platforms: Platform[];
  hasOnboarded: boolean;
  toggle: (platform: Platform) => void;
  setAll: (platforms: Platform[]) => void;
  markOnboarded: () => void;
}

// Multi-select, since most people have several OTT subscriptions at once
// (e.g. Netflix + Prime Video + JioHotstar). Local-only preference, no
// account needed — same pattern as the watchlist/reminder stores.
export const useMyPlatformsStore = create<MyPlatformsState>()(
  persist(
    (set, get) => ({
      platforms: [],
      hasOnboarded: false,
      toggle: (platform) => {
        const current = get().platforms;
        const next = current.includes(platform) ? current.filter((p) => p !== platform) : [...current, platform];
        set({ platforms: next });
      },
      setAll: (platforms) => set({ platforms }),
      markOnboarded: () => set({ hasOnboarded: true })
    }),
    { name: "owp-my-platforms" }
  )
);
