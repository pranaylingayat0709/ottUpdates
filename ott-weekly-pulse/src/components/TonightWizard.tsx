"use client";
import { useState } from "react";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { TitleModal } from "@/components/TitleModal";
import { MOOD_OPTIONS, matchesMood, matchesRuntime, type MoodKey, type RuntimeKey } from "@/lib/moods";
import { useMyPlatformsStore } from "@/hooks/useMyPlatformsStore";
import type { Title } from "@/lib/types";
import { cn } from "@/lib/utils";
import { Wand2, Clock3, Tv } from "lucide-react";

type Step = "mood" | "time" | "result";

const TIME_OPTIONS: { value: RuntimeKey | "ALL"; label: string; hint: string }[] = [
  { value: "SHORT", label: "Under 2 hours", hint: "A quick movie" },
  { value: "BINGE", label: "I've got the whole evening", hint: "A binge-worthy series" },
  { value: "ALL", label: "Doesn't matter", hint: "Show me anything" }
];

// A 2-question wizard (mood, then time available) that narrows this week's
// catalog down to one pick using the same mood/runtime matchers as the
// FilterBar chips — just presented as a guided flow instead of two selects,
// for the "just decide for me, but not totally randomly" middle ground
// between manual filtering and Surprise Me.
export function TonightWizard({ titles, open, onOpenChange }: { titles: Title[]; open: boolean; onOpenChange: (v: boolean) => void }) {
  const [step, setStep] = useState<Step>("mood");
  const [mood, setMood] = useState<MoodKey | "ALL">("ALL");
  const [runtime, setRuntime] = useState<RuntimeKey | "ALL">("ALL");
  const [pickId, setPickId] = useState<string | null>(null);
  const [pickOpen, setPickOpen] = useState(false);
  const myPlatforms = useMyPlatformsStore((s) => s.platforms);

  function reset() {
    setStep("mood");
    setMood("ALL");
    setRuntime("ALL");
  }

  function pickResult(finalRuntime: RuntimeKey | "ALL") {
    let pool = titles.filter((t) => matchesMood(t.genres, mood) && matchesRuntime(t, finalRuntime));
    // Prefer a platform you actually have, but don't hard-fail to empty if
    // none of the matches happen to be on one of them.
    const onMyPlatforms = myPlatforms.length > 0 ? pool.filter((t) => t.platforms.some((p) => myPlatforms.includes(p))) : pool;
    if (onMyPlatforms.length > 0) pool = onMyPlatforms;
    if (pool.length === 0) pool = titles;
    const choice = pool[Math.floor(Math.random() * pool.length)];
    setPickId(choice?.id ?? null);
    setStep("result");
  }

  return (
    <>
      <Dialog open={open} onOpenChange={(v) => { onOpenChange(v); if (!v) reset(); }}>
        <DialogContent className="max-w-md">
          <div className="p-6">
            <h2 className="mb-1 flex items-center gap-2 text-lg font-bold">
              <Wand2 className="h-5 w-5 text-accent" /> What to Watch Tonight
            </h2>

            {step === "mood" && (
              <>
                <p className="mb-4 mt-1 text-xs text-muted-foreground">What are you in the mood for?</p>
                <div className="grid grid-cols-1 gap-2">
                  {MOOD_OPTIONS.map((o) => (
                    <button
                      key={o.value}
                      onClick={() => { setMood(o.value); setStep("time"); }}
                      className="glass-card rounded-xl px-4 py-3 text-left text-sm font-medium hover:border-accent/50"
                    >
                      {o.label}
                    </button>
                  ))}
                  <button
                    onClick={() => { setMood("ALL"); setStep("time"); }}
                    className="rounded-xl px-4 py-2.5 text-left text-xs text-muted-foreground hover:text-accent"
                  >
                    Surprise me on mood too →
                  </button>
                </div>
              </>
            )}

            {step === "time" && (
              <>
                <p className="mb-4 mt-1 flex items-center gap-1.5 text-xs text-muted-foreground">
                  <Clock3 className="h-3.5 w-3.5" /> How much time do you have?
                </p>
                <div className="grid grid-cols-1 gap-2">
                  {TIME_OPTIONS.map((o) => (
                    <button
                      key={o.value}
                      onClick={() => { setRuntime(o.value); pickResult(o.value); }}
                      className="glass-card flex flex-col rounded-xl px-4 py-3 text-left hover:border-accent/50"
                    >
                      <span className="text-sm font-medium">{o.label}</span>
                      <span className="text-[11px] text-muted-foreground">{o.hint}</span>
                    </button>
                  ))}
                </div>
              </>
            )}

            {step === "result" && (
              <>
                {pickId ? (
                  <div className="mt-2">
                    <p className="mb-3 text-xs text-muted-foreground">Here's your pick for tonight:</p>
                    <button
                      onClick={() => { setPickOpen(true); onOpenChange(false); }}
                      className={cn("glass-card w-full rounded-xl px-4 py-3 text-left text-sm font-semibold hover:border-accent/50")}
                    >
                      View details →
                    </button>
                    <button onClick={reset} className="mt-3 flex items-center gap-1 text-xs text-muted-foreground hover:text-accent">
                      <Tv className="h-3.5 w-3.5" /> Start over
                    </button>
                  </div>
                ) : (
                  <p className="mt-2 text-sm text-muted-foreground">Nothing matched this week — try again with different picks.</p>
                )}
              </>
            )}
          </div>
        </DialogContent>
      </Dialog>
      {pickId && <TitleModal titleId={pickId} open={pickOpen} onOpenChange={setPickOpen} />}
    </>
  );
}
