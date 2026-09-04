"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Home, Scale, TrendingUp, Bookmark, Search } from "lucide-react";
import { useState } from "react";
import { useWatchlistStore } from "@/hooks/useWatchlistStore";
import { WatchlistDrawer } from "@/components/WatchlistDrawer";
import { cn } from "@/lib/utils";

// Fixed bottom tab bar, mobile only — keeps core navigation reachable
// with a thumb instead of scrolling back to the header, matching the feel
// of native streaming apps.
export function MobileBottomNav() {
  const pathname = usePathname();
  const [drawerOpen, setDrawerOpen] = useState(false);
  const watchlistCount = useWatchlistStore((s) => s.titleIds.length);

  const items = [
    { href: "/", label: "Home", icon: Home, active: pathname === "/" },
    { href: "/top-10", label: "Top 10", icon: TrendingUp, active: pathname === "/top-10" },
    { href: "/compare", label: "Compare", icon: Scale, active: pathname === "/compare" }
  ];

  return (
    <>
      <nav
        className="fixed inset-x-0 bottom-0 z-30 flex items-center justify-around border-t backdrop-blur-xl sm:hidden"
        style={{ borderColor: "hsl(var(--foreground) / 0.08)", backgroundColor: "hsl(var(--background) / 0.92)", paddingBottom: "env(safe-area-inset-bottom)" }}
      >
        {items.map((item) => (
          <Link
            key={item.href}
            href={item.href}
            className={cn("flex flex-1 flex-col items-center gap-0.5 py-2.5 text-[10px] font-medium", item.active ? "text-accent" : "text-muted-foreground")}
          >
            <item.icon className="h-5 w-5" />
            {item.label}
          </Link>
        ))}
        <button
          onClick={() => setDrawerOpen(true)}
          className="relative flex flex-1 flex-col items-center gap-0.5 py-2.5 text-[10px] font-medium text-muted-foreground"
        >
          <Bookmark className="h-5 w-5" />
          Watchlist
          {watchlistCount > 0 && (
            <span className="absolute right-1/4 top-1 flex h-4 min-w-4 items-center justify-center rounded-full bg-accent px-1 text-[9px] font-bold text-white">
              {watchlistCount}
            </span>
          )}
        </button>
      </nav>
      <WatchlistDrawer open={drawerOpen} onOpenChange={setDrawerOpen} />
      {/* Spacer so page content isn't hidden behind the fixed bar */}
      <div className="h-16 sm:hidden" />
    </>
  );
}
