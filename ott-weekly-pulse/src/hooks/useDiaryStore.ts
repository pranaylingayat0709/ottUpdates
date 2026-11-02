"use client";
import { create } from "zustand";
import { persist } from "zustand/middleware";
import { scopedStoreName } from "@/lib/household";

export interface DiaryEntry {
  id: string; // title id
  title: string;
  posterUrl: string;
  genres: string[];
  cast: string[];
  rating: number; // 0.5 .. 5 in half steps; 0 = logged without a rating
  note: string;
  loggedAt: number; // ms
}

interface DiaryState {
  entries: DiaryEntry[];
  get: (id: string) => DiaryEntry | undefined;
  save: (entry: Omit<DiaryEntry, "loggedAt"> & { loggedAt?: number }) => void;
  remove: (id: string) => void;
}

// A personal, Letterboxd-style viewing log: one entry per title with a
// half-star rating and a short private note. Stored locally per household
// profile (and included in sync snapshots) — nothing is sent to a server.
export const useDiaryStore = create<DiaryState>()(
  persist(
    (set, getState) => ({
      entries: [],
      get: (id) => getState().entries.find((e) => e.id === id),
      save: (entry) => {
        const existing = getState().entries.find((e) => e.id === entry.id);
        const next: DiaryEntry = { ...entry, note: entry.note.slice(0, 1000), loggedAt: entry.loggedAt ?? existing?.loggedAt ?? Date.now() };
        set({ entries: [next, ...getState().entries.filter((e) => e.id !== entry.id)] });
      },
      remove: (id) => set({ entries: getState().entries.filter((e) => e.id !== id) })
    }),
    { name: scopedStoreName("owp-diary") }
  )
);
