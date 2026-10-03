// Household profiles let a few people share one browser/device while
// keeping separate watchlists, taste, platforms, reminders and watched
// history — without any real accounts or a backend. The mechanism: each
// personal zustand `persist` store's localStorage key is suffixed with the
// active profile id, read synchronously here (plain localStorage, not
// through zustand) so it's available the instant those store modules are
// created. Switching profiles therefore requires a full page reload — the
// store modules need to re-run with the new key — which
// useHouseholdStore.switchProfile does for you.
//
// "default" (the very first/only profile) intentionally keeps the
// UNSUFFIXED key, so existing users' data before this feature shipped is
// never orphaned.
const ACTIVE_PROFILE_KEY = "owp-active-profile";

export function getActiveProfileId(): string {
  if (typeof window === "undefined") return "default";
  try {
    return window.localStorage.getItem(ACTIVE_PROFILE_KEY) || "default";
  } catch {
    return "default";
  }
}

export function setActiveProfileId(id: string) {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(ACTIVE_PROFILE_KEY, id);
  } catch {
    // storage unavailable (private mode, quota) — nothing more we can do
  }
}

export function scopedStoreName(base: string): string {
  const id = getActiveProfileId();
  return id === "default" ? base : `${base}:${id}`;
}
