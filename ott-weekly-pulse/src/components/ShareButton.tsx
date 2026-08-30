"use client";
import { useState } from "react";
import { Share2, Check, MessageCircle } from "lucide-react";
import { AnimatePresence, motion } from "framer-motion";

export function ShareButton({ title, url }: { title: string; url: string }) {
  const [open, setOpen] = useState(false);
  const [copied, setCopied] = useState(false);

  async function handleClick() {
    // Prefer the native share sheet (works great on mobile, where most
    // sharing actually happens) — fall back to a small link menu on
    // desktop browsers that don't support it.
    if (typeof navigator !== "undefined" && navigator.share) {
      try {
        await navigator.share({ title, url });
        return;
      } catch {
        // User cancelled the share sheet — not an error, just do nothing.
        return;
      }
    }
    setOpen((v) => !v);
  }

  async function copyLink() {
    await navigator.clipboard.writeText(url);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  const whatsappUrl = `https://wa.me/?text=${encodeURIComponent(`${title} — ${url}`)}`;
  const twitterUrl = `https://twitter.com/intent/tweet?text=${encodeURIComponent(title)}&url=${encodeURIComponent(url)}`;

  return (
    <div className="relative">
      <button
        onClick={handleClick}
        className="inline-flex items-center gap-1.5 rounded-full border border-[hsl(var(--foreground)/0.12)] bg-[hsl(var(--foreground)/0.02)] px-4 py-2 text-xs font-semibold hover:bg-[hsl(var(--foreground)/0.07)]"
      >
        <Share2 className="h-3.5 w-3.5" /> Share
      </button>

      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, y: 8, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 8, scale: 0.95 }}
            transition={{ duration: 0.15 }}
            className="glass-panel absolute bottom-full left-0 z-20 mb-2 w-44 space-y-1 p-2 shadow-xl"
          >
            <a
              href={whatsappUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-2 rounded-lg px-2 py-1.5 text-xs hover:bg-[hsl(var(--foreground)/0.08)]"
            >
              <MessageCircle className="h-3.5 w-3.5 text-emerald-500" /> WhatsApp
            </a>
            <a
              href={twitterUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-2 rounded-lg px-2 py-1.5 text-xs hover:bg-[hsl(var(--foreground)/0.08)]"
            >
              <Share2 className="h-3.5 w-3.5 text-sky-500" /> X / Twitter
            </a>
            <button
              onClick={copyLink}
              className="flex w-full items-center gap-2 rounded-lg px-2 py-1.5 text-left text-xs hover:bg-[hsl(var(--foreground)/0.08)]"
            >
              {copied ? <Check className="h-3.5 w-3.5 text-emerald-500" /> : <Share2 className="h-3.5 w-3.5" />}
              {copied ? "Copied!" : "Copy link"}
            </button>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
