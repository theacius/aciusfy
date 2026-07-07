"use client";

import { useEffect } from "react";
import { createPortal } from "react-dom";
import Link from "next/link";
import { motion, AnimatePresence, useReducedMotion } from "framer-motion";
import type { LucideIcon } from "lucide-react";
import { cn } from "@/lib/utils";
import { StevenClockStrip } from "@/components/navigation/StevenClockStrip";

export type StevenActionItem = {
  id: string;
  label: string;
  href?: string;
  onClick?: () => void | Promise<void>;
  onNavigate?: () => void;
  icon?: LucideIcon;
  destructive?: boolean;
  divider?: boolean;
};

type StevenActionMenuProps = {
  open: boolean;
  onClose: () => void;
  items: StevenActionItem[];
  title?: string;
  subtitle?: string;
  footer?: React.ReactNode;
  closeLabel?: string;
};

const ease = [0.16, 1, 0.3, 1] as const;

export function StevenActionMenu({
  open,
  onClose,
  items,
  title = "Menu",
  subtitle,
  footer,
  closeLabel = "Close",
}: StevenActionMenuProps) {
  const reduceMotion = useReducedMotion();

  useEffect(() => {
    if (!open) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKey);
    return () => {
      document.body.style.overflow = prev;
      window.removeEventListener("keydown", onKey);
    };
  }, [open, onClose]);

  if (typeof document === "undefined") return null;

  let index = 0;

  return createPortal(
    <AnimatePresence>
      {open ? (
        <motion.div
          role="dialog"
          aria-modal="true"
          aria-label={title}
          initial={reduceMotion ? false : { opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={reduceMotion ? undefined : { opacity: 0 }}
          transition={{ duration: 0.35, ease }}
          className="fixed inset-0 z-[var(--z-overlay)] flex flex-col bg-[#09090b]/98 backdrop-blur-xl"
          style={{
            paddingTop: "max(1rem, env(safe-area-inset-top, 0px))",
            paddingBottom: "max(1rem, env(safe-area-inset-bottom, 0px))",
          }}
        >
          <div className="flex items-center justify-between gap-4 border-b border-white/[0.06] px-5 py-5 sm:px-8">
            <StevenClockStrip className="!flex" />
            <button
              type="button"
              onClick={onClose}
              className="aciusfy-electron-chrome ml-auto rounded-full border border-white/10 px-4 py-2 text-xs font-medium uppercase tracking-[0.18em] text-foreground/80 transition-colors hover:border-white/20 hover:bg-white/[0.04] hover:text-foreground"
            >
              {closeLabel}
            </button>
          </div>

          {(subtitle || title) && (
            <div className="border-b border-white/[0.06] px-5 py-6 sm:px-8 md:px-12">
              {title ? (
                <p className="font-mono text-[10px] uppercase tracking-[0.2em] text-foreground/35">{title}</p>
              ) : null}
              {subtitle ? (
                <p className="mt-2 font-display text-2xl font-medium tracking-[-0.03em] text-foreground sm:text-3xl">
                  {subtitle}
                </p>
              ) : null}
            </div>
          )}

          <nav className="flex min-h-0 flex-1 flex-col justify-center overflow-y-auto px-5 py-6 sm:px-8 md:px-12 lg:px-16">
            <ul className="space-y-1 sm:space-y-2">
              {items.map((item) => {
                if (item.divider) {
                  return <li key={item.id} className="my-3 border-t border-white/[0.06]" aria-hidden />;
                }

                index += 1;
                const Icon = item.icon;
                const num = String(index).padStart(2, "0");

                const row = (
                  <span className="flex items-center gap-4 sm:gap-5">
                    <span className="w-12 shrink-0 font-mono text-xs text-foreground/25 tabular-nums sm:text-sm">
                      ( {num} )
                    </span>
                    {Icon ? (
                      <Icon
                        className={cn(
                          "h-5 w-5 shrink-0 sm:h-6 sm:w-6",
                          item.destructive ? "text-red-400/80" : "text-foreground/45",
                        )}
                        aria-hidden
                      />
                    ) : null}
                    <span
                      className={cn(
                        "font-display text-2xl font-medium tracking-[-0.03em] sm:text-3xl md:text-4xl",
                        item.destructive ? "text-red-400/90" : "text-foreground",
                      )}
                    >
                      {item.label}
                    </span>
                  </span>
                );

                const className = cn(
                  "group block w-full rounded-2xl px-2 py-3 text-left transition-colors sm:px-3 sm:py-4",
                  "hover:bg-white/[0.03]",
                  item.destructive && "hover:bg-red-500/[0.06]",
                );

                const run = async () => {
                  if (item.onClick) await item.onClick();
                  else if (item.onNavigate) item.onNavigate();
                  else if (item.href?.startsWith("#")) {
                    const id = item.href.slice(1);
                    if (id === "" || id === "top") window.scrollTo({ top: 0, behavior: "smooth" });
                    else document.getElementById(id)?.scrollIntoView({ behavior: "smooth", block: "start" });
                  }
                  onClose();
                };

                return (
                  <motion.li
                    key={item.id}
                    initial={reduceMotion ? false : { opacity: 0, y: 16 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.04 + index * 0.04, duration: 0.45, ease }}
                  >
                    {item.href && !item.onClick ? (
                      item.href.startsWith("#") ? (
                        <button type="button" className={className} onClick={() => void run()}>
                          {row}
                        </button>
                      ) : (
                        <Link href={item.href} className={className} onClick={() => onClose()}>
                          {row}
                        </Link>
                      )
                    ) : (
                      <button type="button" className={className} onClick={() => void run()}>
                        {row}
                      </button>
                    )}
                  </motion.li>
                );
              })}
            </ul>
          </nav>

          {footer ? (
            <div className="border-t border-white/[0.06] px-5 py-6 sm:px-8">{footer}</div>
          ) : null}
        </motion.div>
      ) : null}
    </AnimatePresence>,
    document.body,
  );
}
