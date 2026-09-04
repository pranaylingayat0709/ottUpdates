import { ImageResponse } from "next/og";
import { getTitleById } from "@/lib/data-source";

// Deliberately NOT edge runtime — our data layer (KV cache, live API
// fetchers) isn't guaranteed edge-compatible, and next/og's ImageResponse
// works fine on the default Node.js runtime too.
export const alt = "OTT Weekly Pulse";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

// Dynamic per-title Open Graph image — when a title page is shared on
// WhatsApp/X/Facebook, the link preview shows this instead of a generic
// site-wide image, with the actual poster art and title details baked in.
export default async function Image({ params }: { params: { id: string } }) {
  const title = await getTitleById(params.id);

  if (!title) {
    return new ImageResponse(
      (
        <div style={{ display: "flex", width: "100%", height: "100%", background: "#0a0a0f", color: "#fff", alignItems: "center", justifyContent: "center", fontSize: 48 }}>
          OTT Weekly Pulse
        </div>
      ),
      size
    );
  }

  return new ImageResponse(
    (
      <div
        style={{
          display: "flex",
          width: "100%",
          height: "100%",
          background: "linear-gradient(135deg, #0a0a0f 0%, #1a0a24 100%)",
          padding: 64,
          fontFamily: "sans-serif"
        }}
      >
        <img
          src={title.posterUrl}
          width={340}
          height={510}
          style={{ borderRadius: 24, objectFit: "cover", boxShadow: "0 20px 60px rgba(0,0,0,0.5)" }}
        />
        <div style={{ display: "flex", flexDirection: "column", justifyContent: "center", marginLeft: 56, flex: 1 }}>
          <div style={{ display: "flex", color: "#a78bfa", fontSize: 22, fontWeight: 600, marginBottom: 12 }}>OTT WEEKLY PULSE</div>
          <div style={{ display: "flex", color: "#fff", fontSize: 56, fontWeight: 800, lineHeight: 1.1, marginBottom: 20 }}>
            {title.title}
          </div>
          <div style={{ display: "flex", color: "#c4c4d0", fontSize: 26 }}>
            {title.type === "MOVIE" ? "Movie" : title.type === "SERIES" ? "Web Series" : "Documentary"}
            {"  ·  "}
            {title.originalLanguage.charAt(0) + title.originalLanguage.slice(1).toLowerCase()}
            {"  ·  "}
            {title.platforms[0]?.replace("_", " ")}
          </div>
        </div>
      </div>
    ),
    size
  );
}
