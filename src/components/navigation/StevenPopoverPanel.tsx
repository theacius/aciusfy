"use client";

import { motion, AnimatePresence } from "framer-motion";
import { cn } from "@/lib/utils";

const ease = [0.16, 1, 0.3, 1] as const;

type StevenPopoverPanelProps = {
  open: boolean;
  children: React.ReactNode;
  className?: string;
  align?: "start" | "end";
};

export function StevenPopoverPanel({ open, children, className, align = "end" }: StevenPopoverPanelProps) {
  return (
    <AnimatePresence>
      {open ? (
        <motion.div
          initial={{ opacity: 0, y: -8, scale: 0.96 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: -8, scale: 0.96 }}
          transition={{ duration: 0.22, ease }}
          className={cn(
            "premium-dropdown-panel overflow-hidden rounded-2xl p-1.5",
            align === "end" ? "right-0" : "left-0",
            className,
          )}
        >
          {children}
        </motion.div>
      ) : null}
    </AnimatePresence>
  );
}

export function StevenPopoverItem({
  children,
  onClick,
  destructive,
  className,
}: {
  children: React.ReactNode;
  onClick?: () => void;
  destructive?: boolean;
  className?: string;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        "flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-left text-sm transition-colors",
        destructive
          ? "text-red-400/85 hover:bg-red-500/10 hover:text-red-400"
          : "text-foreground/75 hover:bg-white/[0.06] hover:text-foreground",
        className,
      )}
    >
      {children}
    </button>
  );
}
