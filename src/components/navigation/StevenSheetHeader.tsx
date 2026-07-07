"use client";

import type { LucideIcon } from "lucide-react";
import { X } from "lucide-react";
import { cn } from "@/lib/utils";

type StevenSheetHeaderProps = {
  icon?: LucideIcon;
  label: string;
  sectionIndex?: string;
  onClose?: () => void;
  closeLabel?: string;
  children?: React.ReactNode;
  className?: string;
};

export function StevenSheetHeader({
  icon: Icon,
  label,
  sectionIndex,
  onClose,
  closeLabel = "Kapat",
  children,
  className,
}: StevenSheetHeaderProps) {
  return (
    <div
      className={cn(
        "flex shrink-0 items-center justify-between border-b border-white/[0.06] px-5 py-4",
        className,
      )}
    >
      <div className="flex min-w-0 items-center gap-3">
        {sectionIndex ? (
          <span className="font-mono text-[10px] uppercase tracking-[0.2em] text-white/35">
            {sectionIndex}
          </span>
        ) : null}
        {Icon ? <Icon className="h-4 w-4 text-white/50" aria-hidden /> : null}
        <span className="truncate text-sm font-medium tracking-tight text-white">{label}</span>
      </div>
      <div className="flex shrink-0 items-center gap-1">
        {children}
        {onClose ? (
          <button
            type="button"
            onClick={onClose}
            className="rounded-full p-1.5 text-white/40 transition-colors hover:bg-white/[0.06] hover:text-white"
            aria-label={closeLabel}
          >
            <X className="h-4 w-4" />
          </button>
        ) : null}
      </div>
    </div>
  );
}
