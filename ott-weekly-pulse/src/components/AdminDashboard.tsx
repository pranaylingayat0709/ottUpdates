"use client";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import { EyeOff, Eye, Save, LogOut, Pin, RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";
import type { Title } from "@/lib/types";

interface Overrides {
  hiddenTitles: string[];
  posterOverrides: Record<string, string>;
  pinnedTitles: unknown[];
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

  async function load() {
    setLoading(true);
    try {
      const [titlesRes, overridesRes] = await Promise.all([fetch("/api/titles"), fetch("/api/admin/overrides")]);
      const titlesData = await titlesRes.json();
      const overridesData = await overridesRes.json();
      setTitles(titlesData.titles ?? []);
      setOverrides(overridesData);
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
                <Image src={t.posterUrl} alt={t.title} fill sizes="44px" className="object-cover" />
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
