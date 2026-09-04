// Single-owner admin gate — not a multi-user account system (that's
// explicitly out of scope), just a password-protected page so the site
// owner can fix data issues (bad poster, wrong language tag, a title the
// live APIs missed) without a code deploy. One shared password via
// ADMIN_PASSWORD env var; a signed cookie proves the session without
// storing the password itself in the cookie.
import "server-only";
import { createHmac, timingSafeEqual } from "crypto";

const COOKIE_NAME = "owp_admin_session";

function getSecret(): string | undefined {
  return process.env.ADMIN_PASSWORD;
}

function computeToken(secret: string): string {
  return createHmac("sha256", secret).update("owp-admin-session").digest("hex");
}

export function isAdminConfigured(): boolean {
  return !!getSecret();
}

export function verifyPassword(password: string): boolean {
  const secret = getSecret();
  if (!secret) return false;
  return password === secret;
}

export function getSessionCookieName(): string {
  return COOKIE_NAME;
}

export function getExpectedSessionToken(): string | null {
  const secret = getSecret();
  if (!secret) return null;
  return computeToken(secret);
}

export function isValidSessionToken(token: string | undefined): boolean {
  const expected = getExpectedSessionToken();
  if (!expected || !token) return false;
  const a = Buffer.from(token);
  const b = Buffer.from(expected);
  if (a.length !== b.length) return false;
  return timingSafeEqual(a, b);
}
