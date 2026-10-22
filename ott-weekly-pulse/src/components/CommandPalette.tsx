"use client";
import { useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { Bookmark, Clapperboard, Home, Monitor, Moon, Palette, Scale, Search, Sun, TrendingUp, Tv, User, Layers } from "lucide-react";
import { useTitles, useWeeks, DEFAULT_TITLE_FILTERS } from "@/hooks/useTitles";
import { useTheme } from "@/components/ThemeProvider";
import { GENRE_LABELS } from "@/lib/types";
import { cn } from "@/lib/utils";

interface Cmd {
  id: string;
  label: string;
  hint?: string;
  icon: React.ReactNode;
  group: "Titles" | "Go to" | "Actions" | "Genres";
  run: () => void;
}

// Ctrl/Cmd+K quick switcher: jump to a title, page or genre, or run an
// action (theme, watchlist, platforms) without touching the mouse.
export function CommandPalette() {
  const router = useRouter();
  const { setPreference } = useTheme();
  const [open, setOpen] = useState(false);
  const [q, setQ] = useState("");
  const [active, setActive] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);
  const prevFocus = useRef<HTMLElement | null>(null);

  const { data: weeks = [] } = useWeeks();
  const currentWeek = weeks.find((w) => w.isCurrent) ?? weeks[0];
  const { data } = useTitles(open ? currentWeek?.id : undefined, DEFAULT_TITLE_FILTERS);

  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "k") {
        e.preventDefault();
        setOpen((o) => !o);
      }
    }
    const openEv = () => setOpen(true);
    window.addEventListener("keydown", onKey);
    window.addEventListener("owp:open-palette", openEv);
    return () => {
      window.removeEventListener("keydown", onKey);
      window.removeEventListener("owp:open-palette", openEv);
    };
  }, []);

  useEffect(() => {
    if (open) {
      prevFocus.current = document.activeElement as HTMLElement | null;
      setQ("");
      setActive(0);
      setTimeout(() => inputRef.current?.focus(), 0);
    } else {
      prevFocus.current?.focus?.();
    }
  }, [open]);

  const close = () => setOpen(false);
  const go = (href: string) => () => { close(); router.push(href); };
  const fire = (name: string) => () => { close(); window.dispatchEvent(new Event(name)); };

  const all: Cmd[] = useMemo(() => {
    const nav: Cmd[] = [
      { id: "home", label: "Home", icon: <Home className="h-4 w-4" />, group: "Go to", run: go("/") },
      { id: "top10", label: "Top 10", icon: <TrendingUp className="h-4 w-4" />, group: "Go to", run: go("/top-10") },
      { id: "compare", label: "Compare titles", icon: <Scale className="h-4 w-4" />, group: "Go to", run: go("/compare") },
      { id: "profile", label: "Profile", icon: <User className="h-4 w-4" />, group: "Go to", run: go("/profile") },
      { id: "wrapped", label: "Wrapped", icon: <Clapperboard className="h-4 w-4" />, group: "Go to", run: go("/wrapped") },
      { id: "best", label: "Best of month", icon: <Clapperboard className="h-4 w-4" />, group: "Go to", run: go("/best-of-month") }
    ];
    const actions: Cmd[] = [
      { id: "wl", label: "Open watchlist", icon: <Bookmark className="h-4 w-4" />, group: "Actions", run: fire("owp:open-watchlist") },
      { id: "plat", label: "My platforms", icon: <Tv className="h-4 w-4" />, group: "Actions", run: fire("owp:open-platforms") },
      { id: "t-l", label: "Theme: Light", icon: <Sun className="h-4 w-4" />, group: "Actions", run: () => { setPreference("light"); close(); } },
      { id: "t-d", label: "Theme: Dark", icon: <Moon className="h-4 w-4" />, group: "Actions", run: () => { setPreference("dark"); close(); } },
      { id: "t-s", label: "Theme: System", icon: <Monitor className="h-4 w-4" />, group: "Actions", run: () => { setPreference("system"); close(); } }
    ];
    const genres: Cmd[] = Object.entries(GENRE_LABELS).map(([k, label]) => ({
      id: `g-${k}`, label: `${label}`, hint: "Genre", icon: <Layers className="h-4 w-4" />, group: "Genres" as const,
      run: go(`/genre/${k.toLowerCase().replace(/_/g, "-")}`)
    }));
    const titles: Cmd[] = (data?.titles ?? []).map((t) => ({
      id: `t-${t.id}`, label: t.title, hint: t.type === "MOVIE" ? "Movie" : t.type === "SERIES" ? "Series" : "Doc",
      icon: <Palette className="h-4 w-4" />, group: "Titles" as const, run: go(`/title/${t.id}`)
    }));
    return [...titles, ...nav, ...actions, ...genres];
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [data]);

  const results = useMemo(() => {
    const n = q.trim().toLowerCase();
    if (!n) return all.filter((c) => c.group === "Go to" || c.group === "Actions").slice(0, 10);
    return all.filter((c) => c.label.toLowerCase().includes(n)).slice(0, 12);
  }, [all, q]);

  useEffect(() => setActive(0), [q]);
  useEffect(() => {
    document.getElementById(`cmd-${active}`)?.scrollIntoView({ block: "nearest" });
  }, [active]);

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-[90] flex items-start justify-center bg-black/60 px-4 pt-[12vh] backdrop-blur-sm" onMouseDown={(e) => e.target === e.currentTarget && close()}>
      <div role="dialog" aria-modal="true" aria-label="Command palette" className="glass-panel w-full max-w-xl overflow-hidden !bg-[hsl(var(--background))] shadow-2xl">
        <div className="flex items-center gap-2 border-b px-4" style={{ borderColor: "hsl(var(--foreground) / 0.1)" }}>
          <Search className="h-4 w-4 text-muted-foreground" />
          <input
            ref={inputRef}
            value={q}
            onChange={(e) => setQ(e.target.value)}
            role="combobox"
            aria-expanded="true"
            aria-controls="cmd-list"
            aria-activedescendant={results[active] ? `cmd-${active}` : undefined}
            placeholder="Search titles, pages, genres, actions…"
            className="h-12 flex-1 bg-transparent text-sm outline-none"
            onKeyDown={(e) => {
              if (e.key === "Escape") { e.preventDefault(); close(); }
              else if (e.key === "ArrowDown") { e.preventDefault(); setActive((a) => Math.min(a + 1, results.length - 1)); }
              else if (e.key === "ArrowUp") { e.preventDefault(); setActive((a) => Math.max(a - 1, 0)); }
              else if (e.key === "Enter") { e.preventDefault(); results[active]?.run(); }
            }}
          />
          <kbd className="rounded border px-1.5 text-[10px] text-muted-foreground" style={{ borderColor: "hsl(var(--foreground) / 0.2)" }}>Esc</kbd>
        </div>
        <ul id="cmd-list" role="listbox" className="max-h-[50vh] overflow-y-auto p-2">
          {results.length === 0 && <li className="px-3 py-6 text-center text-sm text-muted-foreground">No matches</li>}
          {results.map((c, i) => (
            <li
              key={c.id}
              id={`cmd-${i}`}
              role="option"
              aria-selected={i === active}
              onMouseMove={() => setActive(i)}
              onClick={c.run}
              className={cn("flex cursor-pointer items-center gap-3 rounded-lg px-3 py-2 text-sm", i === active && "bg-accent/15")}
            >
              <span className="text-muted-foreground">{c.icon}</span>
              <span className="flex-1 truncate">{c.label}</span>
              <span className="text-[10px] uppercase tracking-wide text-muted-foreground">{c.hint ?? c.group}</span>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}
