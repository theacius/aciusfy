"use client";

import Image from "next/image";
import { proxiedImageUrl } from "@/lib/media-proxy-url";

export interface DecorationData {
  id: string;
  name: string;
  frameImage?: string | null;
  animationType: string;
  cssConfig?: string | null;
}

const RING_ANIMS: Record<string, string> = {
  RAINBOW_RING: "dec-rainbow-ring",
  FIRE_RING: "dec-fire-ring",
  FROST_RING: "dec-frost-ring",
  NEON_SPIN: "dec-neon-spin",
  AURORA_WAVE: "dec-aurora-wave",
  TOXIC_RING: "dec-toxic-ring",
  DIAMOND_RING: "dec-diamond-ring",
  PLASMA_RING: "dec-plasma-ring",
  GOLD_RING: "dec-gold-ring",
  VENOM_RING: "dec-venom-ring",
  ANGEL_HALO: "dec-angel-halo",
  SAKURA_RING: "dec-sakura-ring",
  BLOOD_MOON: "dec-blood-moon",
  GALAXY_RING: "dec-galaxy-ring",
  SNOWFLAKE_RING: "dec-snowflake-ring",
  EMERALD_WAVE: "dec-emerald-wave",
  SUNSET_RING: "dec-sunset-ring",
  OCEAN_WAVE: "dec-ocean-wave",
  CHERRY_BLOSSOM: "dec-cherry-blossom",
  BUTTERFLY_RING: "dec-butterfly-ring",
  INFERNO_RING: "dec-inferno-ring",
  VOID_RING: "dec-void-ring",
  MOONLIGHT_RING: "dec-moonlight-ring",
  LAVA_RING: "dec-lava-ring",
  STARFIELD_RING: "dec-starfield-ring",
  ROSE_RING: "dec-rose-ring",
  MYSTIC_RING: "dec-mystic-ring",
  THUNDER_RING: "dec-thunder-ring",
};

const EFFECT_ANIMS: Record<string, string> = {
  GLOW_PULSE: "dec-glow-pulse",
  ELECTRIC_ARC: "dec-electric-arc",
  PARTICLE_ORBIT: "dec-particle-orbit",
  SHADOW_BREATHE: "dec-shadow-breathe",
  HEARTBEAT_RING: "dec-heartbeat-ring",
  CYBER_RING: "dec-cyber-ring",
  LIGHTNING_BOLT: "dec-lightning-bolt",
  MUSIC_WAVE: "dec-music-wave",
  DARK_SMOKE: "dec-dark-smoke",
  CAT_EARS_RING: "dec-cat-ears-ring",
  NEON_PULSE_RING: "dec-neon-pulse-ring",
};

function parseCssConfig(raw?: string | null): { color?: string; speed?: string } {
  if (!raw) return {};
  try {
    return JSON.parse(raw);
  } catch {
    return {};
  }
}

function AvatarFaceOverlay(
  {
    children,
    style,
  }: {
    children: React.ReactNode;
    style: React.CSSProperties;
  }
) {
  if (children == null || children === false) return null;
  return (
    <div className="pointer-events-none absolute z-[35] overflow-visible" style={style}>
      {children}
    </div>
  );
}

export function getAvatarFrameReservedBox(size: number): { w: number; h: number } {
  const borderWidth = Math.max(3, Math.round(size * 0.025));
  const outerSize = size + borderWidth * 2 + 8;
  const frameOverlap = Math.round(size * 0.18);
  const side = outerSize + frameOverlap * 2;
  return { w: side, h: side };
}

interface AvatarFrameProps {
  src?: string | null;
  alt?: string;
  fallbackInitial?: string;
  size?: number;
  decoration?: DecorationData | null;
  className?: string;
  onClick?: () => void;
  children?: React.ReactNode;
}

export function AvatarFrame({
  src,
  alt = "Avatar",
  fallbackInitial = "U",
  size = 128,
  decoration,
  className = "",
  onClick,
  children,
}: AvatarFrameProps) {
  const anim = decoration?.animationType ?? "NONE";
  const config = parseCssConfig(decoration?.cssConfig);
  const color = config.color ?? "#a855f7";
  const frameImage = decoration?.frameImage;
  const displayFrameSrc =
    frameImage != null && frameImage !== ""
      ? proxiedImageUrl(frameImage) ?? frameImage
      : null;
  const avatarDisplaySrc =
    src != null && src !== ""
      ? proxiedImageUrl(src) ?? src
      : null;
  const isSvgFrame =
    !!frameImage && /\.svg(\?|$)/i.test(frameImage);
  const isRingAnim = anim in RING_ANIMS;
  const isEffectAnim = anim in EFFECT_ANIMS;
  const hasDecoration = decoration && anim !== "NONE";
  const hasFrameImage = !!displayFrameSrc;

  const borderWidth = Math.max(3, Math.round(size * 0.025));
  const outerSize = size + borderWidth * 2 + (hasDecoration || hasFrameImage ? 8 : 0);
  const frameOverlap = Math.round(size * 0.18);

  if (hasFrameImage) {
    const avatarTop = frameOverlap + borderWidth + 4;
    const avatarLeft = frameOverlap + borderWidth + 4;
    const frameZ = isSvgFrame ? "z-10" : "z-20";
    return (
      <div
        className={`relative isolate flex-shrink-0 ${className}`}
        style={{ width: outerSize + frameOverlap * 2, height: outerSize + frameOverlap * 2 }}
        onClick={onClick}
      >
        <div
          className="absolute z-0 overflow-hidden rounded-full bg-white/[0.05]"
          style={{
            width: size,
            height: size,
            top: avatarTop,
            left: avatarLeft,
          }}
        >
          {avatarDisplaySrc ? (
            <Image src={avatarDisplaySrc} alt={alt} fill sizes={`${size}px`} className="object-cover" />
          ) : (
            <div className="flex h-full w-full items-center justify-center bg-gradient-to-br from-purple-500/20 to-emerald-500/20 text-4xl font-bold text-white/60">
              {fallbackInitial}
            </div>
          )}
        </div>
        <div
          className={`pointer-events-none absolute inset-0 ${frameZ} size-full`}
          style={{
            width: outerSize + frameOverlap * 2,
            height: outerSize + frameOverlap * 2,
          }}
        >
          {isSvgFrame ? (
            (<img
              src={displayFrameSrc!}
              alt=""
              className="h-full w-full object-contain select-none"
              draggable={false}
            />)
          ) : (
            <Image
              src={displayFrameSrc!}
              alt=""
              fill
              sizes={`${outerSize + frameOverlap * 2}px`}
              className="object-contain"
              unoptimized
            />
          )}
        </div>
        <AvatarFaceOverlay
          style={{
            top: avatarTop,
            left: avatarLeft,
            width: size,
            height: size,
          }}
        >
          {children}
        </AvatarFaceOverlay>
      </div>
    );
  }

  if (isRingAnim) {
    const cls = RING_ANIMS[anim];
    const pad = borderWidth + 4;
    return (
      <div
        className={`relative flex-shrink-0 ${className}`}
        style={{
          width: outerSize,
          height: outerSize,
          "--dec-color": color,
          "--dec-angle": "0deg",
        } as React.CSSProperties}
        onClick={onClick}
      >
        <div
          className={`absolute inset-0 z-10 rounded-full ${cls}`}
          style={{ padding: pad }}
        >
          <div className="h-full w-full overflow-hidden rounded-full bg-background">
            <div className="relative z-0 h-full w-full">
              {avatarDisplaySrc ? (
                <Image src={avatarDisplaySrc} alt={alt} fill sizes={`${size}px`} className="object-cover" />
              ) : (
                <div className="flex h-full w-full items-center justify-center bg-gradient-to-br from-purple-500/20 to-emerald-500/20 text-4xl font-bold text-white/60">
                  {fallbackInitial}
                </div>
              )}
            </div>
          </div>
        </div>
        <AvatarFaceOverlay
          style={{
            top: pad,
            left: pad,
            width: outerSize - 2 * pad,
            height: outerSize - 2 * pad,
          }}
        >
          {children}
        </AvatarFaceOverlay>
      </div>
    );
  }

  if (isEffectAnim) {
    const cls = EFFECT_ANIMS[anim];
    const inset = borderWidth + 4;
    return (
      <div
        className={`relative flex-shrink-0 ${className}`}
        style={{ width: outerSize, height: outerSize }}
        onClick={onClick}
      >
        <div className="absolute z-0 overflow-hidden rounded-full bg-white/[0.05]" style={{ inset }}>
          {avatarDisplaySrc ? (
            <Image src={avatarDisplaySrc} alt={alt} fill sizes={`${size}px`} className="object-cover" />
          ) : (
            <div className="flex h-full w-full items-center justify-center bg-gradient-to-br from-purple-500/20 to-emerald-500/20 text-4xl font-bold text-white/60">
              {fallbackInitial}
            </div>
          )}
        </div>
        <div
          className={`pointer-events-none absolute inset-0 z-10 rounded-full ${cls}`}
          style={
            {
              "--dec-color": color,
              border: `${borderWidth}px solid ${color}`,
            } as React.CSSProperties
          }
        />
        <AvatarFaceOverlay
          style={{
            top: inset,
            left: inset,
            width: outerSize - 2 * inset,
            height: outerSize - 2 * inset,
          }}
        >
          {children}
        </AvatarFaceOverlay>
      </div>
    );
  }

  return (
    <div
      className={`relative flex-shrink-0 ${className}`}
      style={{ width: size, height: size }}
      onClick={onClick}
    >
      <div className="relative h-full w-full overflow-hidden rounded-full bg-white/[0.05] ring-1 ring-white/[0.08] shadow-[0_0_40px_rgba(168,85,247,0.1)]">
        {avatarDisplaySrc ? (
          <Image src={avatarDisplaySrc} alt={alt} fill sizes={`${size}px`} className="object-cover" />
        ) : (
          <div className="flex h-full w-full items-center justify-center bg-gradient-to-br from-purple-500/20 to-emerald-500/20 text-4xl font-bold text-white/60">
            {fallbackInitial}
          </div>
        )}
      </div>
      <AvatarFaceOverlay style={{ inset: 0 }}>{children}</AvatarFaceOverlay>
    </div>
  );
}
