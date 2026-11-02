"use client";
import { Layers } from "lucide-react";
import type { Title } from "@/lib/types";
import { Rail } from "@/components/Rail";
import { useTitles, DEFAULT_TITLE_FILTERS } from "@/hooks/useTitles";

// Per-title "More Like This" — genre + cast overlap against the current
// week's catalog, distinct from the homepage's watchlist-driven
// RecommendedForYou (this one is anchored to whichever title you're
// currently looking at, standard on any streaming guide detail page).
//
// Uses the SAME useTitles hook + default-filters shape as the homepage
// dashboard, rather than its own ad-hoc fetch — when you open a title's
// detail view from the homepage (the common case), this query key
// matches one TanStack Query already has cached, so it reads instantly
// from cache instead of firing a second, functionally-identical network
// request for the same week's full catalog.
export function MoreLikeThis({ current }: { current: Title }) {
  const { data } = useTitles(current.weekId, DEFAULT_TITLE_FILTERS);
  const titles = data?.titles ?? [];

  const similar = titles
    .filter((t) => t.id !== current.id)
    .map((t) => {
      const genreOverlap = t.genres.filter((g) => current.genres.includes(g)).length;
      const castOverlap = t.cast.filter((c) => current.cast.includes(c)).length;
      return { title: t, score: genreOverlap + castOverlap * 3 };
    })
    .filter((x) => x.score > 0)
    .sort((a, b) => b.score - a.score)
    .slice(0, 10)
    .map((x) => x.title);

  if (similar.length === 0) return null;

  return <Rail title="More like this" icon={<Layers className="h-4 w-4 text-accent" />} titles={similar} />;
}
