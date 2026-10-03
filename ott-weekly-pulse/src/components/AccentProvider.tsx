"use client";
import { createContext, useContext, useEffect, useState } from "react";

export type AccentKey = "violet" | "ocean" | "emerald" | "sunset" | "crimson";
export const ACCENT_OPTIONS: { value: AccentKey; label: string; swatch: string }[] = [
  { value: "violet", label: "Violet (Default)", swatch: "linear-gradient(135deg, hsl(262 75% 56%), hsl(331 85% 52%))" },
  { value: "ocean", label: "Ocean", swatch: "linear-gradient(135deg, hsl(201 90% 45%), hsl(217 91% 60%))" },
  { value: "emerald", label: "Emerald", swatch: "linear-gradient(135deg, hsl(152 60% 38%), hsl(168 76% 42%))" },
  { value: "sunset", label: "Sunset", swatch: "linear-gradient(135deg, hsl(24 90% 52%), hsl(340 82% 56%))" },
  { value: "crimson", label: "Crimson", swatch: "linear-gradient(135deg, hsl(350 78% 48%), hsl(12 85% 55%))" }
];

interface AccentContextValue {
  accent: AccentKey;
  setAccent: (a: AccentKey) => void;
}
const AccentContext = createContext<AccentContextValue | null>(null);

// Same pattern as ThemeProvider: an inline pre-hydration script (see
// layout.tsx) sets data-accent on <html> synchronously from localStorage
// so there's no flash of the default accent on load; this provider keeps
// React state in sync with that attribute after mount.
export function AccentProvider({ children }: { children: React.ReactNode }) {
  const [accent, setAccentState] = useState<AccentKey>("violet");

  useEffect(() => {
    const current = document.documentElement.getAttribute("data-accent") as AccentKey | null;
    if (current) setAccentState(current);
  }, []);

  function setAccent(next: AccentKey) {
    setAccentState(next);
    document.documentElement.setAttribute("data-accent", next);
    window.localStorage.setItem("owp-accent", next);
  }

  return <AccentContext.Provider value={{ accent, setAccent }}>{children}</AccentContext.Provider>;
}

export function useAccent() {
  const ctx = useContext(AccentContext);
  if (!ctx) throw new Error("useAccent must be used within AccentProvider");
  return ctx;
}
