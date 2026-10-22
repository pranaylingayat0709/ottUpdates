"use client";
import { useEffect, useId, useMemo, useRef, useState } from "react";
import { Clock3, Search, X } from "lucide-react";
import { useTitles, DEFAULT_TITLE_FILTERS } from "@/hooks/useTitles";
import { PosterImage } from "@/components/PosterImage";
import { PlatformMark } from "@/components/PlatformMark";
import { formatRuntime, cn } from "@/lib/utils";
import { GENRE_LABELS } from "@/lib/types";
import type { Title } from "@/lib/types";

const RECENT_KEY = "owp-recent-searches";
const MAX_RECENT = 5;

function loadRecent(): string[] {
  try {
    const raw = window.localStorage.getItem(RECENT_KEY);
    const parsed = raw ? JSON.parse(raw) : [];
    return Array.isArray(parsed) ? parsed.filter((s) => typeof s === "string").slice(0, MAX_RECENT) : [];
  } catch {
    return [];
  }
}
function saveRecent(list: string[]) {
  try {
    window.localStorage.setItem(RECENT_KEY, JSON.stringify(list.slice(0, MAX_RECENT)));
  } catch {
    // storage blocked — recents just won't persist
  }
}

type Row = { kind: "recent"; text: string } | { kind: "title"; title: Title };

// Search input with an instant suggestion dropdown (poster thumbnails while
// you type, recent searches when empty). Suggestions are matched client-side
// against the week's already-loaded catalog, so they appear with zero extra
// requests; the committed search text still flows through the existing
// debounced server-side filter exactly as before.
export function SearchBox({
  value,
  onChange,
  weekId,
  placeholder
}: {
  value: string;
  onChange: (v: string) => void;
  weekId?: string;
  placeholder: string;
}) {
  const listId = useId();
  const wrapRef = useRef<HTMLDivElement>(null);
  const [open, setOpen] = useState(false);
  const [active, setActive] = useState(-1);
  const [recent, setRecent] = useState<string[]>([]);
  const { data } = useTitles(weekId, DEFAULT_TITLE_FILTERS);

  useEffect(() => setRecent(loadRecent()), []);

  useEffect(() => {
    function onDown(e: MouseEvent) {
      if (wrapRef.current && !wrapRef.current.contains(e.target as Node)) setOpen(false);
    }
    document.addEventListener("mousedown", onDown);
    return () => document.removeEventListener("mousedown", onDown);
  }, []);

  const q = value.trim().toLowerCase();
  const rows: Row[] = useMemo(() => {
    if (q.length === 0) return recent.map((text) => ({ kind: "recent" as const, text }));
    const hits = (data?.titles ?? []).filter(
      (t) =>
        t.title.toLowerCase().includes(q) ||
        t.cast.some((c) => c.toLowerCase().includes(q)) ||
        (t.director ?? "").toLowerCase().includes(q)
    );
    return hits.slice(0, 6).map((title) => ({ kind: "title" as const, title }));
  }, [q, recent, data]);

  function commit(text: string) {
    const clean = text.trim();
    onChange(clean);
    if (clean.length >= 2) {
      const next = [clean, ...recent.filter((r) => r.toLowerCase() !== clean.toLowerCase())];
      setRecent(next.slice(0, MAX_RECENT));
      saveRecent(next);
    }
    setOpen(false);
    setActive(-1);
  }

  function onKeyDown(e: React.KeyboardEvent<HTMLInputElement>) {
    if (e.key === "ArrowDown") {
      e.preventDefault();
      setOpen(true);
      setActive((i) => (rows.length ? (i + 1) % rows.length : -1));
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setActive((i) => (rows.length ? (i <= 0 ? rows.length - 1 : i - 1) : -1));
    } else if (e.key === "Enter") {
      const row = rows[active];
      if (open && row) {
        e.preventDefault();
        commit(row.kind === "recent" ? row.text : row.title.title);
      } else {
        commit(value);
      }
    } else if (e.key === "Escape") {
      setOpen(false);
      setActive(-1);
    }
  }

  const showList = open && rows.length > 0;

  return (
    <div ref={wrapRef} className="relative">
      <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
      <input
        id="site-search-input"
        role="combobox"
        aria-expanded={showList}
        aria-controls={listId}
        aria-autocomplete="list"
        aria-activedescendant={active >= 0 ? `${listId}-${active}` : undefined}
        aria-label="Search titles, cast or director"
        autoComplete="off"
        value={value}
        onChange={(e) => {
          onChange(e.target.value);
          setOpen(true);
          setActive(-1);
        }}
        onFocus={() => setOpen(true)}
        onKeyDown={onKeyDown}
        placeholder={placeholder}
        className="w-full rounded-full border border-[hsl(var(--foreground)/0.1)] bg-[hsl(var(--foreground)/0.04)] py-2.5 pl-9 pr-9 text-sm placeholder:text-muted-foreground focus:border-primary/50 focus:outline-none focus:ring-1 focus:ring-primary/50"
      />
      {value && (
        <button
          onClick={() => {
            onChange("");
            setOpen(true);
          }}
          aria-label="Clear search"
          className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
        >
          <X className="h-4 w-4" />
        </button>
      )}

      {showList && (
        <ul
          id={listId}
          role="listbox"
          className="glass-panel absolute left-0 right-0 top-full z-30 mt-2 max-h-96 overflow-y-auto rounded-2xl p-1.5 shadow-2xl"
          style={{ backgroundColor: "hsl(var(--card) / 0.96)" }}
        >
          {q.length === 0 && (
            <li className="flex items-center justify-between px-2.5 pb-1 pt-1.5 text-[10px] font-semibold uppercase tracking-wide text-muted-foreground" role="presentation">
              Recent searches
              <button
                onMouseDown={(e) => e.preventDefault()}
                onClick={() => {
                  setRecent([]);
                  saveRecent([]);
                }}
                className="normal-case tracking-normal hover:text-foreground"
              >
                Clear
              </button>
            </li>
          )}
          {rows.map((row, i) => (
            <li
              key={row.kind === "recent" ? `r-${row.text}` : row.title.id}
              id={`${listId}-${i}`}
              role="option"
              aria-selected={i === active}
              onMouseDown={(e) => e.preventDefault()}
              onMouseEnter={() => setActive(i)}
              onClick={() => commit(row.kind === "recent" ? row.text : row.title.title)}
              className={cn(
                "flex cursor-pointer items-center gap-3 rounded-xl px-2.5 py-2",
                i === active ? "bg-[hsl(var(--foreground)/0.08)]" : "hover:bg-[hsl(var(--foreground)/0.05)]"
              )}
            >
              {row.kind === "recent" ? (
                <>
                  <Clock3 className="h-4 w-4 shrink-0 text-muted-foreground" />
                  <span className="truncate text-sm">{row.text}</span>
                </>
              ) : (
                <>
                  <div className="relative h-12 w-8 shrink-0 overflow-hidden rounded-md">
                    <PosterImage src={row.title.posterUrl} alt="" fill sizes="32px" className="object-cover" label="" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-semibold">{row.title.title}</p>
                    <p className="truncate text-[11px] text-muted-foreground">
                      {row.title.type === "MOVIE" ? "Movie" : row.title.type === "SERIES" ? "Series" : "Documentary"}
                      {row.title.type === "MOVIE" && row.title.runtimeMinutes ? ` · ${formatRuntime(row.title.runtimeMinutes)}` : ""}
                      {row.title.genres[0] ? ` · ${GENRE_LABELS[row.title.genres[0]]}` : ""}
                    </p>
                  </div>
                  {row.title.platforms[0] && <PlatformMark platform={row.title.platforms[0]} size="sm" />}
                </>
              )}
            </li>
          ))}
        </ul>
      )}
      {open && q.length > 0 && rows.length === 0 && (
        <div className="glass-panel absolute left-0 right-0 top-full z-30 mt-2 rounded-2xl px-4 py-3 text-xs text-muted-foreground shadow-xl" style={{ backgroundColor: "hsl(var(--card) / 0.96)" }}>
          No matches this week — press Enter to search anyway.
        </div>
      )}
    </div>
  );
}
