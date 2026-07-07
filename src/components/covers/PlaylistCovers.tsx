"use client";

import Image from "next/image";
import { proxiedImageUrl } from "@/lib/media-proxy-url";
import { cn } from "@/lib/utils";
import { ACIUSFY_LOGO_PNG } from "@/lib/branding";

const DAILY_MIX_PALETTES = [
  {
    accent: "#E04E6A",
    gradient: "from-[#E04E6A]/30 to-black/80"
  },
  {
    accent: "#3A86FF",
    gradient: "from-[#3A86FF]/30 to-black/80"
  },
  {
    accent: "#8338EC",
    gradient: "from-[#8338EC]/30 to-black/80"
  },
  {
    accent: "#06D6A0",
    gradient: "from-[#06D6A0]/30 to-black/80"
  },
  {
    accent: "#FF6B35",
    gradient: "from-[#FF6B35]/30 to-black/80"
  },
  {
    accent: "#BC96E6",
    gradient: "from-[#BC96E6]/30 to-black/80"
  },
  {
    accent: "#26C6DA",
    gradient: "from-[#26C6DA]/30 to-black/80"
  },
  {
    accent: "#F72585",
    gradient: "from-[#F72585]/30 to-black/80"
  },
  {
    accent: "#118AB2",
    gradient: "from-[#118AB2]/30 to-black/80"
  },
  {
    accent: "#EF476F",
    gradient: "from-[#EF476F]/30 to-black/80"
  },
];

function dailyPalette(index: number) {
  return DAILY_MIX_PALETTES[index % DAILY_MIX_PALETTES.length];
}

function AciusfyBadge() {
  return (
    <div className="absolute left-2 top-2 z-10 flex h-[22px] w-[22px] items-center justify-center overflow-hidden rounded-full bg-black/40 backdrop-blur-sm">
      <Image
        src={ACIUSFY_LOGO_PNG}
        alt="Aciusfy"
        width={16}
        height={16}
        className="object-contain"
      />
    </div>
  );
}

export function DailyMixCover(
  {
    index,
    coverImage,
    className,
  }: {
    index: number;
    coverImage?: string | null;
    className?: string;
  }
) {
  const num = String(index + 1).padStart(2, "0");
  const palette = dailyPalette(index);

  return (
    <div
      className={cn(
        "relative aspect-square w-full overflow-hidden rounded-lg bg-card-hover",
        className
      )}
    >
      {coverImage && (
        <Image
          src={proxiedImageUrl(coverImage) || "/images/placeholder-song.svg"}
          alt={`Daily Mix ${num}`}
          fill
          sizes="200px"
          className="object-cover"
          unoptimized
        />
      )}

      <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent" />

      <AciusfyBadge />

      <div className="absolute bottom-3 left-3 z-10">
        <span className="text-[11px] font-bold tracking-wide text-white/90">
          Daily Mix
        </span>
      </div>

      <div className="absolute -bottom-1 right-1 z-10">
        <span
          className="text-[72px] font-black leading-none"
          style={{
            color: palette.accent,
            fontStretch: "condensed",
            letterSpacing: "-0.04em",
            textShadow: "0 2px 16px rgba(0,0,0,0.5)",
          }}
        >
          {num}
        </span>
      </div>
    </div>
  );
}

const WEEKLY_THEMES = [
  { dark: "#1a1a2e", block1: "#e8115b", block2: "#2d1b33", block3: "#c4003a" },
  { dark: "#0f1a2e", block1: "#509bf5", block2: "#1a2d1b", block3: "#1db954" },
  { dark: "#1a0a15", block1: "#ff6437", block2: "#2e1a1a", block3: "#e8115b" },
  { dark: "#0a0a1a", block1: "#af2896", block2: "#1a1a2e", block3: "#509bf5" },
];

export function WeeklyDiscoverCover({
  variant = 0,
  className,
}: {
  variant?: number;
  className?: string;
}) {
  const t = WEEKLY_THEMES[variant % WEEKLY_THEMES.length];

  return (
    <div
      className={cn(
        "relative aspect-square w-full overflow-hidden rounded-lg",
        className
      )}
      style={{ backgroundColor: t.dark }}
    >
      <div className="absolute inset-0 overflow-hidden">
        <div
          className="absolute"
          style={{
            width: "55%",
            height: "45%",
            top: "5%",
            left: "-5%",
            backgroundColor: t.block1,
            transform: "rotate(-12deg) skewY(-5deg)",
            borderRadius: "2px",
          }}
        />
        <div
          className="absolute"
          style={{
            width: "40%",
            height: "35%",
            bottom: "15%",
            left: "5%",
            backgroundColor: t.block2,
            transform: "rotate(8deg) skewX(-8deg)",
            borderRadius: "2px",
          }}
        />
        <div
          className="absolute"
          style={{
            width: "35%",
            height: "40%",
            top: "30%",
            right: "-5%",
            backgroundColor: t.block1,
            transform: "rotate(-8deg) skewY(10deg)",
            opacity: 0.8,
            borderRadius: "2px",
          }}
        />
        <div
          className="absolute"
          style={{
            width: "30%",
            height: "25%",
            top: "-5%",
            right: "10%",
            backgroundColor: t.block2,
            transform: "rotate(15deg)",
            borderRadius: "2px",
          }}
        />
        <div
          className="absolute"
          style={{
            width: "45%",
            height: "30%",
            bottom: "-8%",
            right: "-5%",
            backgroundColor: t.block3,
            transform: "rotate(-6deg) skewX(5deg)",
            opacity: 0.7,
            borderRadius: "2px",
          }}
        />
        <div
          className="absolute"
          style={{
            width: "28%",
            height: "32%",
            bottom: "5%",
            left: "35%",
            backgroundColor: t.block2,
            transform: "rotate(-18deg)",
            borderRadius: "2px",
          }}
        />
      </div>

      <AciusfyBadge />

      <div className="absolute inset-0 z-10 flex items-center justify-center p-5">
        <span
          className="text-center font-black uppercase leading-[0.95] text-white"
          style={{
            fontSize: "clamp(18px, 14cqi, 28px)",
            letterSpacing: "-0.02em",
            textShadow: "0 2px 12px rgba(0,0,0,0.4)",
          }}
        >
          Haftalık
          <br />
          Keşif
        </span>
      </div>
    </div>
  );
}

const RADIO_BGS = [
  { bg: "#B8E6D0", text: "#1a6b4a" },
  { bg: "#D4C5E8", text: "#5b3d8f" },
  { bg: "#E8D4C5", text: "#8f5b3d" },
  { bg: "#C5D4E8", text: "#3d5b8f" },
  { bg: "#E8C5D4", text: "#8f3d5b" },
  { bg: "#D0E8B8", text: "#4a6b1a" },
];

export function RadioCover({
  coverImages,
  artistName,
  subtitle,
  className,
  accentIndex = 0,
}: {
  coverImages: (string | null | undefined)[];
  artistName?: string;
  subtitle?: string;
  className?: string;
  accentIndex?: number;
}) {
  const theme = RADIO_BGS[accentIndex % RADIO_BGS.length];
  const covers = coverImages.filter(Boolean).slice(0, 3) as string[];

  return (
    <div
      className={cn(
        "relative aspect-square w-full overflow-hidden rounded-lg",
        className
      )}
      style={{ backgroundColor: theme.bg }}
    >
      <div className="absolute right-3 top-3 z-10">
        <span
          className="text-[11px] font-bold uppercase tracking-[0.15em]"
          style={{ color: theme.text }}
        >
          Radyo
        </span>
      </div>

      <AciusfyBadge />

      <div className="absolute inset-0 flex items-center justify-center px-4">
        <div className="relative flex items-end" style={{ width: "85%", height: "55%" }}>
          {covers[0] && (
            <div
              className="absolute overflow-hidden rounded-full border-[3px] shadow-lg"
              style={{
                width: "48%",
                height: "0",
                paddingBottom: "48%",
                left: "0",
                bottom: "10%",
                zIndex: 1,
                borderColor: `${theme.bg}cc`,
              }}
            >
              <Image
                src={proxiedImageUrl(covers[0]) || "/images/placeholder-song.svg"}
                alt="Radio artist 1"
                fill
                sizes="100px"
                className="object-cover"
                unoptimized
              />
            </div>
          )}

          {covers[1] && (
            <div
              className="absolute overflow-hidden rounded-full border-[3px] shadow-xl"
              style={{
                width: "55%",
                height: "0",
                paddingBottom: "55%",
                left: "22%",
                bottom: "5%",
                zIndex: 3,
                borderColor: `${theme.bg}cc`,
              }}
            >
              <Image
                src={proxiedImageUrl(covers[1]) || "/images/placeholder-song.svg"}
                alt="Radio artist 2"
                fill
                sizes="120px"
                className="object-cover"
                unoptimized
              />
            </div>
          )}

          {covers[2] && (
            <div
              className="absolute overflow-hidden rounded-full border-[3px] shadow-lg"
              style={{
                width: "44%",
                height: "0",
                paddingBottom: "44%",
                right: "0",
                bottom: "15%",
                zIndex: 2,
                borderColor: `${theme.bg}cc`,
              }}
            >
              <Image
                src={proxiedImageUrl(covers[2]) || "/images/placeholder-song.svg"}
                alt="Radio artist 3"
                fill
                sizes="90px"
                className="object-cover"
                unoptimized
              />
            </div>
          )}
        </div>
      </div>

      <div className="absolute bottom-2 left-3 right-3 z-10">
        {artistName && (
          <p
            className="truncate text-[15px] font-extrabold"
            style={{ color: theme.text }}
          >
            {artistName}
          </p>
        )}
        {subtitle && (
          <p
            className="truncate text-[10px] font-semibold"
            style={{ color: `${theme.text}99` }}
          >
            {subtitle}
          </p>
        )}
      </div>
    </div>
  );
}

const CHART_GRADIENTS = [
  "from-[#1db954] to-[#148a3c]",
  "from-[#e8115b] to-[#c4003a]",
  "from-[#509bf5] to-[#3672c4]",
  "from-[#ff6437] to-[#d44a1e]",
  "from-[#af2896] to-[#851f72]",
  "from-[#27856a] to-[#1b5e4b]",
];

export function CollageCover({
  coverImages,
  className,
  accentIndex = 0,
  label,
}: {
  coverImages: (string | null | undefined)[];
  className?: string;
  accentIndex?: number;
  label?: string;
}) {
  const gradClass = CHART_GRADIENTS[accentIndex % CHART_GRADIENTS.length];
  const validCovers = coverImages.filter(Boolean) as string[];
  const hasMosaic = validCovers.length >= 4;

  return (
    <div
      className={cn(
        "relative aspect-square w-full overflow-hidden rounded-lg bg-card-hover",
        className
      )}
    >
      {hasMosaic ? (
        <div className="absolute inset-0 grid grid-cols-2 grid-rows-2">
          {validCovers.slice(0, 4).map((cover, i) => (
            <div key={i} className="relative overflow-hidden">
              <Image
                src={proxiedImageUrl(cover) || "/images/placeholder-song.svg"}
                alt={label || `Cover ${i + 1}`}
                fill
                sizes="100px"
                className="object-cover"
                unoptimized
              />
            </div>
          ))}
        </div>
      ) : validCovers[0] ? (
        <Image
          src={proxiedImageUrl(validCovers[0]) || "/images/placeholder-song.svg"}
          alt={label || "Cover"}
          fill
          sizes="200px"
          className="object-cover"
          unoptimized
        />
      ) : (
        <div className={`absolute inset-0 bg-gradient-to-br ${gradClass}`} />
      )}

      <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/10 to-transparent" />
      <AciusfyBadge />

      {label && (
        <div className="absolute bottom-3 left-3 right-8 z-10">
          <p className="text-[16px] font-black uppercase leading-tight text-white drop-shadow-lg">
            {label}
          </p>
        </div>
      )}
    </div>
  );
}

const EDITORIAL_PALETTES = [
  {
    tint: "#C41E3A",
    gradFrom: "from-[#C41E3A]/60"
  },
  {
    tint: "#1A1A2E",
    gradFrom: "from-[#1A1A2E]/80"
  },
  {
    tint: "#2D4739",
    gradFrom: "from-[#2D4739]/70"
  },
  {
    tint: "#5B2C6F",
    gradFrom: "from-[#5B2C6F]/60"
  },
  {
    tint: "#1C3A4F",
    gradFrom: "from-[#1C3A4F]/70"
  },
  {
    tint: "#78350F",
    gradFrom: "from-[#78350F]/60"
  },
];

export function EditorialHeroCover({
  coverImage,
  title,
  subtitle,
  className,
  accentIndex = 0,
}: {
  coverImage?: string | null;
  title: string;
  subtitle?: string;
  className?: string;
  accentIndex?: number;
}) {
  const palette = EDITORIAL_PALETTES[accentIndex % EDITORIAL_PALETTES.length];

  return (
    <div
      className={cn(
        "relative aspect-square w-full overflow-hidden rounded-lg bg-card-hover",
        className
      )}
    >
      {coverImage && (
        <Image
          src={proxiedImageUrl(coverImage) || "/images/placeholder-song.svg"}
          alt={title}
          fill
          sizes="200px"
          className="object-cover"
          unoptimized
        />
      )}

      <div
        className={cn(
          "absolute inset-0 bg-gradient-to-t via-transparent to-transparent",
          palette.gradFrom
        )}
      />
      <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/5 to-transparent" />

      <AciusfyBadge />

      <div className="absolute bottom-3 left-3 right-3 z-10">
        <p
          className="font-black uppercase leading-[0.95] text-white drop-shadow-lg"
          style={{ fontSize: "clamp(16px, 12cqi, 26px)" }}
        >
          {title}
        </p>
        {subtitle && (
          <p className="mt-1 truncate text-[10px] font-medium text-white/70">
            {subtitle}
          </p>
        )}
      </div>
    </div>
  );
}

const HOT_GRADIENTS = [
  {
    bar: "#1DB954",
    bg: "from-[#1DB954]/20"
  },
  {
    bar: "#E04E6A",
    bg: "from-[#E04E6A]/20"
  },
  {
    bar: "#3A86FF",
    bg: "from-[#3A86FF]/20"
  },
  {
    bar: "#FF6B35",
    bg: "from-[#FF6B35]/20"
  },
  {
    bar: "#8338EC",
    bg: "from-[#8338EC]/20"
  },
];

export function ChartCover({
  coverImage,
  title,
  subtitle,
  className,
  accentIndex = 0,
}: {
  coverImage?: string | null;
  title: string;
  subtitle?: string;
  className?: string;
  accentIndex?: number;
}) {
  const palette = HOT_GRADIENTS[accentIndex % HOT_GRADIENTS.length];

  return (
    <div
      className={cn(
        "relative aspect-square w-full overflow-hidden rounded-lg bg-card-hover",
        className
      )}
    >
      {coverImage && (
        <Image
          src={proxiedImageUrl(coverImage) || "/images/placeholder-song.svg"}
          alt={title}
          fill
          sizes="200px"
          className="object-cover"
          unoptimized
        />
      )}

      <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/30 to-transparent" />

      <div
        className="absolute bottom-0 left-0 top-0 w-[4px]"
        style={{ backgroundColor: palette.bar }}
      />

      <AciusfyBadge />

      <div className="absolute bottom-3 left-3 right-3 z-10">
        <p
          className="font-black uppercase leading-[0.95] text-white drop-shadow-lg"
          style={{ fontSize: "clamp(14px, 10cqi, 22px)" }}
        >
          {title}
        </p>
        {subtitle && (
          <p className="mt-1 truncate text-[10px] font-medium text-white/60">
            {subtitle}
          </p>
        )}
      </div>
    </div>
  );
}
