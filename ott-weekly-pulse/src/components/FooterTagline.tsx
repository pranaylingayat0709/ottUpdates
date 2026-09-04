"use client";
import Link from "next/link";
import { useI18n } from "@/components/LanguageProvider";

export function FooterTagline() {
  const { t } = useI18n();
  return (
    <>
      <div className="mb-3 flex flex-wrap justify-center gap-4 text-xs">
        <Link href="/top-10" className="text-muted-foreground hover:text-accent">Top 10</Link>
        <Link href="/best-of-month" className="text-muted-foreground hover:text-accent">Best of the Month</Link>
        <Link href="/wrapped" className="text-muted-foreground hover:text-accent">Your Wrapped</Link>
        <a href="/feed.xml" className="text-muted-foreground hover:text-accent">RSS Feed</a>
      </div>
      OTT Weekly Pulse · {t("footer.tagline")} ·{" "}
      <span className="text-foreground/70">Built with Next.js, Tailwind & NVIDIA NIM</span>
    </>
  );
}
