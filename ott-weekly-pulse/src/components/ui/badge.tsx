import * as React from "react";
import { cn } from "@/lib/utils";

export function Badge({ className, ...props }: React.HTMLAttributes<HTMLSpanElement>) {
  return <span className={cn("badge-pill bg-[hsl(var(--foreground)/0.08)] text-foreground", className)} {...props} />;
}
