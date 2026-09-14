import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function getOrCreateUserToken(): string {
  if (typeof window === "undefined") return "";
  const KEY = "owp_user_token";
  let token = window.localStorage.getItem(KEY);
  if (!token) {
    token = crypto.randomUUID();
    window.localStorage.setItem(KEY, token);
  }
  return token;
}

export function formatRuntime(minutes?: number | null): string {
  if (!minutes) return "";
  const h = Math.floor(minutes / 60);
  const m = minutes % 60;
  return h > 0 ? `${h}h ${m}m` : `${m}m`;
}

// A generic shimmer-effect SVG, base64-encoded, used as Next/Image's
// blurDataURL for every poster/backdrop. Not a per-image blur hash (that
// would need server-side image processing we don't have) — just a
// tasteful, universal "loading" shimmer so images fade in smoothly
// instead of popping in abruptly, regardless of the actual image content.
const shimmer = (w: number, h: number) => `
<svg width="${w}" height="${h}" xmlns="http://www.w3.org/2000/svg">
  <defs>
    <linearGradient id="g">
      <stop stop-color="#1a1a24" offset="20%" />
      <stop stop-color="#2a2a38" offset="50%" />
      <stop stop-color="#1a1a24" offset="70%" />
    </linearGradient>
  </defs>
  <rect width="${w}" height="${h}" fill="#1a1a24" />
  <rect width="${w}" height="${h}" fill="url(#g)" />
</svg>`;

const toBase64 = (str: string) =>
  typeof window === "undefined" ? Buffer.from(str).toString("base64") : window.btoa(str);

export function blurDataUrl(w = 32, h = 48): string {
  return `data:image/svg+xml;base64,${toBase64(shimmer(w, h))}`;
}
