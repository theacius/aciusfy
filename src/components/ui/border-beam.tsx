"use client";

import { motion } from "framer-motion";
import { cn } from "@/lib/utils";

interface BorderBeamProps {
  children?: React.ReactNode;
  size?: number;
  duration?: number;
  delay?: number;
  colorFrom?: string;
  colorTo?: string;
  className?: string;
  style?: React.CSSProperties;
  reverse?: boolean;
  borderWidth?: number;
}

export function BorderBeam({
  children,
  className,
  duration = 5,
  delay = 0,
  colorFrom = "#06b6d4",
  colorTo = "#8b5cf6",
  style,
  reverse = false,
  borderWidth = 1,
}: BorderBeamProps) {
  const beam = (
    <div
      className={cn(
        "pointer-events-none absolute inset-0 rounded-[inherit] overflow-hidden",
        "[mask:linear-gradient(#fff 0 0) content-box,linear-gradient(#fff 0 0)] [mask-composite:exclude] [-webkit-mask-composite:xor]"
      )}
      style={
        {
          padding: borderWidth,
          ...style,
        } as React.CSSProperties
      }
    >
      <motion.div
        className="absolute inset-[-50%]"
        style={{
          background: `conic-gradient(from 0deg at 50% 50%, transparent 0deg, ${colorFrom} 60deg, ${colorTo} 120deg, transparent 180deg)`,
        }}
        initial={{ rotate: 0 }}
        animate={{ rotate: reverse ? -360 : 360 }}
        transition={{
          repeat: Infinity,
          ease: "linear",
          duration,
          delay: -delay,
        }}
      />
    </div>
  );

  if (children) {
    return (
      <div className={cn("relative overflow-hidden rounded-2xl p-[1px]", className)}>
        <div className="relative z-10 rounded-2xl bg-card">{children}</div>
        {beam}
      </div>
    );
  }
  return beam;
}
