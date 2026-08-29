"use client";
import * as React from "react";
import * as SelectPrimitive from "@radix-ui/react-select";
import { Check, ChevronDown } from "lucide-react";
import { cn } from "@/lib/utils";

export const Select = SelectPrimitive.Root;
export const SelectValue = SelectPrimitive.Value;

export const SelectTrigger = React.forwardRef<
  React.ElementRef<typeof SelectPrimitive.Trigger>,
  React.ComponentPropsWithoutRef<typeof SelectPrimitive.Trigger>
>(({ className, children, ...props }, ref) => (
  <SelectPrimitive.Trigger
    ref={ref}
    className={cn(
      "flex h-9 min-w-[140px] items-center justify-between gap-2 rounded-full border border-white/10 bg-white/5 px-3.5 text-xs font-medium text-foreground hover:bg-white/10 focus:outline-none focus:ring-1 focus:ring-ring",
      className
    )}
    {...props}
  >
    {children}
    <SelectPrimitive.Icon><ChevronDown className="h-3.5 w-3.5 opacity-60" /></SelectPrimitive.Icon>
  </SelectPrimitive.Trigger>
));
SelectTrigger.displayName = "SelectTrigger";

export const SelectContent = React.forwardRef<
  React.ElementRef<typeof SelectPrimitive.Content>,
  React.ComponentPropsWithoutRef<typeof SelectPrimitive.Content>
>(({ className, children, position = "popper", ...props }, ref) => (
  <SelectPrimitive.Portal>
    <SelectPrimitive.Content
      ref={ref}
      position={position}
      className={cn(
        "z-[60] min-w-[10rem] overflow-hidden rounded-xl border border-white/10 bg-card/95 backdrop-blur-xl shadow-2xl",
        className
      )}
      {...props}
    >
      <SelectPrimitive.Viewport className="p-1">{children}</SelectPrimitive.Viewport>
    </SelectPrimitive.Content>
  </SelectPrimitive.Portal>
));
SelectContent.displayName = "SelectContent";

export const SelectItem = React.forwardRef<
  React.ElementRef<typeof SelectPrimitive.Item>,
  React.ComponentPropsWithoutRef<typeof SelectPrimitive.Item>
>(({ className, children, ...props }, ref) => (
  <SelectPrimitive.Item
    ref={ref}
    className={cn(
      "relative flex cursor-pointer select-none items-center rounded-lg py-2 pl-8 pr-3 text-sm text-foreground outline-none data-[highlighted]:bg-white/10",
      className
    )}
    {...props}
  >
    <span className="absolute left-2.5 inline-flex h-3.5 w-3.5 items-center justify-center">
      <SelectPrimitive.ItemIndicator><Check className="h-3.5 w-3.5 text-accent" /></SelectPrimitive.ItemIndicator>
    </span>
    <SelectPrimitive.ItemText>{children}</SelectPrimitive.ItemText>
  </SelectPrimitive.Item>
));
SelectItem.displayName = "SelectItem";
