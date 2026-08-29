"use client";
import { useWeeks } from "@/hooks/useTitles";
import { cn } from "@/lib/utils";
import { CalendarDays } from "lucide-react";

export function WeekSelector({ weekId, onChange }: { weekId?: string; onChange: (id: string) => void }) {
  const { data: weeks = [], isLoading } = useWeeks();

  if (isLoading) {
    return <div className="skeleton mb-6 h-11 w-full rounded-full" />;
  }

  return (
    <div className="mb-6 flex items-center gap-2 overflow-x-auto scrollbar-thin pb-1">
      <CalendarDays className="h-4 w-4 shrink-0 text-muted-foreground" />
      {weeks.map((w) => {
        const active = (weekId ?? weeks.find((x) => x.isCurrent)?.id) === w.id;
        const isFuture = new Date(w.weekStartDate) > new Date() && !w.isCurrent;
        return (
          <button
            key={w.id}
            onClick={() => onChange(w.id)}
            className={cn("chip shrink-0 whitespace-nowrap", active && "chip-active")}
          >
            {w.isCurrent ? "This Week" : isFuture ? "Coming Up" : w.label}
            {(w.isCurrent || isFuture) && <span className="ml-1 opacity-70">· {w.label}</span>}
          </button>
        );
      })}
    </div>
  );
}
