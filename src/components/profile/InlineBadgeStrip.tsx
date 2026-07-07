"use client";

import { useEffect, useState } from "react";
import { BadgeCard, type BadgeData } from "@/components/badges/BadgeCard";

type Props = {
  userId: string;
  className?: string;
};

export function InlineBadgeStrip({ userId, className = "" }: Props) {
  const [badges, setBadges] = useState<BadgeData[]>([]);

  useEffect(() => {
    if (!userId) return;
    let cancelled = false;
    fetch(`/api/badges/user?userId=${encodeURIComponent(userId)}`)
      .then((r) => r.json())
      .then((d) => {
        if (!cancelled) setBadges(Array.isArray(d.badges) ? d.badges : []);
      })
      .catch(() => {
        if (!cancelled) setBadges([]);
      });
    return () => {
      cancelled = true;
    };
  }, [userId]);

  if (badges.length === 0) return null;

  return (
    <div className={`flex flex-shrink-0 items-start gap-3 ${className}`} aria-label="Rozetler">
      {badges.map((b) => (
        <div key={b.id} className="flex shrink-0 flex-col items-center gap-1">
          <BadgeCard badge={b} size="sm" showName={false} />
          <span className="max-w-[3.5rem] text-center text-[9px] font-medium leading-tight text-white/45 line-clamp-2">
            {b.name}
          </span>
        </div>
      ))}
    </div>
  );
}
