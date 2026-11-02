// Minimal, dependency-free .ics (iCalendar) file generator — just enough
// for a single all-day "release day" event, downloaded client-side via a
// blob URL. No server round-trip needed.
function icsEscape(text: string): string {
  return text.replace(/[\\,;]/g, (m) => `\\${m}`).replace(/\n/g, "\\n");
}

function toIcsDate(iso: string): string {
  // All-day event: just the date portion, no time/timezone component.
  return iso.slice(0, 10).replace(/-/g, "");
}

export function downloadReleaseReminderIcs(title: { title: string; releaseDate: string; synopsis?: string }) {
  const dtStart = toIcsDate(title.releaseDate);
  const startDate = new Date(title.releaseDate);
  const endDate = new Date(startDate);
  endDate.setDate(endDate.getDate() + 1);
  const dtEnd = toIcsDate(endDate.toISOString());
  const uid = `owp-${dtStart}-${title.title.replace(/\s+/g, "-").toLowerCase()}@ottweeklypulse`;
  const dtStamp = new Date().toISOString().replace(/[-:]/g, "").split(".")[0] + "Z";

  const lines = [
    "BEGIN:VCALENDAR",
    "VERSION:2.0",
    "PRODID:-//OTT Weekly Pulse//Release Reminder//EN",
    "CALSCALE:GREGORIAN",
    "BEGIN:VEVENT",
    `UID:${uid}`,
    `DTSTAMP:${dtStamp}`,
    `DTSTART;VALUE=DATE:${dtStart}`,
    `DTEND;VALUE=DATE:${dtEnd}`,
    `SUMMARY:${icsEscape(`${title.title} releases today`)}`,
    title.synopsis ? `DESCRIPTION:${icsEscape(title.synopsis.slice(0, 300))}` : "",
    "END:VEVENT",
    "END:VCALENDAR"
  ].filter(Boolean);

  const blob = new Blob([lines.join("\r\n")], { type: "text/calendar;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `${title.title.replace(/[^a-z0-9]+/gi, "-").toLowerCase()}.ics`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}


// Server-side: one all-day event per title for a whole release week, served
// from /api/calendar. Folded to <=75 octets per RFC 5545 isn't strictly
// required by common clients for short lines, so lines are kept short instead.
export function buildWeekIcs(
  weekLabel: string,
  titles: { id: string; title: string; releaseDate: string; type: string; platforms: string[]; synopsis?: string }[],
  baseUrl: string
): string {
  const stamp = new Date().toISOString().replace(/[-:]/g, "").split(".")[0] + "Z";
  const lines = [
    "BEGIN:VCALENDAR",
    "VERSION:2.0",
    "PRODID:-//OTT Weekly Pulse//Week Calendar//EN",
    "CALSCALE:GREGORIAN",
    `X-WR-CALNAME:OTT Weekly Pulse`,
    `X-WR-CALDESC:${icsEscape(`New OTT releases, ${weekLabel}`)}`
  ];
  for (const t of titles) {
    const start = toIcsDate(t.releaseDate);
    const end = new Date(t.releaseDate);
    end.setDate(end.getDate() + 1);
    lines.push(
      "BEGIN:VEVENT",
      `UID:owp-${t.id}@ottweeklypulse`,
      `DTSTAMP:${stamp}`,
      `DTSTART;VALUE=DATE:${start}`,
      `DTEND;VALUE=DATE:${toIcsDate(end.toISOString())}`,
      `SUMMARY:${icsEscape(`${t.title} (${t.type === "MOVIE" ? "Movie" : "Series"}) on ${t.platforms.slice(0, 2).join(", ") || "OTT"}`)}`,
      `URL:${baseUrl}/title/${t.id}`,
      t.synopsis ? `DESCRIPTION:${icsEscape(t.synopsis.slice(0, 200))}` : "",
      "END:VEVENT"
    );
  }
  lines.push("END:VCALENDAR");
  return lines.filter(Boolean).join("\r\n");
}
