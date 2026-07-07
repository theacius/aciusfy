"use client";

import { cn } from "@/lib/utils";
import { motion, AnimatePresence } from "framer-motion";
import Image from "next/image";
import { useState } from "react";

interface FocusCard {
  title: string;
  src: string;
  color?: string;
  onClick?: () => void;
}

interface FocusCardsProps {
  cards: FocusCard[];
  className?: string;
  glowTone?: "default" | "blue"
}

export function FocusCards({ cards, className, glowTone = "default" }: FocusCardsProps) {
  const blueGlow = glowTone === "blue";
  const [hovered, setHovered] = useState<number | null>(null);

  return (
    <div className={cn("grid grid-cols-2 gap-4 md:grid-cols-3 lg:grid-cols-4", className)}>
      {cards.map((card, idx) => (
        <motion.div
          key={card.title}
          onMouseEnter={() => setHovered(idx)}
          onMouseLeave={() => setHovered(null)}
          onClick={card.onClick}
          className={cn(
            "relative aspect-square cursor-pointer overflow-hidden rounded-2xl transition-all duration-300",
            hovered !== null && hovered !== idx && "scale-95 blur-sm brightness-50"
          )}
          whileHover={{ scale: 1.05 }}
        >
          <Image
            src={card.src}
            alt={card.title}
            fill
            sizes="(max-width: 768px) 100vw, 400px"
            className="object-cover"
          />
          <div
            className="absolute inset-0"
            style={{
              background: card.color
                ? `linear-gradient(to top, ${card.color}cc, transparent)`
                : "linear-gradient(to top, rgba(0,0,0,0.8), transparent)",
            }}
          />
          <div className="absolute bottom-0 left-0 right-0 p-4">
            <h3 className="text-lg font-bold text-white">{card.title}</h3>
          </div>
          <AnimatePresence>
            {hovered === idx && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="absolute inset-0 border-2 border-accent/50 rounded-2xl pointer-events-none"
                style={{
                  boxShadow: blueGlow
                    ? "inset 0 0 30px rgba(37,99,235,0.22)"
                    : "inset 0 0 30px rgba(124,58,237,0.2)",
                }}
              />
            )}
          </AnimatePresence>
        </motion.div>
      ))}
    </div>
  );
}
