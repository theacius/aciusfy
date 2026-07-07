"use client";

import { motion, useReducedMotion } from "framer-motion";
import { cn } from "@/lib/utils";
import { cinematicFadeUp } from "@/lib/cinematic-motion";

export function CinematicHeading({
  as: Tag = "h1",
  children,
  className,
  size = "display",
}: {
  as?: "h1" | "h2" | "h3" | "p";
  children: React.ReactNode;
  className?: string;
  size?: "display" | "title" | "section";
}) {
  const reduceMotion = useReducedMotion();
  const sizes = {
    display: "text-[clamp(2.5rem,6vw,4.5rem)] leading-[0.95] tracking-[-0.03em]",
    title: "text-[clamp(1.75rem,4vw,2.75rem)] leading-[1.05] tracking-[-0.02em]",
    section: "text-[clamp(1.25rem,2.5vw,1.75rem)] leading-tight tracking-[-0.015em]",
  };

  return (
    <motion.div
      initial={reduceMotion ? false : "hidden"}
      animate="visible"
      variants={cinematicFadeUp}
    >
      <Tag className={cn("font-display text-foreground", sizes[size], className)}>
        {children}
      </Tag>
    </motion.div>
  );
}
