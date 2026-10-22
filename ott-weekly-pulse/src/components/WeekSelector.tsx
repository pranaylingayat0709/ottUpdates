"use client";
import { motion } from "framer-motion";
import { useWeeks } from "@/hooks/useTitles";
import { cn } from "@/lib/utils";
import { CalendarDays } from "lucide-react";

export function WeekSelector({ weekId, onChange }: { weekId?: string; onChange: (id: string) => void }) {
  const { data: weeks = [], isLoading } = useWeeks();

  if (isLoading) {
    return <div className="skeleton mb-6 h-11 w-full rounded-full" />;
  }

  return (
    <motion.div
      className="mb-6 flex items-center gap-2 overflow-x-auto scrollbar-thin pb-1"
      initial="hidden"
      animate="visible"
      variants={{ visible: { transition: { staggerChildren: 0.04 } } }}
    >
      <CalendarDays className="h-4 w-4 shrink-0 text-muted-foreground" />
      {weeks.map((w) => {
        const active = (weekId ?? weeks.find((x) => x.isCurrent)?.id) === w.id;
        const isFuture = new Date(w.weekStartDate) > new Date() && !w.isCurrent;
        return (
          <motion.button
            key={w.id}
            onClick={() => onChange(w.id)}
            aria-pressed={active}
            className={cn("chip relative shrink-0 overflow-hidden whitespace-nowrap", active && "border-transparent !text-white")}
            variants={{ hidden: { opacity: 0, y: 8 }, visible: { opacity: 1, y: 0 } }}
          >
            {/* Shared-layout pill: the gradient glides from the old week
                chip to the newly selected one instead of snapping. */}
            {active && (
              <motion.span
                layoutId="week-pill"
                className="absolute inset-0 bg-gradient-to-r from-primary to-accent shadow-md shadow-primary/20"
                transition={{ type: "spring", stiffness: 420, damping: 34 }}
              />
            )}
            <span className="relative z-10">
              {w.isCurrent ? "This Week" : isFuture ? "Coming Up" : w.label}
              {(w.isCurrent || isFuture) && <span className="ml-1 opacity-70">· {w.label}</span>}
            </span>
          </motion.button>
        );
      })}
    </motion.div>
  );
}
