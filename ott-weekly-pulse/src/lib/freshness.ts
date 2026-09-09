import { isSameWeek } from "@/lib/week";
import type { Title } from "@/lib/types";

/**
 * "New This Week" if the title's real release date falls within the
 * currently-displayed week; "Still Streaming" if it's from an earlier
 * week but still surfaced (live sources bias toward a ~3-week recency
 * window + popularity, so a title can legitimately be a couple of weeks
 * old and still show up because it's trending). Distinguishes "just
 * dropped" from "still popular" rather than implying everything shown is
 * brand new.
 */
export function isNewThisWeek(title: Title): boolean {
  return isSameWeek(new Date(title.releaseDate), new Date(title.weekStartDate));
}
