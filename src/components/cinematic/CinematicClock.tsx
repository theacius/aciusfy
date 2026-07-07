"use client";

import { useEffect, useState } from "react";
import { cn } from "@/lib/utils";

const ZONES = [
  { label: "IST", tz: "Europe/Istanbul" },
  { label: "LDN", tz: "Europe/London" },
  { label: "NYC", tz: "America/New_York" },
] as const;

function formatTime(tz: string) {
  return new Intl.DateTimeFormat("en-GB", {
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
    timeZone: tz,
  }).format(new Date());
}

export function CinematicClock({ className }: { className?: string }) {
  const [times, setTimes] = useState<string[]>(() => ZONES.map((z) => formatTime(z.tz)));

  useEffect(() => {
    const tick = () => setTimes(ZONES.map((z) => formatTime(z.tz)));
    tick();
    const id = window.setInterval(tick, 30_000);
    return () => window.clearInterval(id);
  }, []);

  return (
    <div className={cn("hidden items-center gap-4 font-mono text-[10px] tracking-[0.18em] text-muted lg:flex", className)}>
      {ZONES.map((zone, i) => (
        <span key={zone.label} className="tabular-nums">
          <span className="opacity-50">{zone.label}</span>{" "}
          <span className="text-foreground/80">{times[i]}</span>
        </span>
      ))}
    </div>
  );
}
