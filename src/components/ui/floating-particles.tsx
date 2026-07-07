"use client";

import { useEffect, useState } from "react";

interface FloatingParticlesProps {
  particleCount?: number;
  minSize?: number;
  maxSize?: number;
  speed?: number;
  color?: string;
  opacity?: number;
  className?: string;
}

export function FloatingParticles(
  {
    particleCount = 8,
    minSize = 0.5,
    maxSize = 1,
    speed = 0.3,
    color = "#ffffff",
    opacity = 0.6,
    className = "",
  }: FloatingParticlesProps
) {
  const [mounted, setMounted] = useState(false);
  const [particles, setParticles] = useState<Array<{
    id: number;
    x: number;
    y: number;
    size: number;
    vx: number;
    vy: number;
  }>>([]);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (!mounted) return;
    const initial = Array.from({ length: particleCount }, (_, i) => ({
      id: i,
      x: Math.random() * 100,
      y: Math.random() * 100,
      size: minSize + Math.random() * (maxSize - minSize),
      vx: (Math.random() - 0.5) * speed,
      vy: (Math.random() - 0.5) * speed,
    }));
    setParticles(initial);
  }, [mounted, particleCount, minSize, maxSize, speed]);

  useEffect(() => {
    if (!mounted || particles.length === 0) return;
    const interval = setInterval(() => {
      setParticles((prev) =>
        prev.map((p) => {
          let newX = p.x + p.vx;
          let newY = p.y + p.vy;
          let newVx = p.vx;
          let newVy = p.vy;

          if (newX <= 0 || newX >= 100) {
            newVx = -newVx + (Math.random() - 0.5) * 0.1;
            newX = Math.max(0, Math.min(100, newX));
          }
          if (newY <= 0 || newY >= 100) {
            newVy = -newVy + (Math.random() - 0.5) * 0.1;
            newY = Math.max(0, Math.min(100, newY));
          }

          newVx += (Math.random() - 0.5) * 0.02;
          newVy += (Math.random() - 0.5) * 0.02;
          const maxVel = speed * 2;
          newVx = Math.max(-maxVel, Math.min(maxVel, newVx));
          newVy = Math.max(-maxVel, Math.min(maxVel, newVy));

          return { ...p, x: newX, y: newY, vx: newVx, vy: newVy };
        })
      );
    }, 50);
    return () => clearInterval(interval);
  }, [speed, mounted, particles.length]);

  if (!mounted) return null;

  return (
    <div
      className={`pointer-events-none absolute inset-0 overflow-hidden ${className}`}
    >
      {particles.map((p) => (
        <div
          key={p.id}
          className="absolute rounded-full transition-all duration-75 ease-linear"
          style={{
            left: `${p.x}%`,
            top: `${p.y}%`,
            width: `${p.size}px`,
            height: `${p.size}px`,
            backgroundColor: color,
            opacity: Number(opacity),
            transform: "translate(-50%, -50%)",
          }}
        />
      ))}
    </div>
  );
}
