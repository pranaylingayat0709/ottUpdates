"use client";
import { Search, SlidersHorizontal, X } from "lucide-react";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import type { TitleFilters } from "@/lib/types";
import { GENRE_LABELS, PLATFORM_LABELS } from "@/lib/types";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

const TYPE_OPTIONS: { value: NonNullable<TitleFilters["type"]>; label: string }[] = [
  { value: "ALL", label: "All Types" },
  { value: "MOVIE", label: "Movies" },
  { value: "SERIES", label: "Web Series" },
  { value: "DOCUMENTARY", label: "Documentaries" }
];

const LANGUAGE_OPTIONS: { value: NonNullable<TitleFilters["language"]>; label: string }[] = [
  { value: "ALL", label: "All Languages" },
  { value: "ENGLISH", label: "English" },
  { value: "HINDI", label: "Hindi" },
  { value: "MARATHI", label: "Marathi" },
  { value: "HINDI_DUBBED", label: "Hindi-Dubbed" }
];

const RATING_OPTIONS = [
  { value: "0", label: "Any Rating" },
  { value: "6", label: "6+ IMDb" },
  { value: "7", label: "7+ IMDb" },
  { value: "8", label: "8+ IMDb" }
];

export function FilterBar({
  filters,
  onChange
}: {
  filters: TitleFilters;
  onChange: (next: Partial<TitleFilters>) => void;
}) {
  const activeCount = [
    filters.type !== "ALL" && filters.type,
    filters.language !== "ALL" && filters.language,
    filters.platform !== "ALL" && filters.platform,
    filters.genre !== "ALL" && filters.genre,
    filters.minRating
  ].filter(Boolean).length;

  return (
    <div className="glass-panel mb-8 flex flex-col gap-3 p-3 sm:p-4">
      <div className="relative">
        <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
        <input
          value={filters.search ?? ""}
          onChange={(e) => onChange({ search: e.target.value })}
          placeholder="Search titles, cast, or directors…"
          className="w-full rounded-full border border-white/10 bg-white/5 py-2.5 pl-9 pr-9 text-sm placeholder:text-muted-foreground focus:border-primary/50 focus:outline-none focus:ring-1 focus:ring-primary/50"
        />
        {filters.search && (
          <button
            onClick={() => onChange({ search: "" })}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
          >
            <X className="h-4 w-4" />
          </button>
        )}
      </div>

      <div className="flex flex-wrap items-center gap-2">
        <span className="flex items-center gap-1 pr-1 text-xs font-medium text-muted-foreground">
          <SlidersHorizontal className="h-3.5 w-3.5" /> Filters
          {activeCount > 0 && <span className="ml-1 rounded-full bg-accent px-1.5 text-[10px] text-white">{activeCount}</span>}
        </span>

        <Select value={filters.type ?? "ALL"} onValueChange={(v) => onChange({ type: v as TitleFilters["type"] })}>
          <SelectTrigger><SelectValue /></SelectTrigger>
          <SelectContent>
            {TYPE_OPTIONS.map((o) => <SelectItem key={o.value} value={o.value}>{o.label}</SelectItem>)}
          </SelectContent>
        </Select>

        <Select value={filters.language ?? "ALL"} onValueChange={(v) => onChange({ language: v as TitleFilters["language"] })}>
          <SelectTrigger><SelectValue /></SelectTrigger>
          <SelectContent>
            {LANGUAGE_OPTIONS.map((o) => <SelectItem key={o.value} value={o.value}>{o.label}</SelectItem>)}
          </SelectContent>
        </Select>

        <Select value={filters.platform ?? "ALL"} onValueChange={(v) => onChange({ platform: v as TitleFilters["platform"] })}>
          <SelectTrigger><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value="ALL">All Platforms</SelectItem>
            {Object.entries(PLATFORM_LABELS).map(([value, label]) => (
              <SelectItem key={value} value={value}>{label}</SelectItem>
            ))}
          </SelectContent>
        </Select>

        <Select value={filters.genre ?? "ALL"} onValueChange={(v) => onChange({ genre: v as TitleFilters["genre"] })}>
          <SelectTrigger><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value="ALL">All Genres</SelectItem>
            {Object.entries(GENRE_LABELS).map(([value, label]) => (
              <SelectItem key={value} value={value}>{label}</SelectItem>
            ))}
          </SelectContent>
        </Select>

        <Select
          value={String(filters.minRating ?? 0)}
          onValueChange={(v) => onChange({ minRating: Number(v) || undefined })}
        >
          <SelectTrigger><SelectValue /></SelectTrigger>
          <SelectContent>
            {RATING_OPTIONS.map((o) => <SelectItem key={o.value} value={o.value}>{o.label}</SelectItem>)}
          </SelectContent>
        </Select>

        {activeCount > 0 && (
          <Button
            variant="ghost"
            size="sm"
            className={cn("text-muted-foreground")}
            onClick={() => onChange({ type: "ALL", language: "ALL", platform: "ALL", genre: "ALL", minRating: undefined })}
          >
            Clear all
          </Button>
        )}
      </div>
    </div>
  );
}
