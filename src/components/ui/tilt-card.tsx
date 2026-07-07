"use client";

import { useRef, useState, type MouseEvent, type ReactNode } from "react";
import { motion } from "framer-motion";

interface TiltCardProps {
  children: ReactNode;
  className?: string;
  onClick?: () => void;
  tiltAmount?: number;
  glareOpacity?: number;
}

export function TiltCard({
  children,
  className = "",
  onClick,
  tiltAmount = 15,
  glareOpacity = 0.15,
}: TiltCardProps) {
  const ref = useRef<HTMLDivElement>(null);
  const [tilt, setTilt] = useState({ x: 0, y: 0, glareX: 50, glareY: 50 });

  const handleMouseMove = (e: MouseEvent) => {
    if (!ref.current) return;
    const rect = ref.current.getBoundingClientRect();
    const x = (e.clientX - rect.left) / rect.width;
    const y = (e.clientY - rect.top) / rect.height;
    setTilt({
      x: (y - 0.5) * tiltAmount,
      y: -(x - 0.5) * tiltAmount,
      glareX: x * 100,
      glareY: y * 100,
    });
  };

  const handleMouseLeave = () => {
    setTilt({ x: 0, y: 0, glareX: 50, glareY: 50 });
  };

  return (
    <motion.div
      ref={ref}
      onMouseMove={handleMouseMove}
      onMouseLeave={handleMouseLeave}
      onClick={onClick}
      animate={{
        rotateX: tilt.x,
        rotateY: tilt.y,
      }}
      transition={{ type: "spring", stiffness: 300, damping: 20, mass: 0.5 }}
      style={{ perspective: 800, transformStyle: "preserve-3d" }}
      className={`relative overflow-hidden ${className}`}
    >
      {children}
      <div
        className="pointer-events-none absolute inset-0 rounded-[inherit] transition-opacity duration-200"
        style={{
          background: `radial-gradient(circle at ${tilt.glareX}% ${tilt.glareY}%, rgba(255,255,255,${glareOpacity}), transparent 60%)`,
        }}
      />
    </motion.div>
  );
}
