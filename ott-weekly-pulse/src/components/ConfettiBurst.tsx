"use client";
import { AnimatePresence, motion } from "framer-motion";

const COLORS = ["#f59e0b", "#ef4444", "#22c55e", "#3b82f6", "#ec4899", "#a855f7"];
const PARTICLES = Array.from({ length: 14 }, (_, i) => {
  const angle = (i / 14) * Math.PI * 2;
  return { angle, color: COLORS[i % COLORS.length], distance: 34 + (i % 3) * 10 };
});

// A small CSS/SVG-only particle burst (no external confetti library) —
// a dozen-odd dots flying outward and fading, centered on whatever
// wraps it. Used as a one-shot celebration when marking a title watched.
export function ConfettiBurst({ show }: { show: boolean }) {
  return (
    <AnimatePresence>
      {show && (
        <div className="pointer-events-none absolute inset-0 z-20 flex items-center justify-center">
          {PARTICLES.map((p, i) => (
            <motion.span
              key={i}
              initial={{ x: 0, y: 0, opacity: 1, scale: 1 }}
              animate={{
                x: Math.cos(p.angle) * p.distance,
                y: Math.sin(p.angle) * p.distance,
                opacity: 0,
                scale: 0.4
              }}
              transition={{ duration: 0.7, ease: "easeOut" }}
              className="absolute h-1.5 w-1.5 rounded-full"
              style={{ backgroundColor: p.color }}
            />
          ))}
        </div>
      )}
    </AnimatePresence>
  );
}
