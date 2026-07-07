"use client";

import { cn } from "@/lib/utils";
import { LightPillar } from "@/components/ui/light-pillar";
import { shouldUseHeavyBackgroundEffects } from "@/lib/heavy-effects";
import { useSettingsStore } from "@/store/settingsStore";
import { useEffect, useState } from "react";

interface AuraMeshBackgroundProps {
  children?: React.ReactNode;
  className?: string;
  variant?: "default" | "ocean"
  darkBaseClassName?: string
}

function useIsLightTheme() {
  const theme = useSettingsStore((s) => s.theme);
  const [isLight, setIsLight] = useState(false);
  useEffect(() => {
    if (theme === "light") { setIsLight(true); return; }
    if (theme === "dark") { setIsLight(false); return; }
    const mq = window.matchMedia("(prefers-color-scheme: light)");
    setIsLight(mq.matches);
    const handler = (e: MediaQueryListEvent) => setIsLight(e.matches);
    mq.addEventListener("change", handler);
    return () => mq.removeEventListener("change", handler);
  }, [theme]);
  return isLight;
}

export function AuraMeshBackground(
  {
    children,
    className,
    variant = "default",
    darkBaseClassName,
  }: AuraMeshBackgroundProps
) {
  const [showHeavy, setShowHeavy] = useState(false);
  const isLight = useIsLightTheme();
  const ocean = variant === "ocean";

  useEffect(() => {
    const apply = () => setShowHeavy(shouldUseHeavyBackgroundEffects());
    apply();
    const mq = window.matchMedia("(min-width: 1024px)");
    const mqReduce = window.matchMedia("(prefers-reduced-motion: reduce)");
    mq.addEventListener("change", apply);
    mqReduce.addEventListener("change", apply);
    return () => {
      mq.removeEventListener("change", apply);
      mqReduce.removeEventListener("change", apply);
    };
  }, []);

  if (isLight) {
    return (
      <div className={cn("relative min-h-screen w-full overflow-hidden", className)}>
        <div className="fixed inset-0 -z-10 bg-[#fafafa]">
          {showHeavy && (
            <div className="absolute inset-0 overflow-hidden">
              <div
                className="absolute -left-[20%] -top-[20%] h-[60vh] w-[60vw] rounded-full opacity-15 blur-[100px] animate-mesh-1"
                style={{
                  background: ocean
                    ? "radial-gradient(circle, rgba(37,99,235,0.14) 0%, transparent 70%)"
                    : "radial-gradient(circle, rgba(124,58,237,0.12) 0%, transparent 70%)",
                }}
              />
              <div
                className="absolute -right-[15%] -top-[10%] h-[50vh] w-[50vw] rounded-full opacity-12 blur-[100px] animate-mesh-2"
                style={{
                  background: ocean
                    ? "radial-gradient(circle, rgba(147,197,253,0.12) 0%, transparent 70%)"
                    : "radial-gradient(circle, rgba(16,185,129,0.1) 0%, transparent 70%)",
                }}
              />
            </div>
          )}
        </div>
        <div className="relative z-10">{children}</div>
      </div>
    );
  }

  return (
    <div className={cn("relative min-h-screen w-full overflow-hidden", className)}>
      <div className="fixed inset-0 -z-10">
        <div className={cn("absolute inset-0", darkBaseClassName ?? "bg-[#080808]")} />

        {showHeavy && (
          <div className="absolute inset-0 opacity-50">
            <LightPillar
              topColor={ocean ? "#3b82f6" : "#a855f7"}
              bottomColor={ocean ? "#bfdbfe" : "#10b981"}
              intensity={0.85}
              rotationSpeed={0.22}
              glowAmount={0.005}
              pillarWidth={3}
              pillarHeight={0.4}
              pillarRotation={45}
              mixBlendMode="screen"
              quality="low"
            />
          </div>
        )}

        <div className="absolute inset-0 overflow-hidden">
          {showHeavy ? (
            <>
              <div
                className="absolute -left-[20%] -top-[20%] h-[60vh] w-[60vw] rounded-full opacity-25 blur-[80px] animate-mesh-1"
                style={{
                  background: ocean
                    ? "radial-gradient(circle, rgba(59, 130, 246, 0.28) 0%, rgba(37, 99, 235, 0.12) 40%, transparent 70%)"
                    : "radial-gradient(circle, rgba(168, 85, 247, 0.3) 0%, rgba(139, 92, 246, 0.12) 40%, transparent 70%)",
                }}
              />
              <div
                className="absolute -right-[15%] -top-[10%] h-[50vh] w-[50vw] rounded-full opacity-20 blur-[80px] animate-mesh-2"
                style={{
                  background: ocean
                    ? "radial-gradient(circle, rgba(147, 197, 253, 0.22) 0%, rgba(191, 219, 254, 0.1) 50%, transparent 70%)"
                    : "radial-gradient(circle, rgba(16, 185, 129, 0.25) 0%, rgba(5, 150, 105, 0.1) 50%, transparent 70%)",
                }}
              />
              <div
                className="absolute bottom-[-15%] left-1/2 h-[55vh] w-[55vw] -translate-x-1/2 rounded-full opacity-20 blur-[80px] animate-mesh-3"
                style={{
                  background: ocean
                    ? "radial-gradient(circle, rgba(37, 99, 235, 0.18) 0%, rgba(147, 197, 253, 0.08) 45%, transparent 70%)"
                    : "radial-gradient(circle, rgba(168, 85, 247, 0.2) 0%, rgba(16, 185, 129, 0.1) 45%, transparent 70%)",
                }}
              />
              <div
                className="absolute -bottom-[10%] -left-[10%] h-[40vh] w-[40vw] rounded-full opacity-15 blur-[64px] animate-mesh-4"
                style={{
                  background: ocean
                    ? "radial-gradient(circle, rgba(96, 165, 250, 0.2) 0%, transparent 60%)"
                    : "radial-gradient(circle, rgba(16, 185, 129, 0.2) 0%, transparent 60%)",
                }}
              />
              <div
                className="absolute right-[-10%] top-1/2 h-[45vh] w-[45vw] -translate-y-1/2 rounded-full opacity-15 blur-[64px] animate-mesh-5"
                style={{
                  background: ocean
                    ? "radial-gradient(circle, rgba(59, 130, 246, 0.14) 0%, transparent 55%)"
                    : "radial-gradient(circle, rgba(168, 85, 247, 0.15) 0%, transparent 55%)",
                }}
              />
            </>
          ) : (
            <>
              <div
                className="absolute -left-[15%] -top-[10%] h-[50vh] w-[85vw] rounded-full opacity-30"
                style={{
                  background: ocean
                    ? "radial-gradient(ellipse at center, rgba(59, 130, 246, 0.18) 0%, rgba(37, 99, 235, 0.06) 45%, transparent 70%)"
                    : "radial-gradient(ellipse at center, rgba(168, 85, 247, 0.2) 0%, rgba(139, 92, 246, 0.08) 45%, transparent 70%)",
                }}
              />
              <div
                className="absolute -right-[20%] bottom-0 h-[42vh] w-[70vw] rounded-full opacity-25"
                style={{
                  background: ocean
                    ? "radial-gradient(ellipse at center, rgba(147, 197, 253, 0.16) 0%, transparent 65%)"
                    : "radial-gradient(ellipse at center, rgba(16, 185, 129, 0.2) 0%, transparent 65%)",
                }}
              />
            </>
          )}
        </div>

        <div
          className="absolute inset-0 opacity-60"
          style={{
            background:
              "radial-gradient(ellipse 80% 80% at 50% 50%, transparent 40%, rgba(8, 8, 8, 0.5) 100%)",
          }}
        />

        {showHeavy && (
          <div
            className="pointer-events-none absolute inset-0 opacity-[0.02]"
            style={{
              backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noise'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='3' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noise)'/%3E%3C/svg%3E")`,
            }}
          />
        )}
      </div>
      <div className="relative z-10">{children}</div>
    </div>
  );
}
