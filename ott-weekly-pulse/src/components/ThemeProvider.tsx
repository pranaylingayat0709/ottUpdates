"use client";
import { createContext, useCallback, useContext, useEffect, useState } from "react";

type Theme = "light" | "dark";
export type ThemePreference = Theme | "system";

interface ThemeContextValue {
  /** The theme actually applied right now (system resolved to light/dark). */
  theme: Theme;
  /** What the user picked — "system" follows the OS and updates live. */
  preference: ThemePreference;
  setPreference: (p: ThemePreference) => void;
  /** Flips between light and dark (leaves "system" mode). */
  toggle: () => void;
}
const ThemeContext = createContext<ThemeContextValue | null>(null);

const STORAGE_KEY = "owp-theme";

function systemPrefersDark(): boolean {
  return typeof window !== "undefined" && window.matchMedia("(prefers-color-scheme: dark)").matches;
}

function resolve(pref: ThemePreference): Theme {
  if (pref === "system") return systemPrefersDark() ? "dark" : "light";
  return pref;
}

// Inline script injected before hydration (see layout.tsx) sets the `dark`
// class on <html> synchronously based on localStorage / prefers-color-scheme,
// so there's no flash of the wrong theme on load. This provider keeps React
// state in sync with that class after mount, and — when the preference is
// "system" — re-applies it live if the OS theme changes while the tab is open.
export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const [preference, setPreferenceState] = useState<ThemePreference>("system");
  const [theme, setTheme] = useState<Theme>("dark");

  useEffect(() => {
    let stored: string | null = null;
    try {
      stored = window.localStorage.getItem(STORAGE_KEY);
    } catch {
      // storage blocked — fall back to "system"
    }
    const pref: ThemePreference = stored === "light" || stored === "dark" ? stored : "system";
    setPreferenceState(pref);
    setTheme(resolve(pref));
  }, []);

  useEffect(() => {
    if (preference !== "system") return;
    const mq = window.matchMedia("(prefers-color-scheme: dark)");
    function onChange() {
      const next: Theme = mq.matches ? "dark" : "light";
      document.documentElement.classList.toggle("dark", next === "dark");
      setTheme(next);
    }
    mq.addEventListener("change", onChange);
    return () => mq.removeEventListener("change", onChange);
  }, [preference]);

  const setPreference = useCallback((p: ThemePreference) => {
    const next = resolve(p);
    document.documentElement.classList.toggle("dark", next === "dark");
    try {
      window.localStorage.setItem(STORAGE_KEY, p);
    } catch {
      // storage blocked — preference just won't persist
    }
    setPreferenceState(p);
    setTheme(next);
  }, []);

  const toggle = useCallback(() => {
    setPreference(theme === "dark" ? "light" : "dark");
  }, [theme, setPreference]);

  return <ThemeContext.Provider value={{ theme, preference, setPreference, toggle }}>{children}</ThemeContext.Provider>;
}

export function useTheme() {
  const ctx = useContext(ThemeContext);
  if (!ctx) throw new Error("useTheme must be used within ThemeProvider");
  return ctx;
}
