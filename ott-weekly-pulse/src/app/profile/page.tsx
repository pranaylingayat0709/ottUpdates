"use client";
import Link from "next/link";
import { useState } from "react";
import { ArrowLeft, Heart, Tv, Check, ListChecks, FolderKanban, Trash2, Palette, Wallet, Users, Plus, Pencil } from "lucide-react";
import { useTasteStore } from "@/hooks/useTasteStore";
import { useMyPlatformsStore } from "@/hooks/useMyPlatformsStore";
import { useCollectionsStore } from "@/hooks/useCollectionsStore";
import { useWatchlistStore } from "@/hooks/useWatchlistStore";
import { useSubscriptionCostStore } from "@/hooks/useSubscriptionCostStore";
import { useHouseholdStore } from "@/hooks/useHouseholdStore";
import { useAccent, ACCENT_OPTIONS } from "@/components/AccentProvider";
import { GENRE_LABELS, PLATFORM_LABELS, type Genre, type Platform } from "@/lib/types";
import { cn } from "@/lib/utils";

const ALL_GENRES = Object.keys(GENRE_LABELS) as Genre[];
const ALL_PLATFORMS = Object.keys(PLATFORM_LABELS) as Platform[];

// A standing, revisitable version of the one-time onboarding modals — the
// same favorite-genre and my-platforms state, but editable any time rather
// than only asked once, plus an overview of watchlist/collections so a
// person can see and manage everything that makes recommendations "theirs"
// in one place.
export default function ProfilePage() {
  const favoriteGenres = useTasteStore((s) => s.favoriteGenres);
  const toggleGenre = useTasteStore((s) => s.toggle);

  const myPlatforms = useMyPlatformsStore((s) => s.platforms);
  const togglePlatform = useMyPlatformsStore((s) => s.toggle);

  const { accent, setAccent } = useAccent();
  const prices = useSubscriptionCostStore((s) => s.prices);
  const setPrice = useSubscriptionCostStore((s) => s.setPrice);
  const monthlyTotal = myPlatforms.reduce((sum, p) => sum + (prices[p] ?? 0), 0);
  const watchlistCount = useWatchlistStore((s) => s.titleIds.length);
  const collections = useCollectionsStore((s) => s.collections);
  const deleteCollection = useCollectionsStore((s) => s.deleteCollection);

  const profiles = useHouseholdStore((s) => s.profiles);
  const activeProfileId = useHouseholdStore((s) => s.activeProfileId);
  const addProfile = useHouseholdStore((s) => s.addProfile);
  const renameProfile = useHouseholdStore((s) => s.renameProfile);
  const removeProfile = useHouseholdStore((s) => s.removeProfile);
  const switchProfile = useHouseholdStore((s) => s.switchProfile);
  const [addingProfile, setAddingProfile] = useState(false);
  const [newProfileName, setNewProfileName] = useState("");
  const [renamingId, setRenamingId] = useState<string | null>(null);
  const [renameDraft, setRenameDraft] = useState("");

  function submitNewProfile() {
    if (newProfileName.trim()) addProfile(newProfileName);
    setNewProfileName("");
    setAddingProfile(false);
  }
  function submitRename(id: string) {
    if (renameDraft.trim()) renameProfile(id, renameDraft);
    setRenamingId(null);
  }

  return (
    <div className="mx-auto max-w-2xl">
      <Link href="/" className="mb-4 inline-flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground">
        <ArrowLeft className="h-3.5 w-3.5" /> Back to Weekly Pulse
      </Link>
      <h1 className="mb-2 font-display text-2xl font-bold tracking-tight sm:text-3xl">Your Taste Profile</h1>
      <p className="mb-8 text-sm text-muted-foreground">
        Everything here is stored on this device only — no account needed — and shapes your Hero picks, Recommended For You, and Surprise Me.
      </p>

      <section className="glass-panel mb-6 p-5">
        <h2 className="mb-1 flex items-center gap-2 text-sm font-bold">
          <Users className="h-4 w-4 text-accent" /> Household Profiles
        </h2>
        <p className="mb-4 text-xs text-muted-foreground">
          Sharing this device? Each profile keeps its own watchlist, taste, platforms, reminders and watched history. Switching reloads the page.
        </p>
        <div className="space-y-1.5">
          {profiles.map((p) => (
            <div key={p.id} className="flex items-center justify-between gap-2 rounded-lg bg-[hsl(var(--foreground)/0.04)] px-3 py-2 text-sm">
              {renamingId === p.id ? (
                <input
                  autoFocus
                  value={renameDraft}
                  onChange={(e) => setRenameDraft(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && submitRename(p.id)}
                  onBlur={() => submitRename(p.id)}
                  className="min-w-0 flex-1 rounded-md border border-[hsl(var(--foreground)/0.15)] bg-transparent px-2 py-0.5 text-sm focus:outline-none"
                />
              ) : (
                <button
                  onClick={() => p.id !== activeProfileId && switchProfile(p.id)}
                  className={cn("flex min-w-0 flex-1 items-center gap-2 truncate text-left", p.id === activeProfileId ? "font-semibold text-accent" : "hover:text-accent")}
                >
                  <span>{p.emoji}</span> <span className="truncate">{p.name}</span>
                  {p.id === activeProfileId && <span className="rounded-full bg-accent/15 px-1.5 py-0.5 text-[9px] font-medium uppercase tracking-wide text-accent">Active</span>}
                </button>
              )}
              <div className="flex shrink-0 items-center gap-2">
                <button
                  onClick={() => { setRenamingId(p.id); setRenameDraft(p.name); }}
                  className="text-muted-foreground hover:text-accent"
                  aria-label={`Rename ${p.name}`}
                >
                  <Pencil className="h-3.5 w-3.5" />
                </button>
                {p.id !== "default" && (
                  <button onClick={() => removeProfile(p.id)} className="text-muted-foreground hover:text-destructive" aria-label={`Delete ${p.name}`}>
                    <Trash2 className="h-3.5 w-3.5" />
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
        {addingProfile ? (
          <input
            autoFocus
            value={newProfileName}
            onChange={(e) => setNewProfileName(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && submitNewProfile()}
            onBlur={submitNewProfile}
            placeholder="Profile name"
            className="mt-2 w-full rounded-lg border border-[hsl(var(--foreground)/0.15)] bg-transparent px-3 py-1.5 text-sm focus:outline-none"
          />
        ) : (
          <button onClick={() => setAddingProfile(true)} className="mt-2 flex items-center gap-1.5 text-xs text-muted-foreground hover:text-accent">
            <Plus className="h-3.5 w-3.5" /> Add a profile
          </button>
        )}
      </section>

      <section className="glass-panel mb-6 p-5">
        <h2 className="mb-1 flex items-center gap-2 text-sm font-bold">
          <Palette className="h-4 w-4 text-accent" /> Accent Color
        </h2>
        <p className="mb-4 text-xs text-muted-foreground">Changes the app's primary/accent colors everywhere — gradients, chips, buttons.</p>
        <div className="flex flex-wrap gap-2.5">
          {ACCENT_OPTIONS.map((o) => (
            <button
              key={o.value}
              onClick={() => setAccent(o.value)}
              className={cn(
                "flex h-11 w-11 items-center justify-center rounded-full border-2 transition-transform hover:scale-105",
                accent === o.value ? "border-foreground" : "border-transparent"
              )}
              style={{ background: o.swatch }}
              aria-label={o.label}
              title={o.label}
            >
              {accent === o.value && <Check className="h-4 w-4 text-white drop-shadow" />}
            </button>
          ))}
        </div>
      </section>

      <section className="glass-panel mb-6 p-5">
        <h2 className="mb-1 flex items-center gap-2 text-sm font-bold">
          <Heart className="h-4 w-4 text-accent" /> Favorite Genres
        </h2>
        <p className="mb-4 text-xs text-muted-foreground">Used to bias ordering — never hides anything outright.</p>
        <div className="flex flex-wrap gap-2">
          {ALL_GENRES.map((g) => {
            const selected = favoriteGenres.includes(g);
            return (
              <button key={g} onClick={() => toggleGenre(g)} className={cn("chip", selected && "chip-active")}>
                {selected && <Check className="h-3 w-3" />}
                {GENRE_LABELS[g]}
              </button>
            );
          })}
        </div>
      </section>

      <section className="glass-panel mb-6 p-5">
        <h2 className="mb-1 flex items-center gap-2 text-sm font-bold">
          <Tv className="h-4 w-4 text-accent" /> My Platforms
        </h2>
        <p className="mb-4 text-xs text-muted-foreground">Powers the "My Platforms Only" toggle in the release calendar.</p>
        <div className="flex flex-wrap gap-2">
          {ALL_PLATFORMS.map((p) => {
            const selected = myPlatforms.includes(p);
            return (
              <button key={p} onClick={() => togglePlatform(p)} className={cn("chip", selected && "chip-active")}>
                {selected && <Check className="h-3 w-3" />}
                {PLATFORM_LABELS[p]}
              </button>
            );
          })}
        </div>
      </section>

      {myPlatforms.length > 0 && (
        <section className="glass-panel mb-6 p-5">
          <h2 className="mb-1 flex items-center gap-2 text-sm font-bold">
            <Wallet className="h-4 w-4 text-accent" /> Subscription Cost Tracker
          </h2>
          <p className="mb-4 text-xs text-muted-foreground">
            Self-reported — there's no billing data to pull from, so enter what you pay monthly for each platform in "My Platforms".
          </p>
          <div className="space-y-2">
            {myPlatforms.map((p) => (
              <div key={p} className="flex items-center justify-between gap-3 border-b border-[hsl(var(--foreground)/0.06)] py-1.5 text-sm last:border-0">
                <span className="text-muted-foreground">{PLATFORM_LABELS[p]}</span>
                <div className="flex items-center gap-1 text-xs">
                  <span className="text-muted-foreground">₹</span>
                  <input
                    type="number"
                    min={0}
                    inputMode="decimal"
                    value={prices[p] ?? ""}
                    onChange={(e) => setPrice(p, e.target.value === "" ? undefined : Number(e.target.value))}
                    placeholder="0"
                    className="w-20 rounded-md border border-[hsl(var(--foreground)/0.12)] bg-transparent px-2 py-1 text-right focus:outline-none"
                  />
                  <span className="text-muted-foreground">/mo</span>
                </div>
              </div>
            ))}
          </div>
          <div className="mt-3 flex items-center justify-between border-t border-[hsl(var(--foreground)/0.1)] pt-3 text-sm font-semibold">
            <span>Total</span>
            <span>₹{monthlyTotal.toFixed(0)}/mo · ₹{(monthlyTotal * 12).toFixed(0)}/yr</span>
          </div>
        </section>
      )}

      <section className="glass-panel mb-6 p-5">
        <h2 className="mb-4 flex items-center gap-2 text-sm font-bold">
          <ListChecks className="h-4 w-4 text-accent" /> Lists
        </h2>
        <div className="flex items-center justify-between border-b border-[hsl(var(--foreground)/0.06)] py-2 text-sm">
          <span className="flex items-center gap-2 text-muted-foreground"><FolderKanban className="h-3.5 w-3.5" /> Watchlist</span>
          <span className="font-semibold">{watchlistCount}</span>
        </div>
        {collections.map((c) => (
          <div key={c.id} className="flex items-center justify-between border-b border-[hsl(var(--foreground)/0.06)] py-2 text-sm last:border-0">
            <span className="flex items-center gap-2 text-muted-foreground"><FolderKanban className="h-3.5 w-3.5" /> {c.name}</span>
            <span className="flex items-center gap-3">
              <span className="font-semibold">{c.titleIds.length}</span>
              <button onClick={() => deleteCollection(c.id)} className="text-muted-foreground hover:text-destructive" aria-label={`Delete ${c.name}`}>
                <Trash2 className="h-3.5 w-3.5" />
              </button>
            </span>
          </div>
        ))}
        {collections.length === 0 && (
          <p className="pt-2 text-xs text-muted-foreground">No custom collections yet — create one from any title's detail page.</p>
        )}
      </section>
    </div>
  );
}
