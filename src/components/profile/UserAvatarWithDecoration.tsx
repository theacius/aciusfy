"use client";

import { AvatarFrame, getAvatarFrameReservedBox, type DecorationData } from "./AvatarFrame";

type Props = {
  src: string | null;
  name: string | null;
  size: number;
  decoration?: DecorationData | null;
  isOnline?: boolean;
  onlineTitle?: string;
  className?: string;
};

export function UserAvatarWithDecoration({
  src,
  name,
  size,
  decoration,
  isOnline,
  onlineTitle,
  className = "",
}: Props) {
  const box = getAvatarFrameReservedBox(size);
  return (
    <div
      className={`relative flex flex-shrink-0 items-center justify-center ${className}`}
      style={{ width: box.w, height: box.h, minWidth: box.w, minHeight: box.h }}
    >
      <AvatarFrame
        src={src}
        alt=""
        fallbackInitial={name?.[0]?.toUpperCase() ?? "?"}
        size={size}
        decoration={decoration ?? null}
      >
        {isOnline ? (
          <span
            className="pointer-events-none absolute -right-0.5 -top-0.5 z-30 h-3.5 w-3.5 rounded-full border-2 border-[#121212] bg-emerald-500 shadow-[0_0_6px_rgba(16,185,129,0.7)]"
            title={onlineTitle}
            aria-hidden
          />
        ) : null}
      </AvatarFrame>
    </div>
  );
}
