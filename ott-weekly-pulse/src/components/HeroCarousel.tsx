"use client";
import useEmblaCarousel from "embla-carousel-react";
import { useCallback, useEffect, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { ChevronLeft, ChevronRight, Film, PlayCircle, Star } from "lucide-react";
import type { Title } from "@/lib/types";
import { PLATFORM_LABELS } from "@/lib/types";
import { EditorialBadgePill } from "@/components/EditorialBadgePill";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { TitleModal } from "@/components/TitleModal";
import { PosterImage } from "@/components/PosterImage";
import { useI18n } from "@/components/LanguageProvider";
import { useTrailerPlayer } from "@/hooks/useTrailerPlayer";
import { getTrailerAction } from "@/lib/youtube";

export function HeroCarousel({ titles }: { titles: Title[] }) {
  const [emblaRef, emblaApi] = useEmblaCarousel({ loop: true });
  const [selected, setSelected] = useState(0);
  const [activeTitleId, setActiveTitleId] = useState<string | null>(null);
  const { t } = useI18n();
  const playTrailer = useTrailerPlayer((s) => s.play);

  const scrollPrev = useCallback(() => emblaApi?.scrollPrev(), [emblaApi]);
  const scrollNext = useCallback(() => emblaApi?.scrollNext(), [emblaApi]);

  useEffect(() => {
    if (!emblaApi) return;
    const onSelect = () => setSelected(emblaApi.selectedScrollSnap());
    emblaApi.on("select", onSelect);
    onSelect();
  }, [emblaApi]);

  useEffect(() => {
    if (!emblaApi) return;
    const id = setInterval(() => emblaApi.scrollNext(), 6500);
    return () => clearInterval(id);
  }, [emblaApi]);

  if (titles.length === 0) return null;
  const activeTitle = titles[selected];

  return (
    <motion.section
      className="relative -mx-4 mb-10 overflow-hidden sm:-mx-6 lg:-mx-8"
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
    >
      <div className="mb-4 flex items-center justify-between px-4 sm:px-6 lg:px-8">
        <h2 className="font-display text-xl font-bold tracking-tight sm:text-3xl">
          {t("hero.headingPrefix")} <span className="text-gradient">{t("hero.headingSuffix")}</span>
        </h2>
        <div className="hidden gap-2 sm:flex">
          <Button variant="outline" size="icon" onClick={scrollPrev} aria-label="Previous">
            <ChevronLeft className="h-4 w-4" />
          </Button>
          <Button variant="outline" size="icon" onClick={scrollNext} aria-label="Next">
            <ChevronRight className="h-4 w-4" />
          </Button>
        </div>
      </div>

      <div className="overflow-hidden" ref={emblaRef}>
        <div className="flex">
          {titles.map((title, i) => (
            <div key={title.id} className="relative min-w-0 flex-[0_0_100%] px-4 sm:px-6 lg:px-8">
              <div className="relative aspect-[16/10] w-full overflow-hidden rounded-3xl border border-[hsl(var(--foreground)/0.1)] sm:aspect-[21/9]">
                <div className={cn("absolute inset-0", selected === i && "animate-[kenburns_9s_ease-out_forwards]")}>
                  <PosterImage
                    src={title.backdropUrl || title.posterUrl}
                    alt={title.title}
                    fill
                    priority={i === 0}
                    sizes="100vw"
                    className="object-cover"
                    label="Image not available"
                  />
                </div>
                <div className="absolute inset-0 bg-gradient-to-t from-black via-black/50 to-transparent" />
                <div className="absolute inset-0 bg-gradient-to-r from-black/70 via-black/10 to-transparent" />

                <AnimatePresence mode="wait">
                  {selected === i && (
                    <motion.div
                      key={title.id}
                      className="absolute inset-x-0 bottom-0 flex flex-col gap-3 p-5 sm:p-8 md:max-w-xl"
                      initial={{ opacity: 0, y: 24 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -12 }}
                      transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
                    >
                      <div className="flex flex-wrap gap-2">
                        {title.editorialBadges.map((b) => (
                          <EditorialBadgePill key={b} badge={b} />
                        ))}
                      </div>
                      <h3 className="font-display text-3xl font-extrabold leading-[1.05] tracking-tight text-white sm:text-5xl">
                        {title.title}
                      </h3>
                      <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-white/80 sm:text-sm">
                        {title.imdbRating && (
                          <span className="flex items-center gap-1 font-semibold text-yellow-400">
                            <Star className="h-3.5 w-3.5 fill-yellow-400" /> {title.imdbRating} IMDb
                          </span>
                        )}
                        <span>{title.originalLanguage.charAt(0) + title.originalLanguage.slice(1).toLowerCase()}</span>
                        <span>·</span>
                        <span>{title.platforms.map((p) => PLATFORM_LABELS[p]).join(", ")}</span>
                      </div>
                      <p className="line-clamp-2 text-sm text-white/70 sm:text-base">{title.synopsis}</p>
                      <div className="mt-1 flex gap-3">
                        <Button size="lg" onClick={() => setActiveTitleId(title.id)}>
                          <PlayCircle className="h-4 w-4" /> {t("title.viewDetails")}
                        </Button>
                        <Button
                          size="lg"
                          variant="outline"
                          onClick={(e) => {
                            e.stopPropagation();
                            const action = getTrailerAction(title.title, title.trailerUrl);
                            if (action.kind === "play") playTrailer(action.videoId, title.title);
                            else window.open(action.url, "_blank", "noopener,noreferrer");
                          }}
                        >
                          <Film className="h-4 w-4" />
                          {title.trailerUrl ? t("title.watchTrailer") : t("title.searchTrailer")}
                        </Button>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className="mt-4 flex justify-center gap-1.5">
        {titles.map((_, i) => (
          <button
            key={i}
            onClick={() => emblaApi?.scrollTo(i)}
            className={cn("h-1.5 rounded-full transition-all duration-300", selected === i ? "w-6 bg-accent" : "w-1.5 bg-[hsl(var(--foreground)/0.2)]")}
            aria-label={`Go to slide ${i + 1}`}
          />
        ))}
      </div>

      <TitleModal titleId={activeTitleId} open={!!activeTitleId} onOpenChange={(v) => !v && setActiveTitleId(null)} />
    </motion.section>
  );
}
