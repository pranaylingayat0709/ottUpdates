"use client";
import Link from "next/link";
import { Bookmark, Clapperboard } from "lucide-react";
import { useWatchlistStore } from "@/hooks/useWatchlistStore";
import { useState } from "react";
import { WatchlistDrawer } from "@/components/WatchlistDrawer";
import { ThemeToggle } from "@/components/ThemeToggle";
import { LanguageToggle } from "@/components/LanguageToggle";
import { useI18n } from "@/components/LanguageProvider";

export function SiteHeader() {
  const count = useWatchlistStore((s) => s.titleIds.length);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const { t } = useI18n();

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
    </header>
  );
}
