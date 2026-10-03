import Link from "next/link";

// Matches EmptyState's line-art style rather than a generic 404 — same
// self-contained inline SVG (no external image, themes via currentColor),
// just with a "?" in place of the checkmark to read as "not found" rather
// than "no results".
export default function NotFound() {
  return (
    <div className="flex min-h-[50vh] flex-col items-center justify-center gap-4 py-24 text-center">
      <svg width="96" height="96" viewBox="0 0 88 88" fill="none" className="text-muted-foreground/50" aria-hidden="true">
        <rect x="14" y="20" width="60" height="42" rx="6" stroke="currentColor" strokeWidth="2.5" />
        <path d="M14 32h60" stroke="currentColor" strokeWidth="2.5" />
        <circle cx="44" cy="47" r="9" stroke="currentColor" strokeWidth="2.5" />
        <path d="M41.3 44.5c.3-1.8 1.9-3 3.7-2.7 1.7.3 2.9 1.9 2.6 3.6-.2 1.2-1.1 1.9-1.9 2.4-.7.4-1.2.8-1.2 1.7" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" opacity="0.6" />
        <circle cx="44" cy="51.6" r="0.9" fill="currentColor" opacity="0.6" />
        <path d="M30 70l4-8M58 70l-4-8" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" />
      </svg>
      <div>
        <h1 className="text-2xl font-bold">Page not found</h1>
        <p className="mt-1 text-sm text-muted-foreground">It may have rotated out of this week's lineup, or the link's just wrong.</p>
      </div>
      <Link href="/" className="chip chip-active mt-2">Back to Weekly Pulse</Link>
    </div>
  );
}
