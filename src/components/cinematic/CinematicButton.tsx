"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import { cn } from "@/lib/utils";

type CinematicButtonProps = {
  children: React.ReactNode;
  className?: string;
  href?: string;
  onClick?: () => void;
  variant?: "primary" | "ghost" | "outline";
  type?: "button" | "submit";
};

const variants = {
  primary: "bg-foreground text-background hover:bg-foreground/90",
  ghost: "bg-transparent text-foreground hover:bg-white/[0.06]",
  outline: "border border-white/15 bg-transparent text-foreground hover:border-white/30 hover:bg-white/[0.04]",
};

export function CinematicButton({
  children,
  className,
  href,
  onClick,
  variant = "primary",
  type = "button",
}: CinematicButtonProps) {
  const classes = cn(
    "inline-flex items-center justify-center gap-2 rounded-full px-6 py-2.5 text-sm font-medium tracking-wide transition-colors",
    variants[variant],
    className,
  );

  if (href) {
    return (
      <motion.div whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}>
        <Link href={href} className={classes}>
          {children}
        </Link>
      </motion.div>
    );
  }

  return (
    <motion.button
      type={type}
      onClick={onClick}
      whileHover={{ scale: 1.02 }}
      whileTap={{ scale: 0.98 }}
      className={classes}
    >
      {children}
    </motion.button>
  );
}
