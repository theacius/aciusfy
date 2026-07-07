"use client";

import { cn } from "@/lib/utils";

type StevenSelectProps = React.SelectHTMLAttributes<HTMLSelectElement>;

export function StevenSelect({ className, ...props }: StevenSelectProps) {
  return (
    <select
      className={cn(
        "w-full appearance-none rounded-full border border-white/[0.08] bg-white/[0.04] px-4 py-2.5 text-sm text-foreground",
        "transition-colors hover:border-white/[0.14] focus:border-white/20 focus:outline-none focus:ring-1 focus:ring-white/10",
        "disabled:cursor-not-allowed disabled:opacity-50",
        "[&_option]:bg-[#09090b] [&_option]:text-foreground",
        className,
      )}
      {...props}
    />
  );
}
