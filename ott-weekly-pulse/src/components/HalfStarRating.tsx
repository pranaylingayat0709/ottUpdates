"use client";
import { useState } from "react";
import { Star } from "lucide-react";
import { cn } from "@/lib/utils";

// Five stars with half-star precision. Each star has a left-half and a
// right-half click target; the whole control is an ARIA slider so keyboard
// (arrows, Home/End) and screen-reader users get the same 0.5-step control.
export function HalfStarRating({
  value,
  onChange,
  size = "md",
  readOnly = false
}: {
  value: number;
  onChange?: (v: number) => void;
  size?: "sm" | "md";
  readOnly?: boolean;
}) {
  const [hover, setHover] = useState<number | null>(null);
  const shown = hover ?? value;
  const px = size === "sm" ? "h-4 w-4" : "h-7 w-7";

  function onKeyDown(e: React.KeyboardEvent) {
    if (readOnly || !onChange) return;
    let next = value;
    if (e.key === "ArrowRight" || e.key === "ArrowUp") next = Math.min(5, value + 0.5);
    else if (e.key === "ArrowLeft" || e.key === "ArrowDown") next = Math.max(0, value - 0.5);
    else if (e.key === "Home") next = 0;
    else if (e.key === "End") next = 5;
    else return;
    e.preventDefault();
    onChange(next);
  }

  return (
    <div
      role="slider"
      tabIndex={readOnly ? -1 : 0}
      aria-label="Your rating"
      aria-valuemin={0}
      aria-valuemax={5}
      aria-valuenow={value}
      aria-valuetext={value ? `${value} out of 5 stars` : "Not rated"}
      aria-readonly={readOnly}
      onKeyDown={onKeyDown}
      onMouseLeave={() => setHover(null)}
      className="inline-flex items-center gap-0.5"
    >
      {[1, 2, 3, 4, 5].map((n) => {
        const fill = shown >= n ? 100 : shown >= n - 0.5 ? 50 : 0;
        return (
          <span key={n} className="relative inline-block">
            <Star className={cn(px, "text-[hsl(var(--foreground)/0.25)]")} />
            <span className="pointer-events-none absolute inset-0 overflow-hidden" style={{ width: `${fill}%` }}>
              <Star className={cn(px, "fill-yellow-400 text-yellow-400")} />
            </span>
            {!readOnly && onChange && (
              <>
                <button type="button" tabIndex={-1} aria-hidden className="absolute inset-y-0 left-0 w-1/2" onMouseEnter={() => setHover(n - 0.5)} onClick={() => onChange(value === n - 0.5 ? 0 : n - 0.5)} />
                <button type="button" tabIndex={-1} aria-hidden className="absolute inset-y-0 right-0 w-1/2" onMouseEnter={() => setHover(n)} onClick={() => onChange(value === n ? 0 : n)} />
              </>
            )}
          </span>
        );
      })}
    </div>
  );
}
