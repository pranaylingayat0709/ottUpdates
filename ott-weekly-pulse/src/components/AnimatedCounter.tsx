"use client";
import { useEffect, useRef } from "react";
import { useMotionValue, useSpring } from "framer-motion";

/**
 * Counts up to `value` with a spring animation whenever `value` changes.
 *
 * Previously this only started animating once the element scrolled into
 * view (framer-motion's `useInView`, with `once: true`). That left the
 * badge frozen at its hardcoded initial "0" for any section that wasn't
 * immediately on-screen on load — e.g. the "New Movies This Week" / "New
 * Web Series This Week" counts further down the page — even though the
 * real list of titles right below it was rendering correctly. Confirmed
 * live: the hero's "New This Week" counter (above the fold, so inView
 * fired right away) showed the correct number, while the identical
 * component lower on the page stayed at "0" despite listing real titles.
 * Animating on mount instead — and server-rendering the real value as the
 * fallback text — fixes both the stuck-at-zero badge and the risk of it
 * ever showing a wrong number before the animation runs.
 */
export function AnimatedCounter({ value, className }: { value: number; className?: string }) {
  const ref = useRef<HTMLSpanElement>(null);
  const motionValue = useMotionValue(value);
  const spring = useSpring(motionValue, { stiffness: 120, damping: 20 });
  const hasMounted = useRef(false);

  useEffect(() => {
    if (!hasMounted.current) {
      // First render: snap straight to the value instead of counting up
      // from 0, since the server-rendered fallback below already shows
      // the correct number — no need to animate away from it on load.
      hasMounted.current = true;
      motionValue.jump(value);
      return;
    }
    motionValue.set(value);
  }, [value, motionValue]);

  useEffect(() => {
    return spring.on("change", (latest) => {
      if (ref.current) ref.current.textContent = Math.round(latest).toString();
    });
  }, [spring]);

  return <span ref={ref} className={className}>{value}</span>;
}
