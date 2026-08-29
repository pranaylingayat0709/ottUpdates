"use client";
import { useEffect, useState } from "react";
import { Sparkles, ThumbsDown, ThumbsUp } from "lucide-react";

export function AiVerdictCard({ titleId, fallbackWatch, fallbackSkip }: { titleId: string; fallbackWatch?: string | null; fallbackSkip?: string | null }) {
  const [verdict, setVerdict] = useState<{ watch: string; skip: string } | null>(
    fallbackWatch && fallbackSkip ? { watch: fallbackWatch, skip: fallbackSkip } : null
  );
  const [loading, setLoading] = useState(!verdict);
  const [error, setError] = useState(false);

  useEffect(() => {
    if (verdict) return;
    let cancelled = false;
    setLoading(true);
    fetch("/api/verdict", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ titleId })
    })
      .then((res) => res.json())
      .then((data) => {
        if (!cancelled && data.verdict) setVerdict(data.verdict);
        if (!cancelled && !data.verdict) setError(true);
      })
      .catch(() => !cancelled && setError(true))
      .finally(() => !cancelled && setLoading(false));
    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [titleId]);

  return (
    <div className="glass-card space-y-3 p-4">
      <div className="flex items-center gap-2">
        <Sparkles className="h-4 w-4 text-accent" />
        <h4 className="text-sm font-bold">Quick AI Verdict</h4>
        <span className="chip !py-0.5 text-[10px]">via NVIDIA NIM</span>
      </div>

      {loading && (
        <div className="space-y-2">
          <div className="skeleton h-3.5 w-full rounded" />
          <div className="skeleton h-3.5 w-4/5 rounded" />
        </div>
      )}

      {!loading && verdict && (
        <div className="space-y-2 text-sm">
          <p className="flex items-start gap-2">
            <ThumbsUp className="mt-0.5 h-3.5 w-3.5 shrink-0 text-emerald-400" />
            <span><span className="font-semibold text-emerald-400">Watch it if:</span> {verdict.watch}</span>
          </p>
          <p className="flex items-start gap-2">
            <ThumbsDown className="mt-0.5 h-3.5 w-3.5 shrink-0 text-rose-400" />
            <span><span className="font-semibold text-rose-400">Skip it if:</span> {verdict.skip}</span>
          </p>
        </div>
      )}

      {!loading && !verdict && error && (
        <p className="text-xs text-muted-foreground">Verdict unavailable right now — check back shortly.</p>
      )}
    </div>
  );
}
