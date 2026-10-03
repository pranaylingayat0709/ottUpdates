// Small reusable inline-SVG illustration for empty/no-results states,
// replacing plain text-only messages. Deliberately simple line art (no
// external image request, themes automatically via currentColor) rather
// than a stock illustration, so it stays lightweight and on-brand.
export function EmptyState({ message, hint }: { message: string; hint?: string }) {
  return (
    <div className="flex flex-col items-center justify-center gap-3 py-14 text-center">
      <svg
        width="88"
        height="88"
        viewBox="0 0 88 88"
        fill="none"
        className="text-muted-foreground/50"
        aria-hidden="true"
      >
        <rect x="14" y="20" width="60" height="42" rx="6" stroke="currentColor" strokeWidth="2.5" />
        <path d="M14 32h60" stroke="currentColor" strokeWidth="2.5" />
        <circle cx="44" cy="47" r="9" stroke="currentColor" strokeWidth="2.5" />
        <path d="M41 47l2 2 4-4" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" opacity="0.5" />
        <path d="M30 70l4-8M58 70l-4-8" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" />
      </svg>
      <div>
        <p className="text-sm font-medium text-muted-foreground">{message}</p>
        {hint && <p className="mt-1 text-xs text-muted-foreground/70">{hint}</p>}
      </div>
    </div>
  );
}
