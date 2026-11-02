"use client";
import dynamic from "next/dynamic";
import { useEffect, useState } from "react";

// Rarely-needed global overlays, split out of the initial bundle.
const CommandPalette = dynamic(() => import("@/components/CommandPalette").then((m) => m.CommandPalette), { ssr: false });
const PullToRefresh = dynamic(() => import("@/components/PullToRefresh").then((m) => m.PullToRefresh), { ssr: false });
const InstallPrompt = dynamic(() => import("@/components/InstallPrompt").then((m) => m.InstallPrompt), { ssr: false });

export function LazyGlobals() {
  // The palette's code is only downloaded the first time it's asked for
  // (Ctrl/Cmd+K or the header button). This tiny listener catches that first
  // request so it isn't lost while the chunk loads; the palette opens itself
  // on mount, and after that handles its own shortcuts.
  const [paletteWanted, setPaletteWanted] = useState(false);
  useEffect(() => {
    if (paletteWanted) return;
    const onKey = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "k") {
        e.preventDefault();
        setPaletteWanted(true);
      }
    };
    const onOpen = () => setPaletteWanted(true);
    window.addEventListener("keydown", onKey);
    window.addEventListener("owp:open-palette", onOpen);
    return () => {
      window.removeEventListener("keydown", onKey);
      window.removeEventListener("owp:open-palette", onOpen);
    };
  }, [paletteWanted]);

  return (
    <>
      {paletteWanted && <CommandPalette initialOpen />}
      <PullToRefresh />
      <InstallPrompt />
    </>
  );
}
