"use client";
import { useState } from "react";
import { RefreshCw } from "lucide-react";
import { syncKeys } from "@/lib/sync-keys";

type Msg = { kind: "ok" | "err"; text: string } | null;

// Manual snapshot sync between devices using a short code. Last write wins,
// and anyone who knows the code can read the snapshot, so it's framed as a
// transfer tool rather than an account.
export function SyncPanel() {
  const [code, setCode] = useState("");
  const [entered, setEntered] = useState("");
  const [msg, setMsg] = useState<Msg>(null);
  const [busy, setBusy] = useState(false);

  async function upload() {
    setBusy(true);
    setMsg(null);
    try {
      const data: Record<string, string> = {};
      for (const k of syncKeys()) {
        const v = localStorage.getItem(k);
        if (v) data[k] = v;
      }
      const res = await fetch("/api/sync", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ code: code || undefined, data }) });
      const json = await res.json();
      if (res.status === 503) setMsg({ kind: "err", text: "Sync isn't enabled on this deployment (it needs Vercel KV)." });
      else if (!res.ok) setMsg({ kind: "err", text: json.error === "rate_limited" ? "Too many attempts — try again later." : "Couldn't save your snapshot." });
      else {
        setCode(json.code);
        setMsg({ kind: "ok", text: `Saved. Enter ${json.code} on your other device.` });
      }
    } catch {
      setMsg({ kind: "err", text: "Network error — try again." });
    } finally {
      setBusy(false);
    }
  }

  async function restore() {
    setBusy(true);
    setMsg(null);
    try {
      const res = await fetch(`/api/sync?code=${encodeURIComponent(entered)}`);
      const json = await res.json();
      if (res.status === 503) setMsg({ kind: "err", text: "Sync isn't enabled on this deployment (it needs Vercel KV)." });
      else if (!res.ok) setMsg({ kind: "err", text: json.error === "not_found" ? "No snapshot found for that code." : "That code doesn't look right." });
      else {
        const allowed = new Set(syncKeys());
        for (const [k, v] of Object.entries(json.data as Record<string, string>)) if (allowed.has(k)) localStorage.setItem(k, v);
        setMsg({ kind: "ok", text: "Restored — reloading…" });
        setTimeout(() => window.location.reload(), 600);
      }
    } catch {
      setMsg({ kind: "err", text: "Network error — try again." });
    } finally {
      setBusy(false);
    }
  }

  return (
    <section className="glass-panel mb-6 p-4" aria-label="Sync across devices">
      <h2 className="mb-1 flex items-center gap-2 text-sm font-bold"><RefreshCw className="h-4 w-4 text-accent" /> Sync across devices</h2>
      <p className="mb-3 text-xs text-muted-foreground">
        Copies your watchlist, watched list, diary, platforms and taste to a short code. It&apos;s a manual snapshot (latest save wins), not an account — anyone with the code can restore it, so don&apos;t share it.
      </p>
      <div className="flex flex-wrap items-center gap-2">
        <button onClick={upload} disabled={busy} className="chip chip-active">{code ? "Update snapshot" : "Create sync code"}</button>
        {code && <code className="rounded-lg bg-[hsl(var(--foreground)/0.08)] px-2.5 py-1 text-sm font-bold tracking-widest">{code}</code>}
      </div>
      <form className="mt-3 flex flex-wrap items-center gap-2" onSubmit={(e) => { e.preventDefault(); void restore(); }}>
        <input value={entered} onChange={(e) => setEntered(e.target.value.toUpperCase())} maxLength={9} placeholder="Enter code" aria-label="Sync code" className="h-9 w-36 rounded-full border bg-transparent px-3 text-sm uppercase tracking-widest" style={{ borderColor: "hsl(var(--foreground) / 0.2)" }} />
        <button type="submit" disabled={busy || entered.length < 8} className="chip">Restore here</button>
      </form>
      {msg && <p role="status" className={`mt-2 text-xs ${msg.kind === "ok" ? "text-emerald-400" : "text-rose-400"}`}>{msg.text}</p>}
    </section>
  );
}
