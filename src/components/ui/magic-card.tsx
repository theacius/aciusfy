"use client";

import { useState, useId, type MouseEvent, type ReactNode } from "react";

interface MagicCardProps {
  children: ReactNode;
  className?: string;
  onClick?: () => void;
  imageUrl?: string | null
  glowColor?: string
}

export function MagicCard(
  {
    children,
    className = "",
    onClick,
    imageUrl,
    glowColor,
  }: MagicCardProps
) {
  const filterId = `magic-blur-${useId().replace(/:/g, "")}`;
  const [pointerOffset, setPointerOffset] = useState({ x: -10, y: -10 });
  const [isHovered, setIsHovered] = useState(false);

  const handleMouseMove = (e: MouseEvent<HTMLDivElement>) => {
    const card = e.currentTarget;
    const rect = card.getBoundingClientRect();
    const centerX = rect.left + rect.width / 2;
    const centerY = rect.top + rect.height / 2;
    const x = Math.max(-1, Math.min(1, (e.clientX - centerX) / (rect.width / 2)));
    const y = Math.max(-1, Math.min(1, (e.clientY - centerY) / (rect.height / 2)));
    setPointerOffset({ x, y });
  };

  const handleMouseLeave = () => {
    setPointerOffset({ x: -10, y: -10 });
    setIsHovered(false);
  };

  return (
    <div
      className={`relative overflow-hidden rounded-xl ${className}`}
      onClick={onClick}
      onMouseMove={handleMouseMove}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={handleMouseLeave}
    >
      
      {imageUrl && (
        <div
          className="pointer-events-none absolute inset-0 z-0 overflow-hidden rounded-[inherit] transition-opacity duration-300"
          style={{
            opacity: isHovered ? 0.65 : 0,
          }}
        >
          <div
            className="absolute inset-0 flex items-center justify-center"
            style={{
              transform: `translate(calc(${pointerOffset.x} * 20%), calc(${pointerOffset.y} * 20%)) scale(2.2)`,
              filter: `url(#${filterId}) saturate(3) brightness(1.15) contrast(1.1)`,
            }}
          >
            
            <img src={imageUrl} alt="" className="h-full min-h-full w-full min-w-full object-cover" />
          </div>
        </div>
      )}

      
      {!imageUrl && glowColor && isHovered && (
        <div
          className="pointer-events-none absolute inset-0 z-0 rounded-[inherit] transition-opacity duration-300"
          style={{
            background: `radial-gradient(280px circle at calc(50% + ${pointerOffset.x * 40}px) calc(50% + ${pointerOffset.y * 40}px), ${glowColor}80, ${glowColor}30 40%, transparent 70%)`,
          }}
        />
      )}

      <div className="relative z-10">{children}</div>

      <svg className="absolute h-0 w-0 overflow-visible opacity-0 pointer-events-none" aria-hidden>
        <defs>
          <filter id={filterId} width="500%" height="500%" x="-100%" y="-100%">
            <feGaussianBlur in="SourceGraphic" stdDeviation="28" />
          </filter>
        </defs>
      </svg>
    </div>
  );
}
