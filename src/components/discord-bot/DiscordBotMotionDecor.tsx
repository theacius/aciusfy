"use client";

import { motion, useReducedMotion } from "framer-motion";

const FLOATS = [
  { left: "8%", top: "18%", size: 6, duration: 11, delay: 0 },
  { left: "78%", top: "12%", size: 4, duration: 9, delay: 1.2 },
  { left: "88%", top: "45%", size: 5, duration: 13, delay: 0.4 },
  { left: "15%", top: "62%", size: 4, duration: 10, delay: 2 },
  { left: "42%", top: "8%", size: 3, duration: 8, delay: 0.8 },
  { left: "55%", top: "70%", size: 5, duration: 12, delay: 1.5 },
  { left: "92%", top: "78%", size: 4, duration: 14, delay: 0.2 },
];

export function DiscordBotAmbientLayer() {
  const reduceMotion = useReducedMotion();

  if (reduceMotion) {
    return (
      <div className="pointer-events-none absolute inset-0 overflow-hidden">
        <div
          className="absolute inset-0 opacity-[0.2]"
          style={{
            backgroundImage:
              "linear-gradient(rgba(139,92,246,0.12) 1px, transparent 1px), linear-gradient(90deg, rgba(139,92,246,0.12) 1px, transparent 1px)",
            backgroundSize: "56px 56px",
          }}
        />
      </div>
    );
  }

  return (
    <div className="pointer-events-none absolute inset-0 overflow-hidden">
      <motion.div
        className="absolute inset-0 opacity-[0.22]"
        style={{
          backgroundImage:
            "linear-gradient(rgba(139,92,246,0.14) 1px, transparent 1px), linear-gradient(90deg, rgba(139,92,246,0.14) 1px, transparent 1px)",
          backgroundSize: "56px 56px",
        }}
        animate={{ backgroundPosition: ["0px 0px", "56px 56px"] }}
        transition={{ duration: 24, repeat: Infinity, ease: "linear" }}
      />
      <motion.div
        className="absolute inset-0 opacity-[0.06]"
        style={{
          backgroundImage:
            "linear-gradient(rgba(56,189,248,0.35) 1px, transparent 1px), linear-gradient(90deg, rgba(56,189,248,0.35) 1px, transparent 1px)",
          backgroundSize: "28px 28px",
        }}
        animate={{ backgroundPosition: ["0px 0px", "-28px 28px"] }}
        transition={{ duration: 18, repeat: Infinity, ease: "linear" }}
      />

      {FLOATS.map((f, i) => (
        <motion.span
          key={i}
          className="absolute rounded-full bg-violet-400/40 blur-[1px] shadow-[0_0_12px_rgba(167,139,250,0.45)]"
          style={{
            left: f.left,
            top: f.top,
            width: f.size,
            height: f.size,
          }}
          animate={{
            y: [0, -28, 0],
            x: [0, i % 2 === 0 ? 12 : -10, 0],
            opacity: [0.25, 0.85, 0.25],
            scale: [1, 1.4, 1],
          }}
          transition={{
            duration: f.duration,
            repeat: Infinity,
            ease: "easeInOut",
            delay: f.delay,
          }}
        />
      ))}
    </div>
  );
}
