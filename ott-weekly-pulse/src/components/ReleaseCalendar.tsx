"use client";
import { useState } from "react";
import { format, isSameDay } from "date-fns";
import type { Title } from "@/lib/types";
import { cn } from "@/lib/utils";
import { TitleCard } from "@/components/TitleCard";
import { CalendarRange } from "lucide-react";

export function ReleaseCalendar({ titles }: { titles: Title[] }) {
  const days = Array.from(
    new Map(titles.map((t) => [new Date(t.releaseDate).toDateString(), new Date(t.releaseDate)])).values()
  ).sort((a, b) => a.getTime() - b.getTime());

  const [activeDay, setActiveDay] = useState<Date | null>(null);

  const visible = activeDay ? titles.filter((t) => isSameDay(new Date(t.releaseDate), activeDay)) : titles;

  return (
    <section className="mb-12">
      <h2 className="mb-4 flex items-center gap-2 font-display text-xl font-bold tracking-tight sm:text-2xl">
        <CalendarRange className="h-5 w-5 text-accent" /> Release Calendar
      </h2>

      <div className="mb-6 grid grid-cols-7 gap-1.5 sm:gap-2">
        {days.map((day) => {
          const count = titles.filter((t) => isSameDay(new Date(t.releaseDate), day)).length;
          const isActive = activeDay && isSameDay(activeDay, day);
          return (
            <button
              key={day.toISOString()}
              onClick={() => setActiveDay(isActive ? null : day)}
              className={cn(
                "glass-panel flex flex-col items-center gap-0.5 rounded-xl py-2.5 transition-colors sm:py-3",
                isActive ? "border-accent/60 bg-accent/10" : "hover:bg-white/5"
              )}
            >
              <span className="text-[10px] uppercase tracking-wide text-muted-foreground">{format(day, "EEE")}</span>
              <span className="text-base font-bold sm:text-lg">{format(day, "d")}</span>
              <span className="text-[10px] text-muted-foreground">{count} title{count !== 1 ? "s" : ""}</span>
            </button>
          );
        })}
      </div>

      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5">
        {visible.map((t) => <TitleCard key={t.id} title={t} />)}
        {visible.length === 0 && (
          <p className="col-span-full py-10 text-center text-sm text-muted-foreground">No releases match this filter.</p>
        )}
      </div>
    </section>
  );
}
