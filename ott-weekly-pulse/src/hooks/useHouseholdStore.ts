"use client";
import { create } from "zustand";
import { persist } from "zustand/middleware";
import { getActiveProfileId, setActiveProfileId } from "@/lib/household";

export interface HouseholdProfile {
  id: string;
  name: string;
  emoji: string;
}

const DEFAULT_PROFILE: HouseholdProfile = { id: "default", name: "Me", emoji: "🎬" };
const EMOJI_CHOICES = ["🎬", "🍿", "🎭", "🦄", "🐼", "🚀", "🌶️", "🎧", "🦊", "⭐"];

interface HouseholdState {
  profiles: HouseholdProfile[];
  activeProfileId: string;
  addProfile: (name: string) => void;
  renameProfile: (id: string, name: string) => void;
  removeProfile: (id: string) => void;
  switchProfile: (id: string) => void;
}

// The profile LIST is shared/global (unscoped key — every profile needs to
// see the same roster), but each profile's own data (watchlist, taste,
// etc.) lives in separately-keyed stores — see src/lib/household.ts.
export const useHouseholdStore = create<HouseholdState>()(
  persist(
    (set, get) => ({
      profiles: [DEFAULT_PROFILE],
      activeProfileId: getActiveProfileId(),
      addProfile: (name) => {
        const used = new Set(get().profiles.map((p) => p.emoji));
        const emoji = EMOJI_CHOICES.find((e) => !used.has(e)) ?? "🎬";
        const id = `p_${Date.now().toString(36)}${Math.random().toString(36).slice(2, 6)}`;
        set({ profiles: [...get().profiles, { id, name: name.trim() || "Profile", emoji }] });
      },
      renameProfile: (id, name) => {
        set({ profiles: get().profiles.map((p) => (p.id === id ? { ...p, name: name.trim() || p.name } : p)) });
      },
      removeProfile: (id) => {
        if (id === "default") return; // the default profile can't be deleted, only renamed
        set({ profiles: get().profiles.filter((p) => p.id !== id) });
        if (get().activeProfileId === id) get().switchProfile("default");
      },
      switchProfile: (id) => {
        setActiveProfileId(id);
        set({ activeProfileId: id });
        if (typeof window !== "undefined") window.location.reload();
      }
    }),
    {
      name: "owp-household-profiles",
      // activeProfileId is sourced from the separate plain localStorage key
      // (src/lib/household.ts) so it's readable synchronously by every
      // other store's module initializer — it's intentionally excluded
      // here to avoid two disagreeing sources of truth after a reload.
      partialize: (state) => ({ profiles: state.profiles })
    }
  )
);
