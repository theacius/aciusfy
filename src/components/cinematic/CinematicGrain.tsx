"use client";

import { cn } from "@/lib/utils";

export function CinematicGrain({ className }: { className?: string }) {
  return (
    <div
      aria-hidden
      className={cn(
        "pointer-events-none fixed inset-0 z-[100] opacity-[0.04] mix-blend-overlay",
        "bg-[repeating-conic-gradient(from_0deg,rgba(255,255,255,0.03)_0deg_2deg,transparent_2deg_4deg)] bg-[length:4px_4px]",
        className,
      )}
    />
  );
}
