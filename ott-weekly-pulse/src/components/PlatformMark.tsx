import { PLATFORM_COLORS, PLATFORM_LABELS, type Platform } from "@/lib/types";
import { cn } from "@/lib/utils";

// Brand-colored monogram tiles. These are deliberately NOT the platforms'
// real logos — trademarked artwork can't be bundled or hot-linked safely —
// but a tinted rounded tile with the platform's initials reads the same way
// at a glance (like the provider chips on JustWatch) and costs zero network
// requests. Swap `MONOGRAMS` rendering for <Image> tags if licensed logo
// files are ever added under /public/platforms.
const MONOGRAMS: Record<Platform, string> = {
  NETFLIX: "N",
  PRIME_VIDEO: "P",
  DISNEY_HOTSTAR: "D+",
  JIOHOTSTAR: "JH",
  JIOCINEMA: "JC",
  SONYLIV: "S",
  ZEE5: "Z5",
  APPLE_TV: "tv",
  MUBI: "M",
  AHA: "a",
  SUNNXT: "SN"
};

const SIZES = {
  xs: "h-4 w-4 text-[7px] rounded-[4px]",
  sm: "h-5 w-5 text-[8px] rounded-md",
  md: "h-7 w-7 text-[10px] rounded-lg"
} as const;

export function PlatformMark({
  platform,
  size = "sm",
  className
}: {
  platform: Platform;
  size?: keyof typeof SIZES;
  className?: string;
}) {
  return (
    <span
      role="img"
      aria-label={PLATFORM_LABELS[platform] ?? platform}
      title={PLATFORM_LABELS[platform] ?? platform}
      className={cn(
        "inline-flex shrink-0 items-center justify-center font-extrabold leading-none tracking-tight text-white shadow-sm ring-1 ring-white/15",
        SIZES[size],
        className
      )}
      style={{ backgroundColor: PLATFORM_COLORS[platform] ?? "#555" }}
    >
      {MONOGRAMS[platform] ?? platform.slice(0, 2)}
    </span>
  );
}
