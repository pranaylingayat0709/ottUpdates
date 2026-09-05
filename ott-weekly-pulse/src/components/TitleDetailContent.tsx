"use client";
import Link from "next/link";
import { useEffect } from "react";
import { Bookmark, BellRing, CheckCircle2, Clapperboard, ExternalLink, Film, Languages, Tv2 } from "lucide-react";
import type { Title } from "@/lib/types";
import { PLATFORM_LABELS, GENRE_LABELS } from "@/lib/types";
import { formatStartingPrice } from "@/lib/platform-pricing";
import { cn, formatRuntime } from "@/lib/utils";
import { EditorialBadgePill } from "@/components/EditorialBadgePill";
import { PosterImage } from "@/components/PosterImage";
import { RatingRow } from "@/components/RatingRow";
import { AiVerdictCard } from "@/components/AiVerdictCard";
import { CriticsTakeCard } from "@/components/CriticsTakeCard";
import { MoreLikeThis } from "@/components/MoreLikeThis";
import { ReviewsSection } from "@/components/ReviewsSection";
import { Button } from "@/components/ui/button";
import { useWatchlistStore } from "@/hooks/useWatchlistStore";
import { useReminderStore } from "@/hooks/useReminderStore";
import { useWatchedStore } from "@/hooks/useWatchedStore";
import { useRecentlyViewedStore } from "@/hooks/useRecentlyViewedStore";
import { useI18n } from "@/components/LanguageProvider";
import { useTrailerPlayer } from "@/hooks/useTrailerPlayer";
import { getTrailerAction } from "@/lib/youtube";
import { subscribeForTitle } from "@/hooks/usePushNotifications";
import { ShareButton } from "@/components/ShareButton";
import { format } from "date-fns";

export function TitleDetailContent({ title }: { title: Title }) {
  const saved = useWatchlistStore((s) => s.isSaved(title.id));
  const toggle = useWatchlistStore((s) => s.toggle);
  const reminded = useReminderStore((s) => s.isReminded(title.id));
  const playTrailer = useTrailerPlayer((s) => s.play);
  const toggleReminder = useReminderStore((s) => s.toggle);
  const watched = useWatchedStore((s) => s.isWatched(title.id));
  const toggleWatched = useWatchedStore((s) => s.toggle);
  const { t } = useI18n();
  const recordView = useRecentlyViewedStore((s) => s.record);

  const isUpcoming = new Date(title.releaseDate) > new Date();

  useEffect(() => {
    if (!isUpcoming) recordView({ id: title.id, title: title.title, posterUrl: title.posterUrl });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [title.id]);

  return (
    <div>
      <div className="relative aspect-[16/8] w-full sm:aspect-[16/6]">
        <PosterImage src={title.backdropUrl || title.posterUrl} alt={title.title} fill className="object-cover" priority label="Image not available" />
        <div className="absolute inset-0 bg-gradient-to-t from-card via-card/60 to-transparent" />
      </div>

      {/* Only the poster thumbnail overlaps the backdrop (its own small
          negative margin, for the visual flourish) — the badges/title/
          metadata sit in normal flow with regular top padding, never
          sharing that negative-margin coordinate space. This is
          deliberate: an earlier version applied the negative margin to
          the whole row (poster + text together), and the text ended up
          partially clipped behind the backdrop's gradient at certain
          content lengths. Keep these decoupled. */}
      <div className="flex gap-4 px-5 pt-4 sm:px-8">
        <div className="-mt-16 hidden shrink-0 sm:-mt-20 sm:block">
          <PosterImage
            src={title.posterUrl}
            alt={title.title}
            width={120}
            height={180}
            className="rounded-xl border-2 border-card object-cover shadow-xl"
          />
        </div>
        <div className="min-w-0 flex-1">
          <div className="mb-2 flex flex-wrap gap-1.5">
            {title.editorialBadges.map((b) => <EditorialBadgePill key={b} badge={b} />)}
            {isUpcoming && <span className="badge-pill bg-gradient-to-r from-sky-400 to-blue-500 text-white">Coming Soon</span>}
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
            {title.type === "MOVIE"
              ? formatRuntime(title.runtimeMinutes) || "Runtime unavailable"
              : `${title.totalEpisodes ? `${title.totalEpisodes} episodes` : "Episode count unavailable"}${title.seasonNumber ? ` · Season ${title.seasonNumber}` : ""}`}
          </span>
          {title.genres.map((g) => (
            <Link key={g} href={`/genre/${g.toLowerCase().replace(/_/g, "-")}`} className="chip hover:border-accent/50 hover:text-accent">
              {GENRE_LABELS[g] ?? g}
            </Link>
          ))}
        </div>

        <RatingRow title={title} />

        <div>
          <h4 className="mb-1.5 text-sm font-bold">Synopsis</h4>
          <p className="text-sm leading-relaxed text-muted-foreground">{title.synopsis}</p>
        </div>

        {title.cast.length > 0 && (
          <div>
            <h4 className="mb-1.5 text-sm font-bold">Cast</h4>
            <p className="text-sm text-muted-foreground">
              {title.cast.map((name, i) => (
                <span key={name}>
                  <Link href={`/person/${encodeURIComponent(name)}`} className="hover:text-accent hover:underline">
                    {name}
                  </Link>
                  {i < title.cast.length - 1 ? ", " : ""}
                </span>
              ))}
              {title.director && (
                <>
                  {title.cast.length > 0 ? " · " : ""}Dir.{" "}
                  <Link href={`/person/${encodeURIComponent(title.director)}`} className="hover:text-accent hover:underline">
                    {title.director}
                  </Link>
                </>
              )}
            </p>
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
            {!isUpcoming &&
              title.platforms.map((p) => (
                <a
                  key={p}
                  href={title.platformDeepLinks[p] ?? "#"}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1.5 rounded-full bg-gradient-to-r from-primary to-accent px-4 py-2 text-xs font-semibold text-white shadow-md shadow-primary/20 hover:opacity-90"
                >
                  {t("title.watchOn")} {PLATFORM_LABELS[p] ?? p}
                  {formatStartingPrice(p) && <span className="opacity-75">· {formatStartingPrice(p)}*</span>}
                  <ExternalLink className="h-3 w-3" />
                </a>
              ))}

            <button
              onClick={() => {
                const action = getTrailerAction(title.title, title.trailerUrl);
                if (action.kind === "play") playTrailer(action.videoId, title.title);
                else window.open(action.url, "_blank", "noopener,noreferrer");
              }}
              className="inline-flex items-center gap-1.5 rounded-full border border-[hsl(var(--foreground)/0.12)] bg-[hsl(var(--foreground)/0.02)] px-4 py-2 text-xs font-semibold hover:bg-[hsl(var(--foreground)/0.07)]"
            >
              <Film className="h-3.5 w-3.5" /> {title.trailerUrl ? t("title.watchTrailer") : t("title.searchTrailer")}
            </button>

            {isUpcoming ? (
              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  toggleReminder({ id: title.id, title: title.title });
                  // Best-effort: also try to register a real browser push
                  // notification, in addition to the in-app banner. Fails
                  // silently if push isn't supported/configured/permitted.
                  if (!reminded) subscribeForTitle(title.title);
                }}
                className={cn(reminded && "border-accent/50 text-accent")}
              >
                <BellRing className={cn("h-3.5 w-3.5", reminded && "fill-current")} />
                {reminded ? t("title.reminderSet") : t("title.notifyMe")}
              </Button>
            ) : (
              <Button
                variant="outline"
                size="sm"
                onClick={() => toggle(title.id)}
                className={cn(saved && "border-accent/50 text-accent")}
              >
                <Bookmark className={cn("h-3.5 w-3.5", saved && "fill-current")} /> {saved ? t("title.saved") : t("title.addToWatchlist")}
              </Button>
            )}
            {!isUpcoming && (
              <Button
                variant="outline"
                size="sm"
                onClick={() => toggleWatched({ id: title.id, title: title.title, posterUrl: title.posterUrl })}
                className={cn(watched && "border-emerald-500/50 text-emerald-400")}
              >
                <CheckCircle2 className={cn("h-3.5 w-3.5", watched && "fill-current")} /> {watched ? "Watched" : "Mark as Watched"}
              </Button>
            )}
            <ShareButton title={title.title} url={typeof window !== "undefined" ? `${window.location.origin}/title/${title.id}` : `/title/${title.id}`} />
          </div>
          {!isUpcoming && title.platforms.some((p) => formatStartingPrice(p)) && (
            <p className="mt-2 text-[10px] text-muted-foreground/70">*Approximate starting price, varies by plan/promo — check the platform directly for current pricing.</p>
          )}
        </div>

        {!isUpcoming && <AiVerdictCard titleId={title.id} fallbackWatch={title.aiVerdictWatch} fallbackSkip={title.aiVerdictSkip} />}
        {!isUpcoming && <CriticsTakeCard titleId={title.id} />}
        {!isUpcoming && <MoreLikeThis current={title} />}

        {!isUpcoming && <ReviewsSection titleId={title.id} />}
      </div>
    </div>
  );
}
