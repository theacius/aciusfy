"use client";

import { cn } from "@/lib/utils";

interface AuroraTextProps {
  text: string;
  className?: string;
  as?: "h1" | "h2" | "h3" | "span" | "p";
}

const GRADIENT =
  "linear-gradient(90deg, #2d4a7a, #4a6fa8, #66aaff, #99c4ff, #ddeeff)";

export function AuroraText({ text, className, as: Tag = "h1" }: AuroraTextProps) {
  return (
    <Tag className={cn("relative inline-block", className)}>
      <span
        className="aurora-text-layer relative inline-block bg-clip-text text-transparent drop-shadow-[0_2px_4px_rgba(0,0,0,0.25)]"
        style={{
          backgroundImage: GRADIENT,
          backgroundSize: "200% 100%",
        }}
      >
        {text}
      </span>
      <span
        className="aurora-text-glow pointer-events-none absolute inset-0 inline-block bg-clip-text text-transparent blur-xl"
        style={{
          backgroundImage: GRADIENT,
          backgroundSize: "200% 100%",
        }}
        aria-hidden="true"
      >
        {text}
      </span>
    </Tag>
  );
}
