import type { Metadata } from "next";
import "./globals.css";
import { Providers } from "@/components/Providers";
import { ThemeProvider } from "@/components/ThemeProvider";
import { LanguageProvider } from "@/components/LanguageProvider";
import { SiteHeader } from "@/components/SiteHeader";
import { FooterTagline } from "@/components/FooterTagline";
import { TrailerPlayer } from "@/components/TrailerPlayer";

// Using the system font stack (configured in tailwind.config.ts / globals.css)
// instead of next/font/google so the app builds and renders instantly in
// network-restricted environments too. Swap in next/font/google's Inter
// loader here if you want a bundled webfont in production.

export const metadata: Metadata = {
  title: "OTT Weekly Pulse — Weekly Movie & Series Picks",
  description:
    "Curated weekly movie and web series recommendations across Netflix, Prime Video, JioHotstar, SonyLIV, ZEE5 and more — Hindi, Marathi & English, every Friday.",
  keywords: ["OTT", "weekly releases", "movies", "web series", "Bollywood", "Marathi", "Netflix", "Prime Video", "JioHotstar", "reviews"],
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
})();
`;

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className="dark" suppressHydrationWarning>
      <head>
        <script dangerouslySetInnerHTML={{ __html: THEME_INIT_SCRIPT }} />
      </head>
      <body className="min-h-screen font-sans">
        <ThemeProvider>
          <LanguageProvider>
            <Providers>
              <SiteHeader />
              <main className="mx-auto max-w-7xl px-4 pb-24 pt-6 sm:px-6 lg:px-8">{children}</main>
              <footer className="border-t py-8 text-center text-xs text-muted-foreground" style={{ borderColor: "hsl(var(--foreground) / 0.06)" }}>
                <FooterTagline />
              </footer>
              <TrailerPlayer />
            </Providers>
          </LanguageProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
