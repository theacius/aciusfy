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

export function StevenClockStrip({ className }: { className?: string }) {
  const [times, setTimes] = useState<string[]>(() => ZONES.map((z) => formatTime(z.tz)));

  useEffect(() => {
    const tick = () => setTimes(ZONES.map((z) => formatTime(z.tz)));
    tick();
    const id = window.setInterval(tick, 30_000);
    return () => window.clearInterval(id);
  }, []);

  return (
    <div
      className={cn(
        "hidden items-center gap-5 font-mono text-[10px] uppercase tracking-[0.2em] text-muted md:flex",
        className,
      )}
      aria-hidden
    >
      {ZONES.map((zone, i) => (
        <span key={zone.label} className="tabular-nums">
          <span className="text-foreground/35">(</span>
          <span className="text-foreground/55">{zone.label}</span>
          <span className="text-foreground/35">)</span>{" "}
          <span className="text-foreground/80">{times[i]}</span>
        </span>
      ))}
    </div>
  );
}
