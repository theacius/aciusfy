"use client";

import { cn } from "@/lib/utils";
import { motion } from "framer-motion";
import Link from "next/link";
import { useState, useCallback, useEffect } from "react";

interface NavItem {
  label: string;
  href: string;
  icon?: React.ReactNode;
}

interface TubelightNavbarProps {
  items: NavItem[];
  activeIndex?: number;
  className?: string;
  onItemClick?: (index: number, href: string) => void;
  /** Hash linklerde native scroll yerine (ör. Lenis) */
  onHashNavigate?: (href: string) => void;
  tone?: "default" | "blue"
}

export function TubelightNavbar({
  items,
  activeIndex = 0,
  className,
  onItemClick,
  onHashNavigate,
  tone = "default",
}: TubelightNavbarProps) {
  const blue = tone === "blue";
  const [hoveredIndex, setHoveredIndex] = useState<number | null>(null);
  const [selectedIndex, setSelectedIndex] = useState(Math.max(activeIndex, 0));
  const hasActive = activeIndex >= 0;
  const displayIdx = hoveredIndex ?? (hasActive ? activeIndex : null);

  useEffect(() => {
    setSelectedIndex(activeIndex >= 0 ? activeIndex : 0);
  }, [activeIndex]);

  const handleClick = useCallback(
    (e: React.MouseEvent, idx: number, href: string) => {
      setSelectedIndex(idx);

      if (href.startsWith("#")) {
        e.preventDefault();
        if (onHashNavigate) {
          onHashNavigate(href);
        } else {
          const targetId = href.slice(1);
          const el = document.getElementById(targetId);
          if (el) {
            el.scrollIntoView({ behavior: "smooth", block: "start" });
          } else if (targetId === "" || targetId === "top") {
            window.scrollTo({ top: 0, behavior: "smooth" });
          }
        }
      }

      onItemClick?.(idx, href);
    },
    [onItemClick, onHashNavigate]
  );

  const isHashLink = (href: string) => href.startsWith("#");

  return (
    <nav
      className={cn(
        "glass relative flex items-center gap-1 rounded-full px-2 py-2",
        className
      )}
    >
      {items.map((item, idx) => {
        const Tag = isHashLink(item.href) ? "a" : Link;
        return (
          <Tag
            key={`${item.href}-${idx}`}
            href={item.href}
            onMouseEnter={() => setHoveredIndex(idx)}
            onMouseLeave={() => setHoveredIndex(null)}
            onClick={(e: React.MouseEvent) => handleClick(e, idx, item.href)}
            className={cn(
              "relative z-10 flex items-center gap-2 rounded-full px-4 py-2 text-sm font-medium transition-colors cursor-pointer",
              displayIdx === idx ? "text-white" : "text-muted hover:text-white",
            )}
          >
            {item.icon}
            <span className="whitespace-nowrap">{item.label}</span>
            {displayIdx === idx && (
              <motion.div
                layoutId="tubelight"
                className="absolute inset-0 rounded-full"
                style={{
                  background: blue
                    ? "linear-gradient(135deg, rgba(37,99,235,0.18), rgba(147,197,253,0.1))"
                    : "linear-gradient(135deg, rgba(124,58,237,0.15), rgba(16,185,129,0.12))",
                  boxShadow: blue
                    ? "0 0 20px rgba(59,130,246,0.28), 0 0 40px rgba(147,197,253,0.08), inset 0 1px 0 rgba(255,255,255,0.06)"
                    : "0 0 20px rgba(168,85,247,0.25), 0 0 40px rgba(16,185,129,0.08), inset 0 1px 0 rgba(255,255,255,0.05)",
                }}
                transition={{
                  type: "spring",
                  stiffness: 400,
                  damping: 30,
                }}
              />
            )}
            {displayIdx === idx && (
              <motion.div
                layoutId="tubelight-glow"
                className="absolute -bottom-1 left-1/2 h-1 w-8 -translate-x-1/2 rounded-full"
                style={{
                  background: blue ? "linear-gradient(90deg, #3b82f6, #bfdbfe)" : "linear-gradient(90deg, #a855f7, #10b981)",
                  boxShadow: blue
                    ? "0 0 10px rgba(59,130,246,0.65), 0 0 20px rgba(191,219,254,0.25)"
                    : "0 0 10px rgba(168,85,247,0.7), 0 0 20px rgba(16,185,129,0.3)",
                }}
                transition={{
                  type: "spring",
                  stiffness: 400,
                  damping: 30,
                }}
              />
            )}
          </Tag>
        );
      })}
    </nav>
  );
}
