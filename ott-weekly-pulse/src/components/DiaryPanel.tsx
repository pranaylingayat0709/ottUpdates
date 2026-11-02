"use client";
import { useEffect, useState } from "react";
import Link from "next/link";
import { BookOpen, Check } from "lucide-react";
import type { Title } from "@/lib/types";
import { useDiaryStore } from "@/hooks/useDiaryStore";
import { useWatchedStore } from "@/hooks/useWatchedStore";
import { HalfStarRating } from "@/components/HalfStarRating";
import { Button } from "@/components/ui/button";

// "Log it" panel on the detail view: a private half-star rating + note that
// lands in /diary and also marks the title watched.
export function DiaryPanel({ title }: { title: Title }) {
  const entry = useDiaryStore((s) => s.entries.find((e) => e.id === title.id));
  const save = useDiaryStore((s) => s.save);
  const watched = useWatchedStore((s) => s.items.some((i) => i.id === title.id));
  const toggleWatched = useWatchedStore((s) => s.toggle);

  const [rating, setRating] = useState(entry?.rating ?? 0);
  const [note, setNote] = useState(entry?.note ?? "");
  const [justSaved, setJustSaved] = useState(false);

  useEffect(() => {
    setRating(entry?.rating ?? 0);
    setNote(entry?.note ?? "");
  }, [entry?.id]); // eslint-disable-line react-hooks/exhaustive-deps

  function submit() {
    save({ id: title.id, title: title.title, posterUrl: title.posterUrl, genres: title.genres, cast: title.cast, rating, note });
    if (!watched) toggleWatched({ id: title.id, title: title.title, posterUrl: title.posterUrl });
    setJustSaved(true);
    setTimeout(() => setJustSaved(false), 1800);
  }

  return (
    <div className="glass-panel space-y-3 p-3">
      <div className="flex items-center justify-between">
        <h4 className="flex items-center gap-2 text-sm font-bold"><BookOpen className="h-4 w-4 text-accent" /> Your diary</h4>
        <Link href="/diary" className="text-[11px] text-accent hover:underline">Open diary</Link>
      </div>
      <HalfStarRating value={rating} onChange={setRating} />
      <label className="block">
        <span className="sr-only">Private note</span>
        <textarea
          value={note}
          onChange={(e) => setNote(e.target.value)}
          maxLength={1000}
          rows={2}
          placeholder="A private note — what did you think?"
          className="w-full resize-none rounded-xl border bg-transparent p-2.5 text-xs"
          style={{ borderColor: "hsl(var(--foreground) / 0.15)" }}
        />
      </label>
      <div className="flex items-center gap-2">
        <Button size="sm" onClick={submit}>{entry ? "Update entry" : "Log to diary"}</Button>
        {justSaved && <span className="flex items-center gap-1 text-xs text-emerald-400" aria-live="polite"><Check className="h-3.5 w-3.5" /> Saved</span>}
      </div>
    </div>
  );
}
