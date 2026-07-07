"use client";

import { AnimatedGradient } from "@/components/ui/animated-gradient";
import { cn } from "@/lib/utils";

type LandingAnimatedBackgroundProps = {
  className?: string;
  variant?: "landing" | "intro";
};

const GRADIENT_CONFIG = {
  preset: "custom" as const,
  color1: "#020617",
  color2: "#3b82f6",
  color3: "#8b5cf6",
  rotation: -42,
  proportion: 58,
  scale: 0.48,
  speed: 32,
  distortion: 10,
  swirl: 72,
  swirlIterations: 14,
  softness: 62,
  offset: -120,
  shape: "Edge" as const,
  shapeSize: 38,
};

/** Spell UI animated gradient — landing arka planı + CSS yedek katman */
export function LandingAnimatedBackground({
  className,
  variant = "landing",
}: LandingAnimatedBackgroundProps) {
  const speed = variant === "intro" ? 24 : GRADIENT_CONFIG.speed;

  return (
    <div
      className={cn(
        "pointer-events-none fixed inset-0 z-[1] overflow-hidden",
        className,
      )}
      aria-hidden
    >
      {/* CSS fallback — WebGL yüklenene kadar / destek yoksa */}
      <div
        className="absolute inset-0"
        style={{
          background: `
            radial-gradient(ellipse 120% 90% at 50% -10%, rgba(59,130,246,0.35) 0%, transparent 55%),
            radial-gradient(ellipse 80% 60% at 85% 45%, rgba(139,92,246,0.22) 0%, transparent 50%),
            radial-gradient(ellipse 70% 55% at 15% 70%, rgba(37,99,235,0.18) 0%, transparent 45%),
            linear-gradient(180deg, #030712 0%, #020617 45%, #010409 100%)
          `,
        }}
      />

      <AnimatedGradient
        config={{ ...GRADIENT_CONFIG, speed }}
        noise={{ opacity: 8, scale: 1.1 }}
        className="absolute inset-0 h-full w-full"
        style={{ zIndex: 1, position: "absolute" }}
      />

      <div
        className="absolute inset-0 z-[2]"
        style={{
          background:
            "radial-gradient(ellipse 100% 80% at 50% 40%, transparent 30%, rgba(2,6,23,0.55) 100%)",
        }}
      />
    </div>
  );
}
