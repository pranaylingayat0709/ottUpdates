import type { Metadata } from "next";
import "./globals.css";
import { Providers } from "@/components/Providers";
import { SiteHeader } from "@/components/SiteHeader";

// Using the system font stack (configured in tailwind.config.ts / globals.css)
// instead of next/font/google so the app builds and renders instantly in
// network-restricted environments too. Swap in next/font/google's Inter
// loader here if you want a bundled webfont in production.

export const metadata: Metadata = {
  title: "OTT Weekly Pulse — Weekly Movie & Series Picks",
  description:
    "Curated weekly movie and web series recommendations across Netflix, Prime Video, Disney+ Hotstar, JioCinema, SonyLIV, ZEE5 and more — English, Hindi & Marathi, every Friday.",
  keywords: ["OTT", "weekly releases", "movies", "web series", "Netflix", "Prime Video", "Hotstar", "reviews"],
};

export const viewport = { themeColor: "#0a0a0f" };

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className="dark">
      <body className="min-h-screen font-sans">
        <Providers>
          <SiteHeader />
          <main className="mx-auto max-w-7xl px-4 pb-24 pt-6 sm:px-6 lg:px-8">{children}</main>
          <footer className="border-t border-white/5 py-8 text-center text-xs text-muted-foreground">
            OTT Weekly Pulse · Fresh Friday–Thursday picks across English, Hindi & Marathi ·{" "}
            <span className="text-foreground/70">Built with Next.js, Tailwind & NVIDIA NIM</span>
          </footer>
        </Providers>
      </body>
    </html>
  );
}
