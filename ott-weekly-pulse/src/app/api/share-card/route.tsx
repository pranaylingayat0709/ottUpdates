import { ImageResponse } from "next/og";
import { NextRequest } from "next/server";
import { listTitlesForWeek, listWeeks } from "@/lib/data-source";
import { PLATFORM_LABELS } from "@/lib/types";

// 1080x1920 "story" image of the week's top 5, for WhatsApp / Instagram.
// Pure type-and-gradient layout (no remote poster fetches) so it renders
// fast and reliably. Reads the cached catalog: no extra API calls.
export const runtime = "nodejs";
export const revalidate = 600;

export async function GET(req: NextRequest) {
  const weeks = listWeeks();
  const week = weeks.find((w) => w.id === req.nextUrl.searchParams.get("week")) ?? weeks.find((w) => w.isCurrent)!;
  const titles = await listTitlesForWeek(week.id).catch(() => []);
  const top = [...titles]
    .sort((a, b) => Number(b.isMustWatch) - Number(a.isMustWatch) || (b.imdbRating ?? b.internalCriticRating ?? 0) - (a.imdbRating ?? a.internalCriticRating ?? 0))
    .slice(0, 5);

  return new ImageResponse(
    (
      <div style={{ width: "100%", height: "100%", display: "flex", flexDirection: "column", padding: 80, background: "linear-gradient(160deg,#1b0b3a 0%,#000 55%,#3a0b2a 100%)", color: "#fff", fontFamily: "sans-serif" }}>
        <div style={{ display: "flex", fontSize: 34, letterSpacing: 6, color: "#c4b5fd", textTransform: "uppercase" }}>OTT Weekly Pulse</div>
        <div style={{ display: "flex", fontSize: 92, fontWeight: 800, marginTop: 24, lineHeight: 1.05 }}>Top 5 this week</div>
        <div style={{ display: "flex", fontSize: 40, color: "#a1a1aa", marginTop: 16 }}>{week.label}</div>
        <div style={{ display: "flex", flexDirection: "column", marginTop: 70, gap: 34 }}>
          {top.map((t, i) => (
            <div key={t.id} style={{ display: "flex", alignItems: "center", gap: 36 }}>
              <div style={{ display: "flex", width: 110, height: 110, borderRadius: 55, alignItems: "center", justifyContent: "center", fontSize: 58, fontWeight: 800, background: "linear-gradient(135deg,#8b5cf6,#ec4899)" }}>{i + 1}</div>
              <div style={{ display: "flex", flexDirection: "column", flex: 1 }}>
                <div style={{ display: "flex", fontSize: 54, fontWeight: 700, lineHeight: 1.1 }}>{t.title.length > 26 ? `${t.title.slice(0, 25)}…` : t.title}</div>
                <div style={{ display: "flex", fontSize: 32, color: "#a1a1aa", marginTop: 6 }}>
                  {[t.type === "MOVIE" ? "Movie" : "Series", t.platforms[0] ? PLATFORM_LABELS[t.platforms[0]] : null, t.imdbRating ? `★ ${t.imdbRating}` : null].filter(Boolean).join("  ·  ")}
                </div>
              </div>
            </div>
          ))}
          {top.length === 0 && <div style={{ display: "flex", fontSize: 44, color: "#a1a1aa" }}>No picks yet — check back Friday.</div>}
        </div>
        <div style={{ display: "flex", marginTop: "auto", fontSize: 34, color: "#a1a1aa" }}>New movies & series every Friday · Hindi · Marathi · English</div>
      </div>
    ),
    { width: 1080, height: 1920 }
  );
}
