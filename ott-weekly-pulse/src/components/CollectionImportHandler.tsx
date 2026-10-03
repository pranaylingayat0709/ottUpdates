"use client";
import { useEffect, useState } from "react";
import { useSearchParams, useRouter, usePathname } from "next/navigation";
import { FolderInput, X } from "lucide-react";
import { useCollectionsStore } from "@/hooks/useCollectionsStore";

// Reads ?importCollection=<base64 comma-joined ids>&importName=<name> from
// the URL (set by ShareCollectionButton) and offers to save it as a new
// local collection. No backend involved — the whole "share" is just a URL
// carrying the title ids, decoded client-side by whoever opens the link.
export function CollectionImportHandler() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const pathname = usePathname();
  const createCollection = useCollectionsStore((s) => s.createCollection);
  const toggleTitle = useCollectionsStore((s) => s.toggleTitle);
  const [pending, setPending] = useState<{ name: string; ids: string[] } | null>(null);
  const [done, setDone] = useState(false);

  useEffect(() => {
    const raw = searchParams.get("importCollection");
    const name = searchParams.get("importName");
    if (!raw) return;
    try {
      const ids = atob(raw).split(",").filter(Boolean);
      if (ids.length > 0) setPending({ name: name ? decodeURIComponent(name) : "Shared Collection", ids });
    } catch {
      // malformed param — ignore silently, nothing to import
    }
  }, [searchParams]);

  function clearParam() {
    const params = new URLSearchParams(searchParams.toString());
    params.delete("importCollection");
    params.delete("importName");
    const qs = params.toString();
    router.replace(qs ? `${pathname}?${qs}` : pathname);
  }

  function importIt() {
    if (!pending) return;
    const id = createCollection(pending.name);
    pending.ids.forEach((titleId) => toggleTitle(id, titleId));
    setDone(true);
    clearParam();
    setTimeout(() => setPending(null), 2500);
  }

  function dismiss() {
    setPending(null);
    clearParam();
  }

  if (!pending) return null;

  return (
    <div className="fixed inset-x-4 bottom-20 z-50 mx-auto max-w-sm sm:bottom-6">
      <div className="glass-panel flex items-center gap-3 rounded-2xl p-3 shadow-xl">
        <FolderInput className="h-5 w-5 shrink-0 text-accent" />
        <div className="min-w-0 flex-1 text-xs">
          {done ? (
            <span className="font-medium text-emerald-400">Saved "{pending.name}" to your collections.</span>
          ) : (
            <>
              <p className="font-semibold">Import shared list?</p>
              <p className="text-muted-foreground">"{pending.name}" · {pending.ids.length} title{pending.ids.length !== 1 ? "s" : ""}</p>
            </>
          )}
        </div>
        {!done && (
          <div className="flex shrink-0 items-center gap-1.5">
            <button onClick={importIt} className="chip !py-1 text-xs">Import</button>
            <button onClick={dismiss} className="rounded-full p-1.5 text-muted-foreground hover:bg-[hsl(var(--foreground)/0.08)]" aria-label="Dismiss">
              <X className="h-3.5 w-3.5" />
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
