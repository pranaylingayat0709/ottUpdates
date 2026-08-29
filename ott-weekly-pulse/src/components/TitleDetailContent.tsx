"use client";
import Image from "next/image";
import { Bookmark, Clapperboard, ExternalLink, Languages, Tv2 } from "lucide-react";
import type { Title } from "@/lib/types";
import { PLATFORM_LABELS, GENRE_LABELS } from "@/lib/types";
import { cn, formatRuntime } from "@/lib/utils";
import { EditorialBadgePill } from "@/components/EditorialBadgePill";
import { RatingRow } from "@/components/RatingRow";
import { AiVerdictCard } from "@/components/AiVerdictCard";
import { ReviewsSection } from "@/components/ReviewsSection";
import { Button } from "@/components/ui/button";
import { useWatchlistStore } from "@/hooks/useWatchlistStore";
import { format } from "date-fns";

export function TitleDetailContent({ title }: { title: Title }) {
  const saved = useWatchlistStore((s) => s.isSaved(title.id));
  const toggle = useWatchlistStore((s) => s.toggle);

  return (
    <div>
      <div className="relative aspect-[16/8] w-full sm:aspect-[16/6]">
        <Image src={title.backdropUrl ?? title.posterUrl} alt={title.title} fill className="object-cover" priority />
        <div className="absolute inset-0 bg-gradient-to-t from-card via-card/60 to-transparent" />
      </div>

      <div className="-mt-16 flex gap-4 px-5 sm:-mt-20 sm:px-8">
        <Image
          src={title.posterUrl}
          alt={title.title}
          width={120}
          height={180}
          className="hidden shrink-0 rounded-xl border-2 border-card object-cover shadow-xl sm:block"
        />
        <div className="min-w-0 flex-1 pt-2 sm:pt-16">
          <div className="mb-2 flex flex-wrap gap-1.5">
            {title.editorialBadges.map((b) => <EditorialBadgePill key={b} badge={b} />)}
          </div>
          <h2 className="font-display text-2xl font-extrabold leading-tight sm:text-3xl">{title.title}</h2>
          <p className="mt-1 text-xs text-muted-foreground">
            Released {format(new Date(title.releaseDate), "EEE, d MMM yyyy")}
            {title.director && <> · Dir. {title.director}</>}
          </p>
        </div>
      </div>

      <div className="space-y-6 px-5 pb-6 pt-4 sm:px-8">
        <div className="flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
          <span className="chip"><Clapperboard className="h-3 w-3" /> {title.type === "MOVIE" ? "Movie" : title.type === "SERIES" ? "Web Series" : "Documentary"}</span>
          <span className="chip">
            {title.type === "MOVIE" ? formatRuntime(title.runtimeMinutes) : `${title.totalEpisodes} episodes${title.seasonNumber ? ` · Season ${title.seasonNumber}` : ""}`}
          </span>
          {title.genres.map((g) => <span key={g} className="chip">{GENRE_LABELS[g]}</span>)}
        </div>

        <RatingRow title={title} />

        <div>
          <h4 className="mb-1.5 text-sm font-bold">Synopsis</h4>
          <p className="text-sm leading-relaxed text-muted-foreground">{title.synopsis}</p>
        </div>

        {title.cast.length > 0 && (
          <div>
            <h4 className="mb-1.5 text-sm font-bold">Cast</h4>
            <p className="text-sm text-muted-foreground">{title.cast.join(", ")}</p>
          </div>
        )}

        <div className="glass-panel space-y-2 p-3">
          <p className="flex items-center gap-2 text-xs font-semibold">
            <Languages className="h-3.5 w-3.5 text-accent" /> Language & Subtitles
          </p>
          <p className="text-xs text-muted-foreground">
            Audio: {title.availableAudioLanguages.join(" | ")}
            {title.isHindiDubbed && <span className="ml-2 chip !py-0.5 text-[10px]">Hindi Dubbed</span>}
          </p>
          <p className="text-xs text-muted-foreground">Subtitles: {title.subtitleLanguages.join(", ") || "—"}</p>
        </div>

        <div>
          <h4 className="mb-2 flex items-center gap-2 text-sm font-bold"><Tv2 className="h-4 w-4 text-accent" /> Where to Watch</h4>
          <div className="flex flex-wrap gap-2">
            {title.platforms.map((p) => (
              <a
                key={p}
                href={title.platformDeepLinks[p] ?? "#"}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1.5 rounded-full bg-gradient-to-r from-primary to-accent px-4 py-2 text-xs font-semibold text-white shadow-md shadow-primary/20 hover:opacity-90"
              >
                Watch on {PLATFORM_LABELS[p]} <ExternalLink className="h-3 w-3" />
              </a>
            ))}
            <Button
              variant="outline"
              size="sm"
              onClick={() => toggle(title.id)}
              className={cn(saved && "border-accent/50 text-accent")}
            >
              <Bookmark className={cn("h-3.5 w-3.5", saved && "fill-current")} /> {saved ? "Saved" : "Add to Watchlist"}
            </Button>
          </div>
        </div>

        <AiVerdictCard titleId={title.id} fallbackWatch={title.aiVerdictWatch} fallbackSkip={title.aiVerdictSkip} />

        <ReviewsSection titleId={title.id} />
      </div>
    </div>
  );
}
