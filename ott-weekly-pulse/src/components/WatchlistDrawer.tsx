"use client";
import { useState } from "react";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { useWatchlistStore } from "@/hooks/useWatchlistStore";
import { useCollectionsStore } from "@/hooks/useCollectionsStore";
import { useQuery } from "@tanstack/react-query";
import type { Title } from "@/lib/types";
import { Bookmark, Star, Plus, Trash2, FolderPlus, Share2, Check } from "lucide-react";
import { PosterImage } from "@/components/PosterImage";
import { cn } from "@/lib/utils";
import Link from "next/link";

function useTitlesForIds(ids: string[], enabled: boolean) {
  return useQuery({
    queryKey: ["watchlist-titles", ids],
    queryFn: async () => {
      if (ids.length === 0) return [] as Title[];
      const res = await fetch(`/api/titles/resolve?ids=${ids.join(",")}`);
      const data = await res.json();
      return data.titles as Title[];
    },
    enabled
  });
}

export function WatchlistDrawer({ open, onOpenChange }: { open: boolean; onOpenChange: (v: boolean) => void }) {
  const watchlistIds = useWatchlistStore((s) => s.titleIds);
  const toggleWatchlist = useWatchlistStore((s) => s.toggle);

  const collections = useCollectionsStore((s) => s.collections);
  const createCollection = useCollectionsStore((s) => s.createCollection);
  const deleteCollection = useCollectionsStore((s) => s.deleteCollection);
  const toggleInCollection = useCollectionsStore((s) => s.toggleTitle);

  // "watchlist" is always the first tab (the original default list);
  // any string after that is a custom collection id.
  const [activeTab, setActiveTab] = useState<string>("watchlist");
  const [creating, setCreating] = useState(false);
  const [newName, setNewName] = useState("");

  const activeCollection = collections.find((c) => c.id === activeTab);
  const ids = activeTab === "watchlist" ? watchlistIds : activeCollection?.titleIds ?? [];
  const { data: titles = [] } = useTitlesForIds(ids, open);
  const [shared, setShared] = useState(false);

  async function shareList() {
    if (ids.length === 0) return;
    const name = activeTab === "watchlist" ? "My Watchlist" : activeCollection?.name ?? "Shared List";
    const encodedIds = typeof window !== "undefined" ? btoa(ids.join(",")) : "";
    const url = `${typeof window !== "undefined" ? window.location.origin : ""}/?importCollection=${encodedIds}&importName=${encodeURIComponent(name)}`;

    if (typeof navigator !== "undefined" && navigator.share) {
      try {
        await navigator.share({ title: `${name} — OTT Weekly Pulse`, url });
        return;
      } catch {
        // cancelled or unsupported — fall through to clipboard
      }
    }
    if (typeof navigator !== "undefined" && navigator.clipboard) {
      try {
        await navigator.clipboard.writeText(url);
        setShared(true);
        setTimeout(() => setShared(false), 2000);
      } catch {
        // clipboard blocked — nothing more we can do without a user gesture
      }
    }
  }

  function submitNewCollection() {
    if (!newName.trim()) {
      setCreating(false);
      return;
    }
    const id = createCollection(newName);
    setNewName("");
    setCreating(false);
    setActiveTab(id);
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg">
        <div className="p-6">
          <h2 className="flex items-center gap-2 text-lg font-bold">
            <Bookmark className="h-5 w-5 text-accent" /> Your Lists
          </h2>

          <div className="mt-3 flex flex-wrap items-center gap-1.5">
            <button
              onClick={() => setActiveTab("watchlist")}
              className={cn("chip !py-1 text-xs", activeTab === "watchlist" && "chip-active")}
            >
              Watchlist ({watchlistIds.length})
            </button>
            {collections.map((c) => (
              <button
                key={c.id}
                onClick={() => setActiveTab(c.id)}
                className={cn("chip !py-1 text-xs", activeTab === c.id && "chip-active")}
              >
                {c.name} ({c.titleIds.length})
              </button>
            ))}
            {creating ? (
              <input
                autoFocus
                value={newName}
                onChange={(e) => setNewName(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && submitNewCollection()}
                onBlur={submitNewCollection}
                placeholder="Collection name"
                className="w-28 rounded-full border border-[hsl(var(--foreground)/0.15)] bg-transparent px-2.5 py-1 text-xs focus:outline-none"
              />
            ) : (
              <button onClick={() => setCreating(true)} className="chip !py-1 text-xs flex items-center gap-1">
                <Plus className="h-3 w-3" /> New
              </button>
            )}
          </div>

          {activeCollection && (
            <button
              onClick={() => {
                deleteCollection(activeCollection.id);
                setActiveTab("watchlist");
              }}
              className="mt-2 flex items-center gap-1 text-[11px] text-muted-foreground hover:text-destructive"
            >
              <Trash2 className="h-3 w-3" /> Delete this collection
            </button>
          )}

          <div className="mb-4 mt-2 flex items-center justify-between">
            <p className="text-xs text-muted-foreground">
              {ids.length === 0
                ? activeTab === "watchlist"
                  ? "Nothing saved yet — tap the bookmark icon on any title."
                  : "Empty — add titles to this collection from a title's detail page."
                : `${ids.length} title${ids.length > 1 ? "s" : ""} saved`}
            </p>
            {ids.length > 0 && (
              <button onClick={shareList} className="flex shrink-0 items-center gap-1 text-[11px] text-muted-foreground hover:text-accent">
                {shared ? <Check className="h-3 w-3" /> : <Share2 className="h-3 w-3" />} {shared ? "Link copied!" : "Share"}
              </button>
            )}
          </div>

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
                  onClick={() => (activeTab === "watchlist" ? toggleWatchlist(t.id) : toggleInCollection(activeTab, t.id))}
                  className="self-start rounded-full p-1.5 text-muted-foreground hover:bg-[hsl(var(--foreground)/0.08)] hover:text-accent"
                  aria-label="Remove"
                >
                  <Bookmark className="h-4 w-4 fill-current" />
                </button>
              </div>
            ))}
          </div>

          {collections.length === 0 && activeTab === "watchlist" && watchlistIds.length > 0 && (
            <button
              onClick={() => setCreating(true)}
              className="mt-4 flex w-full items-center justify-center gap-1.5 rounded-lg border border-dashed border-[hsl(var(--foreground)/0.15)] py-2 text-xs text-muted-foreground hover:border-accent/50 hover:text-accent"
            >
              <FolderPlus className="h-3.5 w-3.5" /> Create a custom collection (e.g. "Weekend Watch")
            </button>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
