// Weekly digest email via Resend (https://resend.com) — free tier: 3,000
// emails/month, 100/day, no credit card for the trial. Optional: everything
// here is a silent no-op if RESEND_API_KEY isn't set, same pattern as every
// other integration in this project.
import "server-only";
import type { Title } from "@/lib/types";

function apiKey(): string | undefined {
  return process.env.RESEND_API_KEY;
}

export function isEmailEnabled(): boolean {
  return !!apiKey();
}

function digestHtml(titles: Title[], weekLabel: string): string {
  const rows = titles
    .slice(0, 10)
    .map(
      (t) => `
      <tr>
        <td style="padding:12px 0;border-bottom:1px solid #2a2a35;">
          <a href="${process.env.NEXT_PUBLIC_APP_URL ?? ""}/title/${t.id}" style="color:#fff;text-decoration:none;font-weight:600;font-size:15px;">${t.title}</a>
          <div style="color:#9a9aa5;font-size:12px;margin-top:2px;">
            ${t.type === "MOVIE" ? "Movie" : t.type === "SERIES" ? "Web Series" : "Documentary"} · ${t.originalLanguage} · ${t.platforms.join(", ")}
          </div>
        </td>
      </tr>`
    )
    .join("");

  return `
  <div style="background:#0a0a0f;padding:32px 16px;font-family:sans-serif;">
    <div style="max-width:480px;margin:0 auto;background:#141418;border-radius:16px;padding:24px;">
      <h1 style="color:#fff;font-size:20px;margin:0 0 4px;">OTT Weekly Pulse</h1>
      <p style="color:#9a9aa5;font-size:13px;margin:0 0 20px;">This week's picks · ${weekLabel}</p>
      <table width="100%" style="border-collapse:collapse;">${rows}</table>
      <p style="color:#6a6a75;font-size:11px;margin-top:24px;">
        You're receiving this because you subscribed at OTT Weekly Pulse.
        <a href="${process.env.NEXT_PUBLIC_APP_URL ?? ""}" style="color:#8b5cf6;">Visit the site</a>
      </p>
    </div>
  </div>`;
}

export async function sendWeeklyDigest(recipients: string[], titles: Title[], weekLabel: string): Promise<{ sent: number; failed: number }> {
  const key = apiKey();
  if (!key || recipients.length === 0) return { sent: 0, failed: 0 };

  const { Resend } = await import("resend");
  const resend = new Resend(key);
  const html = digestHtml(titles, weekLabel);
  const from = process.env.RESEND_FROM_EMAIL ?? "OTT Weekly Pulse <onboarding@resend.dev>";

  let sent = 0;
  let failed = 0;
  // Resend's free tier allows batch sending, but simple sequential sends
  // keep this robust across whatever limits apply to your specific plan.
  for (const to of recipients) {
    try {
      await resend.emails.send({ from, to, subject: `This week on OTT: ${weekLabel}`, html });
      sent++;
    } catch {
      failed++;
    }
  }
  return { sent, failed };
}
