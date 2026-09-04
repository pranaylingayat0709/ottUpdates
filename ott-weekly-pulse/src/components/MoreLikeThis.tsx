"use client";
import { useQuery } from "@tanstack/react-query";
import { Layers } from "lucide-react";
import type { Title } from "@/lib/types";
import { TitleCard } from "@/components/TitleCard";
import { ErrorBoundary } from "@/components/ErrorBoundary";

// Per-title "More Like This" — genre + cast overlap against the current
// week's catalog, distinct from the homepage's watchlist-driven
// RecommendedForYou (this one is anchored to whichever title you're
// currently looking at, standard on any streaming guide detail page).
export function MoreLikeThis({ current }: { current: Title }) {
  const { data: titles = [] } = useQuery({
    queryKey: ["titles", current.weekId, "all"],
    queryFn: () => fetch(`/api/titles?weekId=${current.weekId}`).then((r) => r.json()).then((d) => d.titles as Title[])
  });

  const similar = titles
    .filter((t) => t.id !== current.id)
    .map((t) => {
      const genreOverlap = t.genres.filter((g) => current.genres.includes(g)).length;
      const castOverlap = t.cast.filter((c) => current.cast.includes(c)).length;
      return { title: t, score: genreOverlap + castOverlap * 3 };
    })
    .filter((x) => x.score > 0)
    .sort((a, b) => b.score - a.score)
    .slice(0, 5)
    .map((x) => x.title);

  if (similar.length === 0) return null;

  return (
    <div>
      <h4 className="mb-2 flex items-center gap-2 text-sm font-bold">
        <Layers className="h-4 w-4 text-accent" /> More Like This
      </h4>
      <div className="grid grid-cols-3 gap-2 sm:grid-cols-5">
        {similar.map((t) => (
          <ErrorBoundary key={t.id} fallbackLabel="">
            <TitleCard title={t} />
          </ErrorBoundary>
        ))}
      </div>
    </div>
  );
}
