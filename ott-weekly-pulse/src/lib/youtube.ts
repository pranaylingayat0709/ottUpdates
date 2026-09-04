/** Extracts an 11-character YouTube video ID from common URL formats. */
export function extractYouTubeId(url: string): string | null {
  try {
    const u = new URL(url);
    if (u.hostname.includes("youtu.be")) return u.pathname.slice(1) || null;
    if (u.hostname.includes("youtube.com")) {
      if (u.searchParams.get("v")) return u.searchParams.get("v");
      const embedMatch = u.pathname.match(/\/embed\/([^/?]+)/);
      if (embedMatch) return embedMatch[1];
    }
    return null;
  } catch {
    return null;
  }
}

export type TrailerAction =
  | { kind: "play"; videoId: string } // confirmed video — play in-app
  | { kind: "external"; url: string } // confirmed link, but not YouTube — open in a new tab
  | { kind: "search"; url: string }; // no confirmed link — offer a YouTube search instead of nothing

/**
 * Every title gets SOME trailer action, never a dead end: play in-app if
 * we have a real YouTube link, open externally if we have a real link to
 * a different host, or fall back to a YouTube search for titles no data
 * source has trailer info for yet.
 */
export function getTrailerAction(title: string, trailerUrl?: string | null): TrailerAction {
  if (trailerUrl) {
    const videoId = extractYouTubeId(trailerUrl);
    if (videoId) return { kind: "play", videoId };
    return { kind: "external", url: trailerUrl };
  }
  return { kind: "search", url: `https://www.youtube.com/results?search_query=${encodeURIComponent(`${title} official trailer`)}` };
}
