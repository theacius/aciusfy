"use client";

import { cn } from "@/lib/utils";
import { useSettingsStore } from "@/store/settingsStore";
import { useEffect, useState } from "react";

interface CinematicBackgroundProps {
  children?: React.ReactNode;
  className?: string;
}

export function CinematicBackground({ children, className }: CinematicBackgroundProps) {
  const theme = useSettingsStore((s) => s.theme);
  const [isLight, setIsLight] = useState(false);

  useEffect(() => {
    if (theme === "light") {
      setIsLight(true);
      return;
    }
    if (theme === "dark") {
      setIsLight(false);
      return;
    }
    const mq = window.matchMedia("(prefers-color-scheme: light)");
    setIsLight(mq.matches);
    const handler = (e: MediaQueryListEvent) => setIsLight(e.matches);
    mq.addEventListener("change", handler);
    return () => mq.removeEventListener("change", handler);
  }, [theme]);

  return (
    <div className={cn("relative min-h-screen w-full overflow-hidden", className)}>
      <div
        className={cn(
          "fixed inset-0 -z-10",
          isLight
            ? "bg-background"
            : "bg-[#030303] bg-[radial-gradient(ellipse_80%_50%_at_50%_-10%,rgba(255,255,255,0.06),transparent_55%),radial-gradient(ellipse_60%_40%_at_100%_100%,rgba(255,255,255,0.03),transparent_50%)]",
        )}
        aria-hidden
      >
        {!isLight && (
          <>
            <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_at_center,transparent_40%,rgba(0,0,0,0.55)_100%)]" />
            <div className="pointer-events-none absolute inset-x-0 top-[38%] h-px bg-gradient-to-r from-transparent via-white/10 to-transparent" />
          </>
        )}
      </div>
      {children}
    </div>
  );
}
