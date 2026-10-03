import type { Metadata } from "next";
import { Inter, Sora } from "next/font/google";
import { Analytics } from "@vercel/analytics/react";
import "./globals.css";
import { Providers } from "@/components/Providers";
import { ThemeProvider } from "@/components/ThemeProvider";
import { AccentProvider } from "@/components/AccentProvider";
import { LanguageProvider } from "@/components/LanguageProvider";
import { SiteHeader } from "@/components/SiteHeader";
import { FooterTagline } from "@/components/FooterTagline";
import { TrailerPlayer } from "@/components/TrailerPlayer";
import { ServiceWorkerRegister } from "@/components/ServiceWorkerRegister";
import { NewsletterSignup } from "@/components/NewsletterSignup";
import { MobileBottomNav } from "@/components/MobileBottomNav";
import { BackToTop } from "@/components/BackToTop";
import { KeyboardShortcuts } from "@/components/KeyboardShortcuts";
import { CollectionImportHandler } from "@/components/CollectionImportHandler";
import { Suspense } from "react";

// Inter for body copy (readable, neutral at small sizes) and Sora for
// display/heading use — a bolder, slightly geometric face that gives
// titles and section headers real presence instead of the previous
// system-font-everywhere look. next/font/google self-hosts both at build
// time (Vercel's build has full network access), so there's no runtime
// request to Google Fonts and no font-loading flash. Falls back to
// system-ui if a build ever runs somewhere without network access.
const inter = Inter({ subsets: ["latin"], variable: "--font-sans", display: "swap" });
const sora = Sora({ subsets: ["latin"], weight: ["600", "700", "800"], variable: "--font-display", display: "swap" });

export const metadata: Metadata = {
  title: "OTT Weekly Pulse — Weekly Movie & Series Picks",
  description:
    "Curated weekly movie and web series recommendations across Netflix, Prime Video, JioHotstar, SonyLIV, ZEE5 and more — Hindi, Marathi & English, every Friday.",
  keywords: ["OTT", "weekly releases", "movies", "web series", "Bollywood", "Marathi", "Netflix", "Prime Video", "JioHotstar", "reviews"],
  manifest: "/manifest.json",
  appleWebApp: { capable: true, statusBarStyle: "black-translucent", title: "OTT Pulse" },
  icons: {
    icon: [{ url: "/icon-192.png", sizes: "192x192", type: "image/png" }],
    apple: [{ url: "/icon-192.png", sizes: "192x192", type: "image/png" }]
  },
  verification: {
    google: "-Phi7j5fz9Pcg0v2SOFivrnF7dfME3OVVc-TwRx7QQM"
  }
};

export const viewport = { themeColor: "#0a0a0f" };

// Runs before React hydrates so the correct theme class is on <html> from
// the very first paint — prevents a flash of the wrong theme on load.
const THEME_INIT_SCRIPT = `
(function() {
  try {
    var stored = localStorage.getItem('owp-theme');
    var isDark = stored ? stored === 'dark' : window.matchMedia('(prefers-color-scheme: dark)').matches;
    document.documentElement.classList.toggle('dark', isDark);
  } catch (e) {
    document.documentElement.classList.add('dark');
  }
  try {
    var accent = localStorage.getItem('owp-accent');
    if (accent) document.documentElement.setAttribute('data-accent', accent);
  } catch (e) {}
})();
`;

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={`dark ${inter.variable} ${sora.variable}`} suppressHydrationWarning>
      <head>
        <script dangerouslySetInnerHTML={{ __html: THEME_INIT_SCRIPT }} />
      </head>
      <body className="min-h-screen font-sans">
        <ThemeProvider>
          <AccentProvider>
          <LanguageProvider>
            <Providers>
              <SiteHeader />
              <main className="mx-auto max-w-7xl px-4 pb-24 pt-6 sm:px-6 lg:px-8">{children}</main>
              <footer className="border-t py-8 text-center text-xs text-muted-foreground" style={{ borderColor: "hsl(var(--foreground) / 0.06)" }}>
                <div className="mx-auto mb-6 max-w-sm px-4">
                  <NewsletterSignup />
                </div>
                <FooterTagline />
              </footer>
              <TrailerPlayer />
              <ServiceWorkerRegister />
              <MobileBottomNav />
              <BackToTop />
              <KeyboardShortcuts />
              <Suspense fallback={null}>
                <CollectionImportHandler />
              </Suspense>
            </Providers>
          </LanguageProvider>
          </AccentProvider>
        </ThemeProvider>
        <Analytics />
      </body>
    </html>
  );
}
