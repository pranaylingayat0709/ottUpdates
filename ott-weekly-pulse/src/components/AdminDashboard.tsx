"use client";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { PosterImage } from "@/components/PosterImage";
import { EyeOff, Eye, Save, LogOut, Pin, RefreshCw, AlertTriangle, Database } from "lucide-react";
import { Button } from "@/components/ui/button";
import type { Title } from "@/lib/types";

interface Overrides {
  hiddenTitles: string[];
  posterOverrides: Record<string, string>;
  pinnedTitles: unknown[];
}

interface CuratedStatus {
  totalSeeds: number;
  activeThisWeek: number;
  currentWeekLabel: string;
  stale: boolean;
  dataSource?: {
    mode: "live" | "demo-fallback" | "demo-mode";
    watchmodeKeyPresent: boolean;
    tmdbKeyPresent: boolean;
    liveTitleCount: number;
    curatedTitleCount: number;
    totalTitleCount: number;
    watchmodeError?: { status: number | null; message: string; at: string } | null;
  };
}

// Owner-only curation panel — lets you fix live-data issues (hide a bad
// entry, correct a poster URL) directly, instead of needing a code deploy
// each time. Not a general admin/CMS system, just this narrow set of fixes.
export function AdminDashboard() {
  const router = useRouter();
  const [titles, setTitles] = useState<Title[]>([]);
  const [overrides, setOverrides] = useState<Overrides>({ hiddenTitles: [], posterOverrides: {}, pinnedTitles: [] });
  const [posterDrafts, setPosterDrafts] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [savedAt, setSavedAt] = useState<number | null>(null);
  const [curatedStatus, setCuratedStatus] = useState<CuratedStatus | null>(null);

  async function load() {
    setLoading(true);
    try {
      const [titlesRes, overridesRes, curatedRes] = await Promise.all([
        fetch("/api/titles"),
        fetch("/api/admin/overrides"),
        fetch("/api/admin/curated-status")
      ]);
      const titlesData = await titlesRes.json();
      const overridesData = await overridesRes.json();
      setTitles(titlesData.titles ?? []);
      setOverrides(overridesData);
      if (curatedRes.ok) setCuratedStatus(await curatedRes.json());
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    load();
  }, []);

  function toggleHidden(name: string) {
    setOverrides((o) => {
      const key = name.toLowerCase();
      const isHidden = o.hiddenTitles.map((n) => n.toLowerCase()).includes(key);
      return { ...o, hiddenTitles: isHidden ? o.hiddenTitles.filter((n) => n.toLowerCase() !== key) : [...o.hiddenTitles, name] };
    });
  }

  function applyPosterDraft(name: string) {
    const draft = posterDrafts[name];
    if (!draft) return;
    setOverrides((o) => ({ ...o, posterOverrides: { ...o.posterOverrides, [name.toLowerCase()]: draft } }));
  }

  async function save() {
    setSaving(true);
    try {
      await fetch("/api/admin/overrides", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(overrides)
      });
      setSavedAt(Date.now());
    } finally {
      setSaving(false);
    }
  }

  async function logout() {
    await fetch("/api/admin/logout", { method: "POST" });
    router.refresh();
  }

  const isHidden = (name: string) => overrides.hiddenTitles.map((n) => n.toLowerCase()).includes(name.toLowerCase());

  return (
    <div>
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="font-display text-2xl font-bold">Curation Panel</h1>
          <p className="text-xs text-muted-foreground">Hide bad entries or fix poster URLs — changes apply immediately, no deploy needed.</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" onClick={load}><RefreshCw className="h-3.5 w-3.5" /> Refresh</Button>
          <Button size="sm" onClick={save} disabled={saving}><Save className="h-3.5 w-3.5" /> {saving ? "Saving..." : "Save Changes"}</Button>
          <Button variant="ghost" size="sm" onClick={logout}><LogOut className="h-3.5 w-3.5" /></Button>
        </div>
      </div>

      {curatedStatus?.dataSource && (
        <div
          className={`mb-4 flex items-center gap-2 rounded-xl border p-3 text-xs ${
            curatedStatus.dataSource.mode === "live"
              ? "border-emerald-500/40 bg-emerald-500/10 text-emerald-300"
              : "border-rose-500/40 bg-rose-500/10 text-rose-300"
          }`}
        >
          <Database className="h-4 w-4 shrink-0" />
          {curatedStatus.dataSource.mode === "live" && (
            <span>
              <strong>LIVE</strong> — {curatedStatus.dataSource.liveTitleCount} of {curatedStatus.dataSource.totalTitleCount} titles this week came from
              Watchmode/TMDB.
            </span>
          )}
          {curatedStatus.dataSource.mode === "demo-fallback" && (
            <span>
              <strong>WARNING: DEMO FALLBACK</strong> — an API key is configured ({[
                curatedStatus.dataSource.watchmodeKeyPresent && "Watchmode",
                curatedStatus.dataSource.tmdbKeyPresent && "TMDB"
              ]
                .filter(Boolean)
                .join(" + ")}
              ) but returned zero titles for {curatedStatus.currentWeekLabel}, so every title shown right now is curated/mock data.
              {curatedStatus.dataSource.watchmodeError ? (
                <>
                  {" "}
                  Watchmode reason:{" "}
                  <strong>
                    {curatedStatus.dataSource.watchmodeError.status === 401 || curatedStatus.dataSource.watchmodeError.status === 403
                      ? "key rejected (401/403) — it's invalid, revoked, or mistyped in Vercel"
                      : curatedStatus.dataSource.watchmodeError.status === 429
                        ? "429 rate-limited — you've hit Watchmode's request cap (likely the 2,500/month free-tier quota)"
                        : curatedStatus.dataSource.watchmodeError.status
                          ? `HTTP ${curatedStatus.dataSource.watchmodeError.status}`
                          : "network/timeout error reaching Watchmode"}
                  </strong>
                  {" — "}
                  <code className="text-[10px] opacity-80">{curatedStatus.dataSource.watchmodeError.message}</code>
                </>
              ) : (
                " No error was recorded, so this is likely a genuinely quiet week for new IN-region releases rather than a broken key."
              )}
            </span>
          )}
          {curatedStatus.dataSource.mode === "demo-mode" && (
            <span>
              <strong>WARNING: DEMO MODE</strong> — no WATCHMODE_API_KEY or TMDB_API_KEY is set in this deployment&apos;s environment. Every title
              shown is sample/curated data and will look identical (and eventually stale) every week until a live key is added on Vercel
              and the app is redeployed.
            </span>
          )}
        </div>
      )}

      {curatedStatus && (
        <div
          className={`mb-4 flex items-center gap-2 rounded-xl border p-3 text-xs ${
            curatedStatus.stale ? "border-amber-500/40 bg-amber-500/10 text-amber-300" : "border-[hsl(var(--foreground)/0.1)] text-muted-foreground"
          }`}
        >
          {curatedStatus.stale ? <AlertTriangle className="h-4 w-4 shrink-0" /> : <Database className="h-4 w-4 shrink-0" />}
          <span>
            Curated pool: <strong>{curatedStatus.activeThisWeek}</strong> of {curatedStatus.totalSeeds} titles active for {curatedStatus.currentWeekLabel}.
            {curatedStatus.stale && " Zero curated titles are dated for the current week — consider a fresh research pass on mock-data.ts if live data ever falls back to it."}
          </span>
        </div>
      )}

      {savedAt && <p className="mb-4 text-xs text-emerald-400">Saved — live for all visitors now.</p>}
      {overrides.pinnedTitles.length > 0 && (
        <p className="mb-4 flex items-center gap-1.5 text-xs text-muted-foreground">
          <Pin className="h-3.5 w-3.5" /> {overrides.pinnedTitles.length} manually pinned title(s) active this week.
        </p>
      )}

      {loading ? (
        <p className="text-sm text-muted-foreground">Loading this week's catalog...</p>
      ) : (
        <div className="space-y-2">
          {titles.map((t) => (
            <div key={t.id} className="glass-panel flex items-center gap-3 p-3">
              <div className="relative h-16 w-11 shrink-0 overflow-hidden rounded-md">
                <PosterImage src={t.posterUrl} alt={t.title} fill sizes="44px" className="object-cover" />
              </div>
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-semibold">{t.title}</p>
                <p className="text-[11px] text-muted-foreground">{t.type} · {t.originalLanguage} · {t.platforms.join(", ")}</p>
                <input
                  value={posterDrafts[t.title] ?? ""}
                  onChange={(e) => setPosterDrafts((d) => ({ ...d, [t.title]: e.target.value }))}
                  onBlur={() => applyPosterDraft(t.title)}
                  placeholder="Override poster URL..."
                  className="mt-1 w-full rounded border border-[hsl(var(--foreground)/0.1)] bg-[hsl(var(--foreground)/0.03)] px-2 py-1 text-[11px]"
                />
              </div>
              <button
                onClick={() => toggleHidden(t.title)}
                className={`shrink-0 rounded-full p-2 ${isHidden(t.title) ? "bg-rose-500/20 text-rose-400" : "hover:bg-[hsl(var(--foreground)/0.08)]"}`}
                aria-label="Toggle hidden"
                title={isHidden(t.title) ? "Hidden — click to show" : "Click to hide"}
              >
                {isHidden(t.title) ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
