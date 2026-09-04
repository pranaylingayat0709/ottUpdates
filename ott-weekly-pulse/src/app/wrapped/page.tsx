"use client";
import { useEffect, useState } from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import { ArrowLeft, Sparkles, Bookmark, CheckCircle2, Star, Tv } from "lucide-react";
import { useWatchlistStore } from "@/hooks/useWatchlistStore";
import { useWatchedStore } from "@/hooks/useWatchedStore";
import { GENRE_LABELS, PLATFORM_LABELS, type Title } from "@/lib/types";

// "Your Wrapped" — prefers your real Watched diary (Mark as Watched) when
// you have entries, since that's an honest personal record, not just a
// bookmark. Falls back to watchlist-based stats if you haven't marked
// anything watched yet. Either way, the label makes clear which one it's
// showing — this app has no real playback tracking, so "watched" here
// means "you told us you watched it," not a verified stream event.
export default function WrappedPage() {
  const watchlistIds = useWatchlistStore((s) => s.titleIds);
  const watchedItems = useWatchedStore((s) => s.items);
  const [watchlistTitles, setWatchlistTitles] = useState<Title[]>([]);
  const [loading, setLoading] = useState(true);

  const usingWatched = watchedItems.length > 0;
  const idsToResolve = usingWatched ? watchedItems.map((w) => w.id) : watchlistIds;

  useEffect(() => {
    if (idsToResolve.length === 0) {
      setLoading(false);
      return;
    }
    fetch(`/api/titles/resolve?ids=${idsToResolve.join(",")}`)
      .then((r) => r.json())
      .then((d) => setWatchlistTitles(d.titles ?? []))
      .finally(() => setLoading(false));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [idsToResolve.join(",")]);

  const titles = watchlistTitles;
  const genreCounts = new Map<string, number>();
  const platformCounts = new Map<string, number>();
  const languageCounts = new Map<string, number>();
  for (const t of titles) {
    for (const g of t.genres) genreCounts.set(g, (genreCounts.get(g) ?? 0) + 1);
    for (const p of t.platforms) platformCounts.set(p, (platformCounts.get(p) ?? 0) + 1);
    languageCounts.set(t.originalLanguage, (languageCounts.get(t.originalLanguage) ?? 0) + 1);
  }
  const topGenre = [...genreCounts.entries()].sort((a, b) => b[1] - a[1])[0];
  const topPlatform = [...platformCounts.entries()].sort((a, b) => b[1] - a[1])[0];
  const avgRating = titles.length > 0 ? (titles.reduce((sum, t) => sum + (t.imdbRating ?? t.internalCriticRating ?? 0), 0) / titles.length).toFixed(1) : null;

  return (
    <div>
      <Link href="/" className="mb-4 inline-flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground">
        <ArrowLeft className="h-3.5 w-3.5" /> Back to Weekly Pulse
      </Link>

      <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4 }}>
        <h1 className="mb-1 flex items-center gap-2 font-display text-2xl font-bold tracking-tight sm:text-3xl">
          <Sparkles className="h-6 w-6 text-accent" /> Your Wrapped
        </h1>
        <p className="mb-6 text-sm text-muted-foreground">
          {usingWatched
            ? "Based on titles you've marked watched — your real personal record, right here in the app."
            : "Based on what you've saved — not a verified watch history yet. Mark titles as watched from any detail page for a more accurate wrapped."}
        </p>

        {loading ? (
          <p className="text-sm text-muted-foreground">Loading your wrapped...</p>
        ) : titles.length === 0 ? (
          <div className="glass-panel p-8 text-center">
            <Bookmark className="mx-auto mb-3 h-8 w-8 text-muted-foreground" />
            <p className="text-sm text-muted-foreground">Save a title to your watchlist or mark one as watched — come back here once you have.</p>
          </div>
        ) : (
          <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
            <div className="glass-card p-5 text-center">
              {usingWatched ? <CheckCircle2 className="mx-auto mb-2 h-5 w-5 text-emerald-400" /> : <Bookmark className="mx-auto mb-2 h-5 w-5 text-accent" />}
              <p className="text-3xl font-extrabold text-gradient">{titles.length}</p>
              <p className="text-xs text-muted-foreground">{usingWatched ? "Titles watched" : "Titles saved"}</p>
            </div>
            <div className="glass-card p-5 text-center">
              <Sparkles className="mx-auto mb-2 h-5 w-5 text-accent" />
              <p className="text-lg font-bold">{topGenre ? GENRE_LABELS[topGenre[0] as keyof typeof GENRE_LABELS] ?? topGenre[0] : "—"}</p>
              <p className="text-xs text-muted-foreground">Top genre</p>
            </div>
            <div className="glass-card p-5 text-center">
              <Tv className="mx-auto mb-2 h-5 w-5 text-accent" />
              <p className="text-lg font-bold">{topPlatform ? PLATFORM_LABELS[topPlatform[0] as keyof typeof PLATFORM_LABELS] ?? topPlatform[0] : "—"}</p>
              <p className="text-xs text-muted-foreground">Top platform</p>
            </div>
            <div className="glass-card p-5 text-center">
              <Star className="mx-auto mb-2 h-5 w-5 fill-yellow-400 text-yellow-400" />
              <p className="text-3xl font-extrabold text-gradient">{avgRating ?? "—"}</p>
              <p className="text-xs text-muted-foreground">Avg. rating</p>
            </div>
          </div>
        )}

        {[...languageCounts.entries()].length > 0 && (
          <div className="mt-6 glass-panel p-4">
            <p className="mb-2 text-xs font-semibold text-muted-foreground">Language breakdown</p>
            <div className="flex flex-wrap gap-2">
              {[...languageCounts.entries()].map(([lang, count]) => (
                <span key={lang} className="chip">{lang.charAt(0) + lang.slice(1).toLowerCase()}: {count}</span>
              ))}
            </div>
          </div>
        )}
      </motion.div>
    </div>
  );
}
