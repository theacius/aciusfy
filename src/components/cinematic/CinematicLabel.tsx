"use client";

import { cn } from "@/lib/utils";

export function CinematicLabel({
  children,
  className,
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <span className={cn("cinematic-label font-mono text-[11px] uppercase tracking-[0.22em] text-muted", className)}>
      <span className="opacity-40">(</span>
      {children}
      <span className="opacity-40">)</span>
    </span>
  );
}
