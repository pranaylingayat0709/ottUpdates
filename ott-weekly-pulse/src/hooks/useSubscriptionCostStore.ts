"use client";
import { create } from "zustand";
import { persist } from "zustand/middleware";
import type { Platform } from "@/lib/types";

interface SubscriptionCostState {
  prices: Partial<Record<Platform, number>>;
  setPrice: (platform: Platform, price: number | undefined) => void;
}

// A manual, self-reported subscription price tracker — there's no billing
// API to pull real numbers from, so this is just a lightweight per-platform
// input the user fills in themselves, summed on the profile page against
// their "My Platforms" list.
export const useSubscriptionCostStore = create<SubscriptionCostState>()(
  persist(
    (set, get) => ({
      prices: {},
      setPrice: (platform, price) => {
        const next = { ...get().prices };
        if (price == null || Number.isNaN(price) || price <= 0) delete next[platform];
        else next[platform] = price;
        set({ prices: next });
      }
    }),
    { name: "owp-subscription-costs" }
  )
);
