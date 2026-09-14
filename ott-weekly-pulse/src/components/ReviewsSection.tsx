"use client";
import { useMemo, useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { MessageSquare, Send, Star, ThumbsUp, ThumbsDown, BadgeCheck, ArrowUpDown } from "lucide-react";
import type { Review } from "@/lib/types";
import { formatDistanceToNow } from "date-fns";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useI18n } from "@/components/LanguageProvider";
import { useWatchedStore } from "@/hooks/useWatchedStore";
import { cn } from "@/lib/utils";

type SortMode = "helpful" | "newest" | "highest" | "lowest";

const SORT_OPTIONS: { value: SortMode; label: string }[] = [
  { value: "helpful", label: "Most Helpful" },
  { value: "newest", label: "Newest" },
  { value: "highest", label: "Highest Rated" },
  { value: "lowest", label: "Lowest Rated" }
];

function SubRatingSlider({ label, value, onChange }: { label: string; value: number; onChange: (v: number) => void }) {
  return (
    <div className="flex items-center justify-between gap-2">
      <span className="text-[10px] text-muted-foreground">{label}</span>
      <div className="flex items-center gap-1">
        {[2, 4, 6, 8, 10].map((v) => (
          <button key={v} type="button" onClick={() => onChange(v)}>
            <Star className={`h-3 w-3 ${value >= v ? "fill-yellow-400 text-yellow-400" : "text-muted-foreground/40"}`} />
          </button>
        ))}
      </div>
    </div>
  );
}

export function ReviewsSection({ titleId }: { titleId: string }) {
  const qc = useQueryClient();
  const { t } = useI18n();
  const isWatched = useWatchedStore((s) => s.isWatched(titleId));
  const [userName, setUserName] = useState("");
  const [rating, setRating] = useState(8);
  const [body, setBody] = useState("");
  const [showSubRatings, setShowSubRatings] = useState(false);
  const [subRatings, setSubRatings] = useState({ story: 8, acting: 8, pacing: 8 });
  const [submitting, setSubmitting] = useState(false);
  const [sortMode, setSortMode] = useState<SortMode>("helpful");
  const [votedIds, setVotedIds] = useState<Record<string, "up" | "down">>({});

  const { data: reviews = [] } = useQuery({
    queryKey: ["reviews", titleId],
    queryFn: () => fetch(`/api/titles/${titleId}/reviews`).then((r) => r.json()).then((d) => d.reviews as Review[])
  });

  const sortedReviews = useMemo(() => {
    const copy = [...reviews];
    switch (sortMode) {
      case "newest":
        return copy.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
      case "highest":
        return copy.sort((a, b) => b.rating - a.rating);
      case "lowest":
        return copy.sort((a, b) => a.rating - b.rating);
      case "helpful":
      default:
        return copy.sort((a, b) => b.helpfulCount - b.unhelpfulCount - (a.helpfulCount - a.unhelpfulCount));
    }
  }, [reviews, sortMode]);

  async function submit() {
    if (!userName.trim() || !body.trim()) return;
    setSubmitting(true);
    try {
      await fetch(`/api/titles/${titleId}/reviews`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          userName,
          rating,
          body,
          verifiedWatch: isWatched,
          subRatings: showSubRatings ? subRatings : undefined
        })
      });
      setBody("");
      qc.invalidateQueries({ queryKey: ["reviews", titleId] });
      qc.invalidateQueries({ queryKey: ["titles"] }); // community score just changed
    } finally {
      setSubmitting(false);
    }
  }

  async function vote(reviewId: string, direction: "up" | "down") {
    if (votedIds[reviewId]) return; // one vote per review per session, either direction
    setVotedIds((v) => ({ ...v, [reviewId]: direction }));
    await fetch(`/api/titles/${titleId}/reviews/${reviewId}/vote`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ direction })
    });
    qc.invalidateQueries({ queryKey: ["reviews", titleId] });
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h4 className="flex items-center gap-2 text-sm font-bold">
          <MessageSquare className="h-4 w-4 text-accent" /> {t("reviews.title")} ({reviews.length})
        </h4>
        {reviews.length > 1 && (
          <Select value={sortMode} onValueChange={(v) => setSortMode(v as SortMode)}>
            <SelectTrigger className="!min-w-0 gap-1 px-2 text-[11px]">
              <ArrowUpDown className="h-3 w-3" />
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {SORT_OPTIONS.map((o) => <SelectItem key={o.value} value={o.value}>{o.label}</SelectItem>)}
            </SelectContent>
          </Select>
        )}
      </div>

      <div className="glass-panel space-y-2 p-3">
        {isWatched && (
          <p className="flex items-center gap-1 text-[10px] text-emerald-400">
            <BadgeCheck className="h-3 w-3" /> Posting as a verified watch — you've marked this title watched.
          </p>
        )}
        <div className="flex gap-2">
          <input
            value={userName}
            onChange={(e) => setUserName(e.target.value)}
            placeholder="Your name"
            className="flex-1 rounded-lg border border-[hsl(var(--foreground)/0.1)] bg-[hsl(var(--foreground)/0.04)] px-3 py-1.5 text-xs focus:outline-none focus:ring-1 focus:ring-primary/50"
          />
          <div className="flex items-center gap-1 rounded-lg border border-[hsl(var(--foreground)/0.1)] bg-[hsl(var(--foreground)/0.04)] px-2">
            {[2, 4, 6, 8, 10].map((v) => (
              <button key={v} onClick={() => setRating(v)} type="button">
                <Star className={`h-4 w-4 ${rating >= v ? "fill-yellow-400 text-yellow-400" : "text-muted-foreground/40"}`} />
              </button>
            ))}
          </div>
        </div>
        <textarea
          value={body}
          onChange={(e) => setBody(e.target.value)}
          placeholder="Share your thoughts…"
          rows={2}
          className="w-full resize-none rounded-lg border border-[hsl(var(--foreground)/0.1)] bg-[hsl(var(--foreground)/0.04)] px-3 py-1.5 text-xs focus:outline-none focus:ring-1 focus:ring-primary/50"
        />
        <button
          type="button"
          onClick={() => setShowSubRatings((v) => !v)}
          className="text-[10px] text-accent hover:underline"
        >
          {showSubRatings ? "Hide detailed ratings" : "+ Rate story, acting & pacing separately"}
        </button>
        {showSubRatings && (
          <div className="space-y-1.5 rounded-lg border border-[hsl(var(--foreground)/0.08)] p-2">
            <SubRatingSlider label="Story" value={subRatings.story} onChange={(v) => setSubRatings((s) => ({ ...s, story: v }))} />
            <SubRatingSlider label="Acting" value={subRatings.acting} onChange={(v) => setSubRatings((s) => ({ ...s, acting: v }))} />
            <SubRatingSlider label="Pacing" value={subRatings.pacing} onChange={(v) => setSubRatings((s) => ({ ...s, pacing: v }))} />
          </div>
        )}
        <div className="flex justify-end">
          <Button size="sm" disabled={submitting} onClick={submit}>
            <Send className="h-3.5 w-3.5" /> {t("reviews.postReview")}
          </Button>
        </div>
      </div>

      <div className="space-y-3">
        {sortedReviews.map((r) => (
          <div key={r.id} className="border-b border-[hsl(var(--foreground)/0.06)] pb-3 last:border-0">
            <div className="flex items-center justify-between">
              <span className="flex items-center gap-1.5 text-xs font-semibold">
                {r.userName}
                {r.verifiedWatch && (
                  <span className="flex items-center gap-0.5 rounded-full bg-emerald-500/15 px-1.5 py-0.5 text-[9px] font-medium text-emerald-400">
                    <BadgeCheck className="h-2.5 w-2.5" /> Verified Watch
                  </span>
                )}
              </span>
              <span className="flex items-center gap-1 text-xs text-yellow-400">
                <Star className="h-3 w-3 fill-yellow-400" /> {r.rating}/10
              </span>
            </div>
            <p className="mt-1 text-xs text-muted-foreground">{r.body}</p>
            {r.subRatings && (
              <div className="mt-1.5 flex gap-3 text-[10px] text-muted-foreground/80">
                <span>Story: {r.subRatings.story}/10</span>
                <span>Acting: {r.subRatings.acting}/10</span>
                <span>Pacing: {r.subRatings.pacing}/10</span>
              </div>
            )}
            <div className="mt-1.5 flex items-center gap-3">
              <p className="text-[10px] text-muted-foreground/60">{formatDistanceToNow(new Date(r.createdAt), { addSuffix: true })}</p>
              <button
                onClick={() => vote(r.id, "up")}
                disabled={!!votedIds[r.id]}
                className={cn("flex items-center gap-1 text-[10px]", votedIds[r.id] === "up" ? "text-accent" : "text-muted-foreground hover:text-foreground")}
              >
                <ThumbsUp className={cn("h-3 w-3", votedIds[r.id] === "up" && "fill-accent")} /> {r.helpfulCount > 0 ? r.helpfulCount : ""}
              </button>
              <button
                onClick={() => vote(r.id, "down")}
                disabled={!!votedIds[r.id]}
                className={cn("flex items-center gap-1 text-[10px]", votedIds[r.id] === "down" ? "text-rose-400" : "text-muted-foreground hover:text-foreground")}
              >
                <ThumbsDown className={cn("h-3 w-3", votedIds[r.id] === "down" && "fill-rose-400")} /> {r.unhelpfulCount > 0 ? r.unhelpfulCount : ""}
              </button>
            </div>
          </div>
        ))}
        {reviews.length === 0 && <p className="text-xs text-muted-foreground">Be the first to review this title.</p>}
      </div>
    </div>
  );
}
