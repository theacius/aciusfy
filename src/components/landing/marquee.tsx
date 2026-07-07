"use client";

import { useReducedMotion } from "framer-motion";
import { cn } from "@/lib/utils";

type LandingMarqueeProps = {
  items: string[];
  className?: string;
};

export function LandingMarquee({ items, className }: LandingMarqueeProps) {
  const reduceMotion = useReducedMotion();
  const loop = [...items, ...items];

  return (
    <section
      className={cn("relative overflow-hidden border-y border-white/[0.06] py-5", className)}
      aria-label="Highlights"
    >
      <div
        className={cn(
          "flex w-max gap-10 whitespace-nowrap px-4",
          !reduceMotion && "animate-landing-marquee hover:[animation-play-state:paused]",
        )}
      >
        {loop.map((item, i) => (
          <span
            key={`${item}-${i}`}
            className="text-sm font-medium tracking-tight text-white/35 sm:text-base"
          >
            {item}
          </span>
        ))}
      </div>
    </section>
  );
}
