"use client";
import Link from "next/link";
import { Bookmark, Clapperboard, Scale, TrendingUp, Tv } from "lucide-react";
import { useWatchlistStore } from "@/hooks/useWatchlistStore";
import { useMyPlatformsStore } from "@/hooks/useMyPlatformsStore";
import { useState, useEffect } from "react";
import { WatchlistDrawer } from "@/components/WatchlistDrawer";
import { MyPlatformsPicker } from "@/components/MyPlatformsPicker";
import { TasteOnboardingModal } from "@/components/TasteOnboardingModal";
import { useTasteStore } from "@/hooks/useTasteStore";
import { ThemeToggle } from "@/components/ThemeToggle";
import { LanguageToggle } from "@/components/LanguageToggle";
import { useI18n } from "@/components/LanguageProvider";

export function SiteHeader() {
  const count = useWatchlistStore((s) => s.titleIds.length);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [platformsOpen, setPlatformsOpen] = useState(false);
  const [tasteOpen, setTasteOpen] = useState(false);
  const myPlatformsCount = useMyPlatformsStore((s) => s.platforms.length);
  const hasOnboardedPlatforms = useMyPlatformsStore((s) => s.hasOnboarded);
  const hasOnboardedTaste = useTasteStore((s) => s.hasOnboarded);
  const { t } = useI18n();

  // First-visit nudges, chained one after another rather than both at
  // once: platforms first, then taste genres once that's dismissed.
  useEffect(() => {
    if (!hasOnboardedPlatforms) {
      const id = setTimeout(() => setPlatformsOpen(true), 1200);
      return () => clearTimeout(id);
    }
    if (!hasOnboardedTaste) {
      const id = setTimeout(() => setTasteOpen(true), 1200);
      return () => clearTimeout(id);
    }
  }, [hasOnboardedPlatforms, hasOnboardedTaste]);

  return (
    <header
      className="sticky top-0 z-40 border-b backdrop-blur-xl transition-colors duration-300"
      style={{ borderColor: "hsl(var(--foreground) / 0.06)", backgroundColor: "hsl(var(--background) / 0.8)" }}
    >
      <div className="mx-auto flex max-w-7xl items-center justify-between gap-4 px-4 py-3 sm:px-6 lg:px-8">
        <Link href="/" className="flex items-center gap-2">
          <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-br from-primary to-accent shadow-lg shadow-primary/30 transition-transform hover:scale-105">
            <Clapperboard className="h-5 w-5 text-white" />
          </span>
          <div className="leading-tight">
            <p className="font-display text-base font-bold tracking-tight">
              OTT <span className="text-gradient">Weekly Pulse</span>
            </p>
            <p className="hidden text-[10px] uppercase tracking-widest text-muted-foreground sm:block">
              Fri – Thu · HI · MR · EN
            </p>
          </div>
        </Link>

        <div className="flex items-center gap-2">
          <Link href="/top-10" className="chip hidden sm:inline-flex">
            <TrendingUp className="h-3.5 w-3.5" /> Top 10
          </Link>
          <Link href="/compare" className="chip hidden sm:inline-flex">
            <Scale className="h-3.5 w-3.5" /> Compare
          </Link>
          <button onClick={() => setPlatformsOpen(true)} className="chip relative hidden sm:inline-flex" aria-label="My Platforms">
            <Tv className="h-3.5 w-3.5" /> My Platforms
            {myPlatformsCount > 0 && (
              <span className="ml-1 flex h-4 min-w-4 items-center justify-center rounded-full bg-accent px-1 text-[10px] font-bold text-white">
                {myPlatformsCount}
              </span>
            )}
          </button>
          <button
            onClick={() => setDrawerOpen(true)}
            className="chip relative"
            aria-label="Open watchlist"
          >
            <Bookmark className="h-3.5 w-3.5" />
            <span className="hidden sm:inline">{t("header.watchlist")}</span>
            {count > 0 && (
              <span className="ml-1 flex h-4 min-w-4 items-center justify-center rounded-full bg-accent px-1 text-[10px] font-bold text-white">
                {count}
              </span>
            )}
          </button>
          <LanguageToggle />
          <ThemeToggle />
        </div>
      </div>
      <WatchlistDrawer open={drawerOpen} onOpenChange={setDrawerOpen} />
      <MyPlatformsPicker open={platformsOpen} onOpenChange={setPlatformsOpen} />
      <TasteOnboardingModal open={tasteOpen} onOpenChange={setTasteOpen} />
    </header>
  );
}
