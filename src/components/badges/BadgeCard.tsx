"use client";

import { memo } from "react";
import * as LucideIcons from "lucide-react";
import type { LucideIcon } from "lucide-react";
import { cn } from "@/lib/utils";
import { ElectricBorder } from "./ElectricBorder";
import { StarBorder } from "./StarBorder";

export interface BadgeData {
  id: string;
  name: string;
  description?: string | null;
  icon: string;
  color: string;
  bgColor: string;
  borderColor: string;
  animation: string;
  category?: string;
  earnedAt?: string | Date;
}

const WRAPPER_ANIMS: Record<string, string> = {
  RAINBOW_BORDER: "badge-anim-rainbow",
  BORDER_BEAM: "badge-anim-border-beam",
  GOLD_SHINE: "badge-anim-gold-shine",
  FIRE_BORDER: "badge-anim-fire",
  NEON_FLICKER: "badge-anim-neon-flicker",
  PLASMA: "badge-anim-plasma",
  FROST: "badge-anim-frost",
  AURORA: "badge-anim-aurora",
  TOXIC: "badge-anim-toxic",
  DIAMOND_SPARKLE: "badge-anim-diamond",
  SHINE_BORDER: "badge-anim-shine",
};

const BG_ANIMS: Record<string, string> = {
  SHIMMER: "badge-anim-shimmer",
  SCANLINE: "badge-anim-scanline",
  SPOTLIGHT: "badge-anim-spotlight",
};

const CSS_ANIMS: Record<string, string> = {
  SHADOW_PULSE: "badge-anim-shadow-pulse",
  HOVER_GLOW: "badge-anim-hover-glow",
  CYBER_GLITCH: "badge-anim-cyber-glitch",
  BREATHING: "badge-anim-breathing",
  HEARTBEAT: "badge-anim-heartbeat",
  ORBIT: "badge-anim-orbit",
  RIPPLE: "badge-anim-ripple",
  VORTEX: "badge-anim-vortex",
  LIGHTNING: "badge-anim-lightning",
  SNAKE: "badge-anim-snake",
  DOUBLE_GLOW: "badge-anim-double-glow",
  METEOR: "badge-anim-meteor",
  NEON_PULSE: "badge-anim-neon-pulse",
};

function getIcon(name: string): LucideIcon {
  const icons = LucideIcons as unknown as Record<string, LucideIcon>;
  return icons[name] ?? LucideIcons.Award;
}

const SIZE_MAP = {
  sm: { outer: "h-10 w-10", px: 40, icon: 16, text: "text-[10px]" },
  md: { outer: "h-14 w-14", px: 56, icon: 22, text: "text-xs" },
  lg: { outer: "h-20 w-20", px: 80, icon: 32, text: "text-sm" },
};

function BadgeCardInner({
  badge,
  size = "md",
  showName = true,
  className,
}: {
  badge: BadgeData;
  size?: "sm" | "md" | "lg";
  showName?: boolean;
  className?: string;
}) {
  const Icon = getIcon(badge.icon);
  const anim = badge.animation;
  const s = SIZE_MAP[size];
  const iconEl = <Icon size={s.icon} style={{ color: badge.color }} />;

  let badgeEl: React.ReactNode;

  if (anim === "STAR_BORDER") {
    badgeEl = (
      <div
        className={cn("relative overflow-hidden rounded-xl", s.outer, className)}
        title={badge.description || badge.name}
      >
        <StarBorder color={badge.borderColor} />
        <div
          className={cn("relative z-10 flex items-center justify-center rounded-xl", s.outer)}
          style={{ backgroundColor: badge.bgColor, border: `1px solid ${badge.borderColor}33` }}
        >
          {iconEl}
        </div>
      </div>
    );
  } else if (anim === "ELECTRIC_BORDER") {
    badgeEl = (
      <div
        className={cn("relative overflow-visible", s.outer, className)}
        title={badge.description || badge.name}
      >
        <ElectricBorder color={badge.borderColor} size={s.px} />
        <div
          className={cn("relative z-10 flex items-center justify-center rounded-xl", s.outer)}
          style={{ backgroundColor: badge.bgColor }}
        >
          {iconEl}
        </div>
      </div>
    );
  } else if (anim in WRAPPER_ANIMS) {
    const wrapperClass = WRAPPER_ANIMS[anim];

    badgeEl = (
      <div
        className={cn("relative overflow-visible", s.outer, className)}
        title={badge.description || badge.name}
        style={{ "--badge-border": badge.borderColor, "--badge-angle": "0deg", "--badge-beam": "0deg" } as React.CSSProperties}
      >
        <div className={cn("absolute inset-[-1px] rounded-xl p-[2px]", wrapperClass)}>
          <div
            className="flex h-full w-full items-center justify-center rounded-[10px]"
            style={{ backgroundColor: badge.bgColor }}
          >
            {iconEl}
          </div>
        </div>
      </div>
    );
  } else if (anim in BG_ANIMS) {
    const cls = BG_ANIMS[anim];

    badgeEl = (
      <div
        className={cn("relative flex items-center justify-center rounded-xl overflow-hidden", s.outer, className)}
        style={{
          "--badge-border": badge.borderColor,
          borderColor: badge.borderColor,
          borderWidth: 2,
          borderStyle: "solid",
        } as React.CSSProperties}
        title={badge.description || badge.name}
      >
        <div
          className={cn("absolute inset-0", cls)}
          style={{ "--badge-bg": badge.bgColor, backgroundColor: badge.bgColor } as React.CSSProperties}
        />
        <div className="relative z-10">{iconEl}</div>
      </div>
    );
  } else if (anim in CSS_ANIMS) {
    const cls = CSS_ANIMS[anim];

    badgeEl = (
      <div
        className={cn("relative flex items-center justify-center rounded-xl overflow-visible", s.outer, cls, className)}
        style={{
          "--badge-border": badge.borderColor,
          backgroundColor: badge.bgColor,
          borderColor: badge.borderColor,
          borderWidth: 2,
          borderStyle: "solid",
        } as React.CSSProperties}
        title={badge.description || badge.name}
      >
        {iconEl}
      </div>
    );
  } else {
    badgeEl = (
      <div
        className={cn("relative flex items-center justify-center rounded-xl", s.outer, className)}
        style={{
          backgroundColor: badge.bgColor,
          borderColor: badge.borderColor,
          borderWidth: 2,
          borderStyle: "solid",
        } as React.CSSProperties}
        title={badge.description || badge.name}
      >
        {iconEl}
      </div>
    );
  }

  if (!showName) return badgeEl;

  return (
    <div className="flex flex-col items-center gap-1" style={{ width: s.px }}>
      {badgeEl}
      <span className={cn("w-full truncate text-center font-medium text-foreground", s.text)}>
        {badge.name}
      </span>
    </div>
  );
}

export const BadgeCard = memo(BadgeCardInner);
