"use client";

import { AuroraText } from "@/components/ui/aurora-text";
import { cn } from "@/lib/utils";

const VARIANT_CLASS = {
  navbar: "text-lg font-black tracking-tighter sm:text-xl",
  auth: "text-2xl font-black tracking-tighter sm:text-3xl",
  hero: "text-[2.35rem] font-black tracking-[-0.04em] sm:text-5xl lg:text-[3.35rem]",
  intro: "text-[clamp(2.75rem,11vw,4.5rem)] font-black tracking-[-0.05em]",
} as const;

type Variant = keyof typeof VARIANT_CLASS;

/** Aurora “ACIUSFY” yazısı — landing navbar ile aynı marka görünümü */
export function AciusfyLandingWordmark({
  variant = "navbar",
  className,
}: {
  variant?: Variant;
  className?: string;
}) {
  return (
    <AuroraText
      text="ACIUSFY"
      as="span"
      className={cn(VARIANT_CLASS[variant], className)}
    />
  );
}
