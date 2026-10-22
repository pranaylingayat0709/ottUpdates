"use client";
import { useMemo } from "react";
import { Award, Clapperboard, Flame, Languages, Layers, Tv, Zap } from "lucide-react";
import { LeavingSoon } from "@/components/LeavingSoon";
import { Rail } from "@/components/Rail";
import { useMyPlatformsStore } from "@/hooks/useMyPlatformsStore";
import { useViewPreferences, sortTitles } from "@/hooks/useViewPreferences";
import { GENRE_LABELS, PLATFORM_LABELS, type Genre, type Title } from "@/lib/types";

// Builds the shelves for the "Discover" (rails) view out of whatever list
// it's handed — already scoped by day strip / My Platforms by the caller.
// Every shelf is derived from real fields on the titles (platform, badge,
// language, type, genre, runtime, episodes); nothing is invented. Shelves
// with fewer than two titles are skipped so the page never shows a lonely
// one-card row, except the primary ones the user is likely to look for.
export function RailsView({ titles }: { titles: Title[] }) {
  const myPlatforms = useMyPlatformsStore((s) => s.platforms);
  const sortMode = useViewPreferences((s) => s.sortMode);

  const rails = useMemo(() => {
    const sort = (list: Title[]) => sortTitles(list, sortMode);
    const out: { key: string; title: string; subtitle?: string; icon: React.ReactNode; titles: Title[] }[] = [];

    if (myPlatforms.length > 0) {
      const mine = titles.filter((t) => t.platforms.some((p) => myPlatforms.includes(p)));
      if (mine.length > 0) {
        out.push({
          key: "mine",
          title: "New on your platforms",
          subtitle: myPlatforms.slice(0, 3).map((p) => PLATFORM_LABELS[p]).join(", ") + (myPlatforms.length > 3 ? ` +${myPlatforms.length - 3}` : ""),
          icon: <Zap className="h-4.5 w-4.5 text-accent" />,
          titles: sort(mine)
        });
      }
    }

    const picks = titles.filter((t) => t.isMustWatch || t.editorialBadges.includes("CRITIC_PICK"));
    if (picks.length >= 2) out.push({ key: "picks", title: "Critic picks", icon: <Award className="h-4.5 w-4.5 text-accent" />, titles: sort(picks) });

    const indian = titles.filter((t) => t.originalLanguage === "HINDI" || t.originalLanguage === "MARATHI");
    if (indian.length >= 2) out.push({ key: "indian", title: "Hindi & Marathi", subtitle: "Made in India", icon: <Languages className="h-4.5 w-4.5 text-accent" />, titles: sort(indian) });

    const movies = titles.filter((t) => t.type === "MOVIE");
    if (movies.length >= 1) out.push({ key: "movies", title: "New movies", icon: <Clapperboard className="h-4.5 w-4.5 text-accent" />, titles: sort(movies) });

    const series = titles.filter((t) => t.type === "SERIES");
    if (series.length >= 1) out.push({ key: "series", title: "New web series", icon: <Tv className="h-4.5 w-4.5 text-accent" />, titles: sort(series) });

    const binge = titles.filter((t) => t.type === "SERIES" && (t.totalEpisodes ?? 0) >= 6);
    if (binge.length >= 2) out.push({ key: "binge", title: "Binge-worthy", subtitle: "Series with 6+ episodes", icon: <Flame className="h-4.5 w-4.5 text-accent" />, titles: sort(binge) });

    // Top genre shelves: the three most common genres this week with 3+ titles.
    const counts = new Map<Genre, number>();
    for (const t of titles) for (const g of t.genres) counts.set(g, (counts.get(g) ?? 0) + 1);
    [...counts.entries()]
      .filter(([, n]) => n >= 3)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 3)
      .forEach(([g]) => {
        out.push({
          key: `genre-${g}`,
          title: GENRE_LABELS[g],
          icon: <Layers className="h-4.5 w-4.5 text-accent" />,
          titles: sort(titles.filter((t) => t.genres.includes(g)))
        });
      });

    const documentaries = titles.filter((t) => t.type === "DOCUMENTARY");
    if (documentaries.length >= 1) out.push({ key: "docs", title: "Documentaries", icon: <Layers className="h-4.5 w-4.5 text-accent" />, titles: sort(documentaries) });

    return out;
  }, [titles, myPlatforms, sortMode]);

  if (rails.length === 0) return null;

  return (
    <div>
      {rails.map((r) => (
        <Rail key={r.key} title={r.title} subtitle={r.subtitle} icon={r.icon} titles={r.titles} />
      ))}
      <LeavingSoon />
    </div>
  );
}
