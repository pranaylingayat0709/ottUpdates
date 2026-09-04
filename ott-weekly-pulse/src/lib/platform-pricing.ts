// Approximate starting monthly prices (INR) for reference only — these
// change often, vary by plan tier/region/promo, and are NOT fetched from
// any live source (no pricing API is integrated). Always labeled
// "approx." / "starting from" in the UI, with a note to check the
// platform directly. Update this file periodically; it will go stale.
import type { Platform } from "@/lib/types";

export const PLATFORM_STARTING_PRICE_INR: Partial<Record<Platform, number>> = {
  NETFLIX: 149,
  PRIME_VIDEO: 299, // annual plan, monthly-equivalent approx
  JIOHOTSTAR: 149,
  DISNEY_HOTSTAR: 149,
  JIOCINEMA: 29,
  SONYLIV: 299,
  ZEE5: 149,
  APPLE_TV: 99,
  MUBI: 229,
  AHA: 69,
  SUNNXT: 99
};

export function formatStartingPrice(platform: Platform): string | null {
  const price = PLATFORM_STARTING_PRICE_INR[platform];
  return price ? `₹${price}/mo` : null;
}
