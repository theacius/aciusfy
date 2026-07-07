"use client";

import dynamic from "next/dynamic";
import { cn } from "@/lib/utils";
import { CinematicGrain } from "@/components/cinematic";

const SpaceBackground = dynamic(
  () => import("@/components/premium/SpaceBackground").then((m) => m.SpaceBackground),
  { ssr: false },
);

type PremiumShellProps = {
  children?: React.ReactNode;
  className?: string;
  three?: boolean;
  threeIntensity?: "subtle" | "normal" | "landing";
  variant?: "landing" | "app" | "marketing";
};

export function PremiumShell({
  children,
  className,
  three = true,
  threeIntensity = "normal",
  variant = "app",
}: PremiumShellProps) {
  const isLanding = variant === "landing" || threeIntensity === "landing";
  const isMarketing = variant === "marketing";
  const useSpace = isLanding || isMarketing;
  const spaceIntensity = isLanding || isMarketing ? "landing" : "subtle";

  return (
    <div className={cn("relative min-h-screen w-full overflow-hidden bg-[#09090b] font-sans", className)}>
      {three && useSpace ? <SpaceBackground intensity={spaceIntensity} /> : null}
      {three && !useSpace ? <SpaceBackground intensity="subtle" className="opacity-50" /> : null}
      <div className="fixed inset-0 -z-10 bg-[#09090b]" aria-hidden />
      <CinematicGrain className={useSpace ? "opacity-[0.05]" : "opacity-[0.03]"} />
      <div className="relative z-10">{children}</div>
    </div>
  );
}
