"use client";

import { cn } from "@/lib/utils";
import { BorderBeam } from "@/components/ui/border-beam";

interface GradientBorderProps {
  children: React.ReactNode;
  className?: string;
  containerClassName?: string;
  duration?: number;
  variant?: "default" | "green";
}

const variantColors = {
  default: { from: "#06b6d4", to: "#8b5cf6" },
  green: { from: "#22c55e", to: "#14b8a6" },
};

export function GradientBorder({
  children,
  className,
  containerClassName,
  duration = 6,
  variant = "default",
}: GradientBorderProps) {
  const colors = variantColors[variant];
  return (
    <div
      className={cn(
        "relative overflow-hidden rounded-2xl p-[1px]",
        containerClassName
      )}
    >
      <div className={cn("relative z-10 rounded-2xl bg-card", className)}>
        {children}
      </div>
      <BorderBeam
        duration={duration}
        colorFrom={colors.from}
        colorTo={colors.to}
        borderWidth={1}
      />
    </div>
  );
}
