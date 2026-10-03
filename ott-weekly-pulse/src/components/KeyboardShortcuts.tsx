"use client";
import { useEffect } from "react";
import { useRouter } from "next/navigation";

// Global power-user shortcuts, mounted once at the root layout:
//  /  — jump to and focus the search input (like GitHub, Linear, etc.)
//  g h — go home
// Esc is left alone — Radix's own Dialog/Popover components already
// handle it for whatever's open, so adding a second handler here would
// just risk double-firing.
export function KeyboardShortcuts() {
  const router = useRouter();

  useEffect(() => {
    let lastKey = "";
    let lastKeyAt = 0;

    function isTypingTarget(el: EventTarget | null): boolean {
      if (!(el instanceof HTMLElement)) return false;
      const tag = el.tagName;
      return tag === "INPUT" || tag === "TEXTAREA" || el.isContentEditable;
    }

    function onKeyDown(e: KeyboardEvent) {
      if (e.metaKey || e.ctrlKey || e.altKey) return;
      if (isTypingTarget(e.target)) return;

      if (e.key === "/") {
        e.preventDefault();
        const el = document.getElementById("site-search-input") as HTMLInputElement | null;
        el?.scrollIntoView({ behavior: "smooth", block: "center" });
        el?.focus();
        return;
      }

      const now = Date.now();
      if (lastKey === "g" && e.key === "h" && now - lastKeyAt < 600) {
        router.push("/");
        lastKey = "";
        return;
      }
      lastKey = e.key;
      lastKeyAt = now;
    }

    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [router]);

  return null;
}
