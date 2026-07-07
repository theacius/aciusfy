"use client";

import { cn } from "@/lib/utils";
import { motion } from "framer-motion";
import { useRef, useState } from "react";

interface GlowingCardProps {
  children: React.ReactNode;
  className?: string;
  noHoverEffect?: boolean
}

export function GlowingCard({ children, className, noHoverEffect }: GlowingCardProps) {
  const cardRef = useRef<HTMLDivElement>(null);
  const [position, setPosition] = useState({ x: 0, y: 0 });
  const [isHovered, setIsHovered] = useState(false);

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!cardRef.current) return;
    const rect = cardRef.current.getBoundingClientRect();
    setPosition({
      x: e.clientX - rect.left,
      y: e.clientY - rect.top,
    });
  };

  return (
    <motion.div
      ref={cardRef}
      onMouseMove={handleMouseMove}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      whileHover={noHoverEffect ? undefined : { scale: 1.02, y: -5 }}
      className={cn(
        "relative overflow-hidden rounded-2xl border border-white/5 bg-card p-6 transition-colors hover:border-accent/20",
        className
      )}
    >
      {isHovered && (
        <div
          className="pointer-events-none absolute inset-0 opacity-100 transition-opacity"
          style={{
            background: `radial-gradient(400px circle at ${position.x}px ${position.y}px, rgba(124,58,237,0.12), transparent 60%)`,
          }}
        />
      )}
      <div className="relative z-10">{children}</div>
    </motion.div>
  );
}
