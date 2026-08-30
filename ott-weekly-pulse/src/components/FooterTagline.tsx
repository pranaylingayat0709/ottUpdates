"use client";
import { useI18n } from "@/components/LanguageProvider";

export function FooterTagline() {
  const { t } = useI18n();
  return (
    <>
      OTT Weekly Pulse · {t("footer.tagline")} ·{" "}
      <span className="text-foreground/70">Built with Next.js, Tailwind & NVIDIA NIM</span>
    </>
  );
}
