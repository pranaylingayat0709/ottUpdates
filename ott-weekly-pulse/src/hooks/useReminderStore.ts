"use client";
import { create } from "zustand";
import { persist } from "zustand/middleware";

// Client-only "Notify Me" list for upcoming-week titles that haven't
// released yet. Honest scope: since there's no email/push backend wired
// up, this is a local reminder — it surfaces a banner on this device when
// a reminded title appears in the current week's catalog, rather than
// sending an actual notification. Stores {id, title} pairs (not just ids)
// because a title's id is week-scoped (see makeId in data-source.ts), so
// matching "is this reminded title now live" has to happen by name across
// weeks, not by id.
interface ReminderItem {
  id: string;
  title: string;
}
interface ReminderState {
  items: ReminderItem[];
  toggle: (item: ReminderItem) => void;
  isReminded: (id: string) => boolean;
  dismissedTitles: string[];
  dismiss: (titleName: string) => void;
}

export const useReminderStore = create<ReminderState>()(
  persist(
    (set, get) => ({
      items: [],
      dismissedTitles: [],
      isReminded: (id) => get().items.some((i) => i.id === id),
      toggle: (item) => {
        const current = get().items;
        const exists = current.some((i) => i.id === item.id);
        set({ items: exists ? current.filter((i) => i.id !== item.id) : [...current, item] });
      },
      dismiss: (titleName) => {
        set((s) => ({ dismissedTitles: [...s.dismissedTitles, titleName] }));
      }
    }),
    { name: "owp-reminders" }
  )
);
