import type { Genre } from "@/lib/types";

// Mood is a fuzzy, compound filter (a vibe, not a single genre), so it's
// applied client-side as a post-filter over the genres already on each
// title rather than sent to the API as another exact-match field.
export type MoodKey = "LIGHT_FUN" | "EDGE_OF_SEAT" | "HEARTFELT" | "MIND_BENDING" | "FEEL_GOOD_FAMILY";

export const MOOD_OPTIONS: { value: MoodKey; label: string; genres: Genre[] }[] = [
  { value: "LIGHT_FUN", label: "Light & Fun", genres: ["COMEDY", "MUSICAL", "SPORTS"] },
  { value: "EDGE_OF_SEAT", label: "Edge of Seat", genres: ["THRILLER", "CRIME", "ACTION", "MYSTERY"] },
  { value: "HEARTFELT", label: "Heartfelt", genres: ["DRAMA", "ROMANCE", "BIOPIC"] },
  { value: "MIND_BENDING", label: "Mind-Bending", genres: ["SCI_FI", "FANTASY", "MYSTERY"] },
  { value: "FEEL_GOOD_FAMILY", label: "Feel-Good Family", genres: ["FAMILY", "COMEDY"] }
];

export function matchesMood(genres: Genre[], mood: MoodKey | "ALL" | undefined): boolean {
  if (!mood || mood === "ALL") return true;
  const wanted = MOOD_OPTIONS.find((m) => m.value === mood)?.genres ?? [];
  return genres.some((g) => wanted.includes(g));
}

// Runtime / binge filter: "SHORT" is quick movies under 100 minutes,
// "BINGE" is series with a full season (6+ episodes) worth burning through.
export type RuntimeKey = "SHORT" | "BINGE";

export function matchesRuntime(
  title: { type: string; runtimeMinutes?: number | null; totalEpisodes?: number | null },
  runtime: RuntimeKey | "ALL" | undefined
): boolean {
  if (!runtime || runtime === "ALL") return true;
  if (runtime === "SHORT") return title.type === "MOVIE" && !!title.runtimeMinutes && title.runtimeMinutes <= 100;
  if (runtime === "BINGE") return title.type === "SERIES" && !!title.totalEpisodes && title.totalEpisodes >= 6;
  return true;
}
