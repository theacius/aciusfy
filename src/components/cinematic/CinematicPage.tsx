"use client";

import { motion, useReducedMotion } from "framer-motion";
import { cn } from "@/lib/utils";
import { cinematicFadeUp, cinematicStagger } from "@/lib/cinematic-motion";

export function CinematicPage({
  children,
  className,
}: {
  children: React.ReactNode;
  className?: string;
}) {
  const reduceMotion = useReducedMotion();

  return (
    <motion.div
      className={cn(className)}
      initial={reduceMotion ? false : "hidden"}
      animate="visible"
      variants={cinematicStagger}
    >
      <motion.div variants={cinematicFadeUp}>{children}</motion.div>
    </motion.div>
  );
}
