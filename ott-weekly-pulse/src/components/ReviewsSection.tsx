"use client";
import { useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { MessageSquare, Send, Star } from "lucide-react";
import type { Review } from "@/lib/types";
import { formatDistanceToNow } from "date-fns";
import { Button } from "@/components/ui/button";

export function ReviewsSection({ titleId }: { titleId: string }) {
  const qc = useQueryClient();
  const [userName, setUserName] = useState("");
  const [rating, setRating] = useState(8);
  const [body, setBody] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const { data: reviews = [] } = useQuery({
    queryKey: ["reviews", titleId],
    queryFn: () => fetch(`/api/titles/${titleId}/reviews`).then((r) => r.json()).then((d) => d.reviews as Review[])
  });

  async function submit() {
    if (!userName.trim() || !body.trim()) return;
    setSubmitting(true);
    try {
      await fetch(`/api/titles/${titleId}/reviews`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userName, rating, body })
      });
      setBody("");
      qc.invalidateQueries({ queryKey: ["reviews", titleId] });
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="space-y-4">
      <h4 className="flex items-center gap-2 text-sm font-bold">
        <MessageSquare className="h-4 w-4 text-accent" /> User Reviews ({reviews.length})
      </h4>

      <div className="glass-panel space-y-2 p-3">
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
        <div className="flex justify-end">
          <Button size="sm" disabled={submitting} onClick={submit}>
            <Send className="h-3.5 w-3.5" /> Post review
          </Button>
        </div>
      </div>

      <div className="space-y-3">
        {reviews.map((r) => (
          <div key={r.id} className="border-b border-[hsl(var(--foreground)/0.06)] pb-3 last:border-0">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold">{r.userName}</span>
              <span className="flex items-center gap-1 text-xs text-yellow-400">
                <Star className="h-3 w-3 fill-yellow-400" /> {r.rating}/10
              </span>
            </div>
            <p className="mt-1 text-xs text-muted-foreground">{r.body}</p>
            <p className="mt-1 text-[10px] text-muted-foreground/60">{formatDistanceToNow(new Date(r.createdAt), { addSuffix: true })}</p>
          </div>
        ))}
        {reviews.length === 0 && <p className="text-xs text-muted-foreground">Be the first to review this title.</p>}
      </div>
    </div>
  );
}
