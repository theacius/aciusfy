"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ChevronDown } from "lucide-react";
import { cn } from "@/lib/utils";
import { FloatingPanelPortal } from "@/components/ui/FloatingPanelPortal";
import { StevenPopoverItem } from "@/components/navigation/StevenPopoverPanel";

export interface DropdownOption<T = string> {
  value: T;
  label: string;
}

interface DropdownProps<T = string> {
  value: T;
  options: DropdownOption<T>[];
  onChange: (value: T) => void;
  placeholder?: string;
  className?: string;
  triggerClassName?: string;
  contentClassName?: string;
  disabled?: boolean;
}

const ease = [0.16, 1, 0.3, 1] as const;

export function Dropdown<T = string>({
  value,
  options,
  onChange,
  placeholder,
  className,
  triggerClassName,
  contentClassName,
  disabled = false,
}: DropdownProps<T>) {
  const [open, setOpen] = useState(false);
  const anchorRef = useRef<HTMLDivElement>(null);

  const selectedLabel = options.find((o) => o.value === value)?.label ?? placeholder ?? String(value);

  const handleClose = useCallback(() => setOpen(false), []);

  useEffect(() => {
    if (!open) return;
    const onDoc = (e: MouseEvent) => {
      if (anchorRef.current && !anchorRef.current.contains(e.target as Node)) handleClose();
    };
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") handleClose();
    };
    document.addEventListener("click", onDoc, true);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("click", onDoc, true);
      document.removeEventListener("keydown", onKey);
    };
  }, [open, handleClose]);

  return (
    <div ref={anchorRef} className={cn("relative", className)}>
      <button
        type="button"
        onClick={() => !disabled && setOpen((o) => !o)}
        disabled={disabled}
        aria-haspopup="listbox"
        aria-expanded={open}
        aria-label={selectedLabel}
        className={cn(
          "flex w-full min-w-[140px] items-center justify-between gap-2 rounded-full border border-white/[0.08] bg-white/[0.04] px-4 py-2.5 text-sm text-foreground transition-colors duration-200",
          "hover:border-white/[0.14] focus:border-white/20 focus:outline-none focus:ring-1 focus:ring-white/10",
          "disabled:cursor-not-allowed disabled:opacity-50",
          open && "border-white/[0.14] bg-white/[0.06]",
          triggerClassName,
        )}
      >
        <span className="truncate">{selectedLabel}</span>
        <ChevronDown
          className={cn("h-4 w-4 shrink-0 text-muted transition-transform duration-300", open && "rotate-180")}
        />
      </button>

      <FloatingPanelPortal anchorRef={anchorRef} open={open} className={cn("min-w-[var(--anchor-width,12rem)]", contentClassName)}>
        <AnimatePresence>
          {open ? (
            <motion.div
              role="listbox"
              initial={{ opacity: 0, y: -8, scale: 0.96 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: -8, scale: 0.96 }}
              transition={{ duration: 0.22, ease }}
              className="premium-dropdown-panel w-full min-w-full overflow-hidden rounded-2xl p-1.5 shadow-2xl"
            >
              {options.map((opt) => (
                <StevenPopoverItem
                  key={String(opt.value)}
                  onClick={() => {
                    onChange(opt.value);
                    handleClose();
                  }}
                  className={cn(opt.value === value && "bg-white/[0.06] text-foreground")}
                >
                  {opt.label}
                </StevenPopoverItem>
              ))}
            </motion.div>
          ) : null}
        </AnimatePresence>
      </FloatingPanelPortal>
    </div>
  );
}
