"use client";
import { useQuery } from "@tanstack/react-query";
import { CalendarClock } from "lucide-react";
import { format, differenceInCalendarDays } from "date-fns";

interface Item { title: string; platform: string; leavesOn: string }

// "Leaving soon" strip. Renders nothing unless the API returns upcoming
// departures, so plans/regions without the data never see an empty box.
export function LeavingSoon() {
  const { data } = useQuery({
    queryKey: ["leaving-soon"],
    queryFn: async () => {
      const res = await fetch("/api/leaving");
      if (!res.ok) return [] as Item[];
      return ((await res.json()) as { items: Item[] }).items;
    },
    staleTime: 6 * 60 * 60 * 1000
  });

  const today = new Date();
  const items = (data ?? []).filter((i) => differenceInCalendarDays(new Date(i.leavesOn), today) >= 0);
  if (items.length === 0) return null;

  return (
    <section className="mb-9" aria-label="Leaving soon">
      <h3 className="mb-1 flex items-center gap-2 font-display text-lg font-bold tracking-tight sm:text-xl">
        <CalendarClock className="h-4.5 w-4.5 text-accent" /> Leaving soon
      </h3>
      <p className="mb-3 text-xs text-muted-foreground">Dates can shift — treat them as a guide.</p>
      <ul className="no-scrollbar -mx-1 flex gap-3 overflow-x-auto px-1 pb-2">
        {items.map((i) => {
          const days = differenceInCalendarDays(new Date(i.leavesOn), today);
          return (
            <li key={`${i.title}-${i.platform}-${i.leavesOn}`} className="glass-panel w-48 shrink-0 p-3">
              <p className="line-clamp-2 text-sm font-semibold">{i.title}</p>
              <p className="mt-1 text-[11px] text-muted-foreground">{i.platform}</p>
              <p className="mt-2 text-xs font-medium text-amber-500">
                {days === 0 ? "Leaves today" : days === 1 ? "Leaves tomorrow" : `${days} days left`}
                <span className="text-muted-foreground"> · {format(new Date(i.leavesOn), "d MMM")}</span>
              </p>
            </li>
          );
        })}
      </ul>
    </section>
  );
}
