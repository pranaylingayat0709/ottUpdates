"use client";
import { useEffect, useState } from "react";
import { Newspaper } from "lucide-react";

// Longer-form editorial take, distinct from the 2-line Quick AI Verdict —
// what generally works, an honest caveat, and who it's worth it for.
// Explicitly labeled "AI Critic's Take" rather than "Critic Reviews" —
// this is AI-generated analysis of the title's own metadata, NOT sourced
// from real critic reviews (no such data source is integrated). Never
// remove or soften that label; it's the honest thing to say here.
export function CriticsTakeCard({ titleId }: { titleId: string }) {
  const [take, setTake] = useState<{ paragraph: string } | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    fetch("/api/critics-take", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ titleId })
    })
      .then((res) => res.json())
      .then((data) => {
        if (!cancelled && data.take) setTake(data.take);
        if (!cancelled && !data.take) setError(true);
      })
      .catch(() => !cancelled && setError(true))
      .finally(() => !cancelled && setLoading(false));
    return () => {
      cancelled = true;
    };
  }, [titleId]);

  return (
    <div className="glass-card space-y-2 p-4">
      <div className="flex items-center gap-2">
        <Newspaper className="h-4 w-4 text-accent" />
        <h4 className="text-sm font-bold">AI Critic's Take</h4>
        <span className="chip !py-0.5 text-[10px]">AI-generated, not real critic reviews</span>
      </div>

      {loading && (
        <div className="space-y-2">
          <div className="skeleton h-3.5 w-full rounded" />
          <div className="skeleton h-3.5 w-full rounded" />
          <div className="skeleton h-3.5 w-3/4 rounded" />
        </div>
      )}

      {!loading && take && <p className="text-sm leading-relaxed text-muted-foreground">{take.paragraph}</p>}

      {!loading && !take && error && (
        <p className="text-xs text-muted-foreground">Take unavailable right now — check back shortly.</p>
      )}
    </div>
  );
}
