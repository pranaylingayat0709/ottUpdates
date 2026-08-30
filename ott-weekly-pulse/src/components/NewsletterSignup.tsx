"use client";
import { useState } from "react";
import { Mail, Check } from "lucide-react";
import { Button } from "@/components/ui/button";

export function NewsletterSignup() {
  const [email, setEmail] = useState("");
  const [status, setStatus] = useState<"idle" | "loading" | "done" | "error">("idle");

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (!email) return;
    setStatus("loading");
    try {
      const res = await fetch("/api/newsletter/subscribe", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email })
      });
      setStatus(res.ok ? "done" : "error");
    } catch {
      setStatus("error");
    }
  }

  if (status === "done") {
    return (
      <p className="flex items-center justify-center gap-1.5 text-xs text-emerald-400">
        <Check className="h-3.5 w-3.5" /> You're in — Friday's picks land in your inbox.
      </p>
    );
  }

  return (
    <form onSubmit={submit} className="flex gap-2">
      <div className="relative flex-1">
        <Mail className="pointer-events-none absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-muted-foreground" />
        <input
          type="email"
          required
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="Get the weekly digest by email"
          className="w-full rounded-full border border-[hsl(var(--foreground)/0.1)] bg-[hsl(var(--foreground)/0.04)] py-2 pl-9 pr-3 text-xs placeholder:text-muted-foreground focus:border-primary/50 focus:outline-none focus:ring-1 focus:ring-primary/50"
        />
      </div>
      <Button type="submit" size="sm" disabled={status === "loading"}>
        Subscribe
      </Button>
      {status === "error" && <p className="text-xs text-rose-400">Something went wrong — try again.</p>}
    </form>
  );
}
