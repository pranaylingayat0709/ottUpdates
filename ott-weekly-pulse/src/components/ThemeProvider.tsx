"use client";
import { createContext, useContext, useEffect, useState } from "react";

type Theme = "light" | "dark";
interface ThemeContextValue {
  theme: Theme;
  toggle: () => void;
}
const ThemeContext = createContext<ThemeContextValue | null>(null);

// Inline script injected before hydration (see layout.tsx) sets the `dark`
// class on <html> synchronously based on localStorage / prefers-color-scheme,
// so there's no flash of the wrong theme on load. This provider just keeps
// React state in sync with that class after mount.
export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const [theme, setTheme] = useState<Theme>("dark");

  useEffect(() => {
    const isDark = document.documentElement.classList.contains("dark");
    setTheme(isDark ? "dark" : "light");
  }, []);

  function toggle() {
    setTheme((prev) => {
      const next = prev === "dark" ? "light" : "dark";
      document.documentElement.classList.toggle("dark", next === "dark");
      window.localStorage.setItem("owp-theme", next);
      return next;
    });
  }

  return <ThemeContext.Provider value={{ theme, toggle }}>{children}</ThemeContext.Provider>;
}

export function useTheme() {
  const ctx = useContext(ThemeContext);
  if (!ctx) throw new Error("useTheme must be used within ThemeProvider");
  return ctx;
}
