"use client";
import { useCallback, useEffect, useRef, useState, type ReactNode } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { TitleCard } from "@/components/TitleCard";
import { ErrorBoundary } from "@/components/ErrorBoundary";
import type { Title } from "@/lib/types";
import { cn } from "@/lib/utils";

// A Netflix-style horizontal shelf: a heading, a snap-scrolling row of
// poster cards, and prev/next arrows that appear on desktop when there's
// more to scroll in that direction (touch devices just swipe). The scroller
// is a labelled region so screen-reader and keyboard users can reach every
// card with Tab, and the arrows are real buttons.
export function Rail({
  title,
  subtitle,
  icon,
  titles,
  caption
}: {
  title: string;
  subtitle?: string;
  icon?: ReactNode;
  titles: Title[];
  /** Optional per-card caption line (e.g. "Because you saved X"). */
  caption?: (t: Title) => string | null;
}) {
  const scroller = useRef<HTMLDivElement>(null);
  const [canLeft, setCanLeft] = useState(false);
  const [canRight, setCanRight] = useState(false);

  const update = useCallback(() => {
    const el = scroller.current;
    if (!el) return;
    setCanLeft(el.scrollLeft > 4);
    setCanRight(el.scrollLeft + el.clientWidth < el.scrollWidth - 4);
  }, []);

  useEffect(() => {
    update();
    const el = scroller.current;
    if (!el) return;
    el.addEventListener("scroll", update, { passive: true });
    const ro = new ResizeObserver(update);
    ro.observe(el);
    return () => {
      el.removeEventListener("scroll", update);
      ro.disconnect();
    };
  }, [update, titles.length]);

  function scrollBy(dir: 1 | -1) {
    const el = scroller.current;
    if (!el) return;
    el.scrollBy({ left: dir * el.clientWidth * 0.85, behavior: "smooth" });
  }

  if (titles.length === 0) return null;

  return (
    <section className="group/rail relative mb-9" aria-label={title}>
      <div className="mb-3 flex items-end justify-between gap-3">
        <div className="min-w-0">
          <h3 className="flex items-center gap-2 font-display text-lg font-bold tracking-tight sm:text-xl">
            {icon}
            <span className="truncate">{title}</span>
            <span className="rounded-full bg-[hsl(var(--foreground)/0.07)] px-2 py-0.5 text-[11px] font-medium text-muted-foreground">
              {titles.length}
            </span>
          </h3>
          {subtitle && <p className="mt-0.5 text-xs text-muted-foreground">{subtitle}</p>}
        </div>
      </div>

      <div className="relative">
        <div
          ref={scroller}
          role="region"
          aria-label={`${title} — scroll horizontally`}
          className="no-scrollbar -mx-1 flex snap-x snap-proximity gap-3 overflow-x-auto scroll-smooth px-1 pb-3 pt-1.5"
        >
          {titles.map((t) => {
            const cap = caption?.(t);
            return (
              <div key={t.id} className="w-[8.5rem] shrink-0 snap-start sm:w-44 lg:w-48">
                <ErrorBoundary fallbackLabel="">
                  <TitleCard title={t} />
                </ErrorBoundary>
                {cap && <p className="mt-1.5 line-clamp-1 text-[11px] text-muted-foreground">{cap}</p>}
              </div>
            );
          })}
        </div>

        {(["left", "right"] as const).map((side) => {
          const visible = side === "left" ? canLeft : canRight;
          return (
            <button
              key={side}
              onClick={() => scrollBy(side === "left" ? -1 : 1)}
              aria-label={side === "left" ? `Scroll ${title} left` : `Scroll ${title} right`}
              tabIndex={visible ? 0 : -1}
              className={cn(
                "absolute top-1/2 z-10 hidden h-10 w-10 -translate-y-1/2 items-center justify-center rounded-full border bg-background/90 shadow-lg backdrop-blur transition-all hover:scale-110 sm:flex",
                side === "left" ? "-left-3" : "-right-3",
                visible ? "opacity-0 group-hover/rail:opacity-100 focus-visible:opacity-100" : "pointer-events-none opacity-0"
              )}
              style={{ borderColor: "hsl(var(--foreground) / 0.12)" }}
            >
              {side === "left" ? <ChevronLeft className="h-5 w-5" /> : <ChevronRight className="h-5 w-5" />}
            </button>
          );
        })}
      </div>
    </section>
  );
}
