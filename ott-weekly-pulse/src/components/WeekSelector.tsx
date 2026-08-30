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
            className={cn("chip shrink-0 whitespace-nowrap", active && "chip-active")}
            variants={{ hidden: { opacity: 0, y: 8 }, visible: { opacity: 1, y: 0 } }}
          >
            {w.isCurrent ? "This Week" : isFuture ? "Coming Up" : w.label}
            {(w.isCurrent || isFuture) && <span className="ml-1 opacity-70">· {w.label}</span>}
          </motion.button>
        );
      })}
    </motion.div>
  );
}
