import { scopedStoreName } from "@/lib/household";

// localStorage keys included in a sync snapshot (the active profile's
// personal stores). Resolved lazily so the profile suffix is read at call time.
export function syncKeys(): string[] {
  return ["owp-watchlist", "owp-watched", "owp-taste", "owp-my-platforms", "owp-diary", "owp-reminders", "owp-collections", "owp-saved-views"].map(scopedStoreName);
}
