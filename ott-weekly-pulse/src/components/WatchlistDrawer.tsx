"use client";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { useWatchlistStore } from "@/hooks/useWatchlistStore";
import { useQuery } from "@tanstack/react-query";
import type { Title } from "@/lib/types";
import { Bookmark, Star } from "lucide-react";
import { PosterImage } from "@/components/PosterImage";
import Link from "next/link";

export function WatchlistDrawer({ open, onOpenChange }: { open: boolean; onOpenChange: (v: boolean) => void }) {
  const ids = useWatchlistStore((s) => s.titleIds);
  const toggle = useWatchlistStore((s) => s.toggle);

  const { data: titles = [] } = useQuery({
    queryKey: ["watchlist-titles", ids],
    queryFn: async () => {
      if (ids.length === 0) return [] as Title[];
      const res = await fetch(`/api/titles/resolve?ids=${ids.join(",")}`);
      const data = await res.json();
      return data.titles as Title[];
    },
    enabled: open
  });

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg">
        <div className="p-6">
          <h2 className="flex items-center gap-2 text-lg font-bold">
            <Bookmark className="h-5 w-5 text-accent" /> Your Watchlist
          </h2>
          <p className="mb-4 mt-1 text-xs text-muted-foreground">
            {ids.length === 0 ? "Nothing saved yet — tap the bookmark icon on any title." : `${ids.length} title${ids.length > 1 ? "s" : ""} saved`}
          </p>
          <div className="max-h-[60vh] space-y-3 overflow-y-auto scrollbar-thin pr-1">
            {titles.map((t) => (
              <div key={t.id} className="glass-card flex gap-3 p-2">
                <Link href={`/title/${t.id}`} onClick={() => onOpenChange(false)} className="shrink-0">
                  <PosterImage src={t.posterUrl} alt={t.title} width={56} height={80} className="rounded-md object-cover" />
                </Link>
                <div className="min-w-0 flex-1">
                  <Link href={`/title/${t.id}`} onClick={() => onOpenChange(false)} className="line-clamp-1 text-sm font-semibold hover:text-accent">
                    {t.title}
                  </Link>
                  <div className="mt-1 flex items-center gap-2 text-[11px] text-muted-foreground">
                    <span>{t.type === "MOVIE" ? "Movie" : t.type === "SERIES" ? "Series" : "Documentary"}</span>
                    {t.imdbRating && (
                      <span className="flex items-center gap-0.5">
                        <Star className="h-3 w-3 fill-yellow-400 text-yellow-400" /> {t.imdbRating}
                      </span>
                    )}
                  </div>
                </div>
                <button
                  onClick={() => toggle(t.id)}
                  className="self-start rounded-full p-1.5 text-muted-foreground hover:bg-[hsl(var(--foreground)/0.08)] hover:text-accent"
                  aria-label="Remove from watchlist"
                >
                  <Bookmark className="h-4 w-4 fill-current" />
                </button>
              </div>
            ))}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
