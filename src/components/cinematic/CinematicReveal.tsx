"use client";

import { motion, useReducedMotion } from "framer-motion";
import { cn } from "@/lib/utils";
import { cinematicFadeUp, cinematicStagger } from "@/lib/cinematic-motion";

export function CinematicReveal({
  children,
  className,
  delay = 0,
}: {
  children: React.ReactNode;
  className?: string;
  delay?: number;
}) {
  const reduceMotion = useReducedMotion();

  return (
    <motion.div
      className={cn(className)}
      initial={reduceMotion ? false : "hidden"}
      whileInView="visible"
      viewport={{ once: true, margin: "-8% 0px" }}
      variants={cinematicStagger}
      transition={{ delayChildren: delay }}
    >
      <motion.div variants={cinematicFadeUp}>{children}</motion.div>
    </motion.div>
  );
}
