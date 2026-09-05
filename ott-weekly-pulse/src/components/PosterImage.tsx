"use client";
import Image from "next/image";
import { useState } from "react";
import { Film } from "lucide-react";
import { cn } from "@/lib/utils";

interface PosterImageProps {
  src?: string | null;
  alt: string;
  fill?: boolean;
  width?: number;
  height?: number;
  sizes?: string;
  className?: string;
  priority?: boolean;
  label?: string;
}

// Replaces raw next/image usage for any poster/backdrop that might not
// have real art. Previously this fell back to an external placeholder
// service (placehold.co) — but relying on ANY external network request
// for something as fundamental as "show something instead of nothing" is
// fragile (the exact same category of risk as TMDB being blocked in
// India). This renders a pure CSS/SVG fallback with zero network
// dependency whenever there's no real image, or when a real image URL
// fails to load.
export function PosterImage({ src, alt, fill, width, height, sizes, className, priority, label = "Poster not available" }: PosterImageProps) {
  const [failed, setFailed] = useState(false);
  const showFallback = !src || failed;

  if (showFallback) {
    return (
      <div
        className={cn(
          "flex flex-col items-center justify-center gap-1.5 bg-[#1a1a24] text-center",
          fill ? "absolute inset-0" : "",
          className
        )}
        style={!fill ? { width, height } : undefined}
      >
        <Film className="h-5 w-5 text-[#4a4a5a]" />
        <span className="px-2 text-[9px] leading-tight text-[#6a6a7a]">{label}</span>
      </div>
    );
  }

  if (fill) {
    return (
      <Image
        src={src as string}
        alt={alt}
        fill
        sizes={sizes}
        className={className}
        priority={priority}
        onError={() => setFailed(true)}
      />
    );
  }

  return (
    <Image
      src={src as string}
      alt={alt}
      width={width}
      height={height}
      className={className}
      priority={priority}
      onError={() => setFailed(true)}
    />
  );
}
