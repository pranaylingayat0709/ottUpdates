"use client";
import { useState } from "react";
import { FolderPlus, Check, Plus } from "lucide-react";
import { useCollectionsStore } from "@/hooks/useCollectionsStore";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

// Small dropdown for adding a title to one or more of the user's custom
// collections, next to the primary watchlist button on the title detail
// view. Collections themselves are managed from WatchlistDrawer.
export function AddToCollectionButton({ titleId }: { titleId: string }) {
  const [open, setOpen] = useState(false);
  const [creating, setCreating] = useState(false);
  const [newName, setNewName] = useState("");
  const collections = useCollectionsStore((s) => s.collections);
  const createCollection = useCollectionsStore((s) => s.createCollection);
  const toggleTitle = useCollectionsStore((s) => s.toggleTitle);

  function submitNewCollection() {
    if (!newName.trim()) {
      setCreating(false);
      return;
    }
    const id = createCollection(newName);
    toggleTitle(id, titleId);
    setNewName("");
    setCreating(false);
  }

  return (
    <div className="relative">
      <Button variant="outline" size="sm" onClick={() => setOpen((v) => !v)}>
        <FolderPlus className="h-3.5 w-3.5" /> Add to Collection
      </Button>
      {open && (
        <>
          <div className="fixed inset-0 z-40" onClick={() => setOpen(false)} />
          <div className="glass-panel absolute left-0 top-full z-50 mt-2 w-56 space-y-1 rounded-xl p-2">
            {collections.length === 0 && !creating && (
              <p className="px-2 py-1 text-xs text-muted-foreground">No collections yet.</p>
            )}
            {collections.map((c) => {
              const has = c.titleIds.includes(titleId);
              return (
                <button
                  key={c.id}
                  onClick={() => toggleTitle(c.id, titleId)}
                  className={cn(
                    "flex w-full items-center justify-between rounded-lg px-2 py-1.5 text-left text-xs hover:bg-[hsl(var(--foreground)/0.06)]",
                    has && "text-accent"
                  )}
                >
                  {c.name}
                  {has && <Check className="h-3.5 w-3.5" />}
                </button>
              );
            })}
            {creating ? (
              <input
                autoFocus
                value={newName}
                onChange={(e) => setNewName(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && submitNewCollection()}
                onBlur={submitNewCollection}
                placeholder="Collection name"
                className="w-full rounded-lg border border-[hsl(var(--foreground)/0.15)] bg-transparent px-2 py-1.5 text-xs focus:outline-none"
              />
            ) : (
              <button
                onClick={() => setCreating(true)}
                className="flex w-full items-center gap-1.5 rounded-lg px-2 py-1.5 text-left text-xs text-muted-foreground hover:bg-[hsl(var(--foreground)/0.06)] hover:text-accent"
              >
                <Plus className="h-3.5 w-3.5" /> New collection
              </button>
            )}
          </div>
        </>
      )}
    </div>
  );
}
