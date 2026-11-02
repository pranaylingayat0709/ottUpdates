"use client";
import Link from "next/link";
import { useMemo } from "react";
import { format } from "date-fns";
import { ArrowLeft, BookOpen, Download, Trash2 } from "lucide-react";
import { useDiaryStore } from "@/hooks/useDiaryStore";
import { HalfStarRating } from "@/components/HalfStarRating";
import { PosterImage } from "@/components/PosterImage";
import { EmptyState } from "@/components/EmptyState";

function csvCell(v: string | number) {
  const s = String(v);
  return /[",\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
}

export default function DiaryPage() {
  const entries = useDiaryStore((s) => s.entries);
  const remove = useDiaryStore((s) => s.remove);

  const rated = entries.filter((e) => e.rating > 0);
  const avg = rated.length ? rated.reduce((a, e) => a + e.rating, 0) / rated.length : 0;

  const byMonth = useMemo(() => {
    const groups = new Map<string, typeof entries>();
    for (const e of [...entries].sort((a, b) => b.loggedAt - a.loggedAt)) {
      const k = format(new Date(e.loggedAt), "MMMM yyyy");
      groups.set(k, [...(groups.get(k) ?? []), e]);
    }
    return [...groups.entries()];
  }, [entries]);

  // Letterboxd's importer accepts Title / WatchedDate / Rating / Review columns.
  function exportCsv() {
    const rows = [["Title", "WatchedDate", "Rating", "Review"], ...entries.map((e) => [e.title, format(new Date(e.loggedAt), "yyyy-MM-dd"), e.rating || "", e.note])];
    const blob = new Blob([rows.map((r) => r.map(csvCell).join(",")).join("\n")], { type: "text/csv;charset=utf-8" });
    const a = document.createElement("a");
    a.href = URL.createObjectURL(blob);
    a.download = "ott-weekly-pulse-diary.csv";
    a.click();
    URL.revokeObjectURL(a.href);
  }

  return (
    <div className="mx-auto max-w-2xl">
      <Link href="/profile" className="mb-3 inline-flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground">
        <ArrowLeft className="h-3.5 w-3.5" /> Profile
      </Link>
      <div className="mb-5 flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="flex items-center gap-2 font-display text-fluid-h1 font-bold tracking-tight"><BookOpen className="h-6 w-6 text-accent" /> Diary</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            {entries.length} logged{rated.length > 0 && <> · average {avg.toFixed(1)} ★ across {rated.length} rated</>}. Stored on this device.
          </p>
        </div>
        {entries.length > 0 && (
          <button onClick={exportCsv} className="chip"><Download className="h-3.5 w-3.5" /> Export CSV</button>
        )}
      </div>

      {entries.length === 0 && <EmptyState message="Nothing logged yet" hint="Open any title and use “Log to diary” to rate it and add a note." />}

      {byMonth.map(([month, list]) => (
        <section key={month} className="mb-6" aria-label={month}>
          <h2 className="mb-2 text-xs font-semibold uppercase tracking-wide text-muted-foreground">{month}</h2>
          <ul className="space-y-2">
            {list.map((e) => (
              <li key={e.id} className="glass-panel flex gap-3 p-3">
                <Link href={`/title/${e.id}`} className="w-12 shrink-0">
                  <div className="relative aspect-[2/3] overflow-hidden rounded-lg">
                    <PosterImage src={e.posterUrl} alt={e.title} fill sizes="48px" className="object-cover" />
                  </div>
                </Link>
                <div className="min-w-0 flex-1">
                  <div className="flex items-start justify-between gap-2">
                    <Link href={`/title/${e.id}`} className="line-clamp-1 text-sm font-semibold hover:text-accent">{e.title}</Link>
                    <button onClick={() => remove(e.id)} aria-label={`Remove ${e.title} from diary`} className="text-muted-foreground hover:text-destructive">
                      <Trash2 className="h-3.5 w-3.5" />
                    </button>
                  </div>
                  <div className="mt-0.5 flex items-center gap-2">
                    {e.rating > 0 ? <HalfStarRating value={e.rating} readOnly size="sm" /> : <span className="text-[11px] text-muted-foreground">Not rated</span>}
                    <span className="text-[11px] text-muted-foreground">{format(new Date(e.loggedAt), "d MMM")}</span>
                  </div>
                  {e.note && <p className="mt-1 whitespace-pre-line text-xs text-muted-foreground">{e.note}</p>}
                </div>
              </li>
            ))}
          </ul>
        </section>
      ))}
    </div>
  );
}
