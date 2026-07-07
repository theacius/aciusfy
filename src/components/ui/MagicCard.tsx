"use client";

import { useRef, useState, useCallback, type ReactNode, type MouseEvent } from "react";

export type MagicCardTint = "indigo" | "emerald";

type MagicCardProps = {
  children: ReactNode;
  className?: string;
  tint?: MagicCardTint;
};

export function MagicCard({ children, className = "", tint = "indigo" }: MagicCardProps) {
  const ref = useRef<HTMLDivElement>(null);
  const [p, setP] = useState({ x: 0, y: 0, active: false });

  const move = useCallback((e: MouseEvent<HTMLDivElement>) => {
    const r = ref.current?.getBoundingClientRect();
    if (!r) return;
    setP({ x: e.clientX - r.left, y: e.clientY - r.top, active: true });
  }, []);

  const enter = useCallback((e: MouseEvent<HTMLDivElement>) => {
    const r = ref.current?.getBoundingClientRect();
    if (!r) return;
    setP({ x: e.clientX - r.left, y: e.clientY - r.top, active: true });
  }, []);

  const leave = useCallback(() => {
    setP((s) => ({ ...s, active: false }));
  }, []);

  const gradient =
    tint === "indigo"
      ? `radial-gradient(520px circle at ${p.x}px ${p.y}px, rgba(167, 139, 250, 0.32), rgba(99, 102, 241, 0.08) 42%, transparent 62%)`
      : `radial-gradient(520px circle at ${p.x}px ${p.y}px, rgba(52, 211, 153, 0.28), rgba(16, 185, 129, 0.08) 42%, transparent 62%)`;

  return (
    <div
      ref={ref}
      className={`relative overflow-hidden rounded-2xl ${className}`}
      onMouseMove={move}
      onMouseEnter={enter}
      onMouseLeave={leave}
    >
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 z-0 transition-opacity duration-500 ease-out"
        style={{
          opacity: p.active ? 1 : 0,
          background: gradient,
        }}
      />
      <div className="relative z-[1]">{children}</div>
    </div>
  );
}
