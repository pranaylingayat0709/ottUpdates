"use client";
import { useEffect, useState } from "react";
import { Bookmark, Plus, SlidersHorizontal, X } from "lucide-react";
import { useSavedViewsStore } from "@/hooks/useSavedViewsStore";
import { SearchBox } from "@/components/SearchBox";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import type { TitleFilters } from "@/lib/types";
import { GENRE_LABELS, PLATFORM_LABELS } from "@/lib/types";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { useDebounce } from "@/hooks/useDebounce";
import { useI18n } from "@/components/LanguageProvider";
import { MOOD_OPTIONS, type MoodKey, type RuntimeKey } from "@/lib/moods";

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
  weekId,
  filters,
  onChange,
  mood,
  onMoodChange,
  runtime,
  onRuntimeChange
}: {
  weekId?: string;
  filters: TitleFilters;
  onChange: (next: Partial<TitleFilters>) => void;
  mood?: MoodKey | "ALL";
  onMoodChange?: (v: MoodKey | "ALL") => void;
  runtime?: RuntimeKey | "ALL";
  onRuntimeChange?: (v: RuntimeKey | "ALL") => void;
}) {
  const { t } = useI18n();
  // Local input state updates instantly for a responsive feel; the actual
  // filter (which triggers a refetch) only fires ~350ms after typing stops,
  // so fast typists don't fire a request per keystroke.
  const [searchInput, setSearchInput] = useState(filters.search ?? "");
  const debouncedSearch = useDebounce(searchInput, 350);

  useEffect(() => {
    if (debouncedSearch !== (filters.search ?? "")) onChange({ search: debouncedSearch });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [debouncedSearch]);

  useEffect(() => {
    if ((filters.search ?? "") === "" && searchInput !== "") setSearchInput("");
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [filters.search]);

  const activeCount = [
    filters.type !== "ALL" && filters.type,
    filters.language !== "ALL" && filters.language,
    filters.platform !== "ALL" && filters.platform,
    filters.genre !== "ALL" && filters.genre,
    filters.minRating,
    mood && mood !== "ALL" && mood,
    runtime && runtime !== "ALL" && runtime
  ].filter(Boolean).length;

  const savedViews = useSavedViewsStore((s) => s.views);
  const saveView = useSavedViewsStore((s) => s.save);
  const removeView = useSavedViewsStore((s) => s.remove);
  const [naming, setNaming] = useState(false);
  const [viewName, setViewName] = useState("");

  const currentFilters: Partial<TitleFilters> = {
    type: filters.type, language: filters.language, platform: filters.platform,
    genre: filters.genre, minRating: filters.minRating
  };

  function applyView(f: Partial<TitleFilters>) {
    onChange({ type: "ALL", language: "ALL", platform: "ALL", genre: "ALL", minRating: undefined, ...f });
  }

  const QUICK: { label: string; active: boolean; apply: Partial<TitleFilters> }[] = [
    { label: "All", active: activeCount === 0, apply: {} },
    { label: "Movies", active: filters.type === "MOVIE", apply: { type: "MOVIE" } },
    { label: "Series", active: filters.type === "SERIES", apply: { type: "SERIES" } },
    { label: "Hindi", active: filters.language === "HINDI", apply: { language: "HINDI" } },
    { label: "Marathi", active: filters.language === "MARATHI", apply: { language: "MARATHI" } },
    { label: "English", active: filters.language === "ENGLISH", apply: { language: "ENGLISH" } },
    { label: "7+ rated", active: (filters.minRating ?? 0) >= 7, apply: { minRating: 7 } }
  ];

  return (
    <div
      className="glass-panel sticky z-30 mb-8 flex flex-col gap-3 p-3 sm:p-4"
      style={{ top: "calc(var(--header-h, 64px) + 6px)" }}
    >
      <SearchBox value={searchInput} onChange={setSearchInput} weekId={weekId} placeholder={t("filter.searchPlaceholder")} />

      <div className="no-scrollbar -mx-1 flex items-center gap-2 overflow-x-auto px-1" role="group" aria-label="Quick filters">
        {QUICK.map((q) => (
          <button
            key={q.label}
            aria-pressed={q.active}
            onClick={() => (q.label === "All" ? applyView({}) : onChange(q.apply))}
            className={cn("chip shrink-0", q.active && "chip-active")}
          >
            {q.label}
          </button>
        ))}
        {savedViews.length > 0 && <span aria-hidden className="mx-1 h-4 w-px shrink-0 bg-[hsl(var(--foreground)/0.15)]" />}
        {savedViews.map((v) => (
          <span key={v.id} className="chip shrink-0 !gap-1 !pr-1.5">
            <button onClick={() => applyView(v.filters)} className="flex items-center gap-1">
              <Bookmark className="h-3 w-3" /> {v.name}
            </button>
            <button onClick={() => removeView(v.id)} aria-label={`Delete saved view ${v.name}`} className="rounded-full p-0.5 hover:bg-[hsl(var(--foreground)/0.12)]">
              <X className="h-3 w-3" />
            </button>
          </span>
        ))}
        {activeCount > 0 && !naming && (
          <button onClick={() => setNaming(true)} className="chip shrink-0 border-dashed">
            <Plus className="h-3 w-3" /> Save view
          </button>
        )}
        {naming && (
          <form
            className="flex shrink-0 items-center gap-1"
            onSubmit={(e) => {
              e.preventDefault();
              saveView(viewName, currentFilters);
              setViewName("");
              setNaming(false);
            }}
          >
            <input
              autoFocus
              value={viewName}
              onChange={(e) => setViewName(e.target.value)}
              onKeyDown={(e) => e.key === "Escape" && setNaming(false)}
              maxLength={24}
              placeholder="Name this view"
              aria-label="Saved view name"
              className="h-8 w-36 rounded-full border bg-transparent px-3 text-xs"
              style={{ borderColor: "hsl(var(--foreground) / 0.2)" }}
            />
            <button type="submit" className="chip chip-active">Save</button>
          </form>
        )}
      </div>

      <div className="flex flex-wrap items-center gap-2">
        <span className="flex items-center gap-1 pr-1 text-xs font-medium text-muted-foreground">
          <SlidersHorizontal className="h-3.5 w-3.5" /> {t("filter.filters")}
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
            <SelectItem value="ALL">{t("filter.allPlatforms")}</SelectItem>
            {Object.entries(PLATFORM_LABELS).map(([value, label]) => (
              <SelectItem key={value} value={value}>{label}</SelectItem>
            ))}
          </SelectContent>
        </Select>

        <Select value={filters.genre ?? "ALL"} onValueChange={(v) => onChange({ genre: v as TitleFilters["genre"] })}>
          <SelectTrigger><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value="ALL">{t("filter.allGenres")}</SelectItem>
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

        {onMoodChange && (
          <Select value={mood ?? "ALL"} onValueChange={(v) => onMoodChange(v as MoodKey | "ALL")}>
            <SelectTrigger><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="ALL">Any Mood</SelectItem>
              {MOOD_OPTIONS.map((o) => <SelectItem key={o.value} value={o.value}>{o.label}</SelectItem>)}
            </SelectContent>
          </Select>
        )}

        {onRuntimeChange && (
          <Select value={runtime ?? "ALL"} onValueChange={(v) => onRuntimeChange(v as RuntimeKey | "ALL")}>
            <SelectTrigger><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="ALL">Any Length</SelectItem>
              <SelectItem value="SHORT">Short Movies (≤100m)</SelectItem>
              <SelectItem value="BINGE">Binge-Worthy Series</SelectItem>
            </SelectContent>
          </Select>
        )}

        {activeCount > 0 && (
          <Button
            variant="ghost"
            size="sm"
            className={cn("text-muted-foreground")}
            onClick={() => {
              onChange({ type: "ALL", language: "ALL", platform: "ALL", genre: "ALL", minRating: undefined });
              onMoodChange?.("ALL");
              onRuntimeChange?.("ALL");
            }}
          >
            {t("filter.clearAll")}
          </Button>
        )}
      </div>
    </div>
  );
}
