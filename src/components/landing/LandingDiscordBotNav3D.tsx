"use client";

import Link from "next/link";
import { motion, useReducedMotion } from "framer-motion";
import { AciusfyLogoMark } from "@/components/branding/AciusfyLogoMark";
import { DiscordGlyph } from "@/components/discord-bot/DiscordGlyph";
import { cn } from "@/lib/utils";
import { useTranslation } from "@/hooks/useTranslation";

type Props = {
  onNavigate?: () => void;
  className?: string;
  compact?: boolean;
};

const ICON_BOX = "flex h-7 w-7 shrink-0 items-center justify-center rounded-lg sm:h-8 sm:w-8 sm:rounded-xl";

export function LandingDiscordBotNav3D({ onNavigate, className, compact = false }: Props) {
  const { t } = useTranslation();
  const reduce = useReducedMotion();

  return (
    <Link
      href="/discord-bot"
      onClick={onNavigate}
      aria-label={t("landingDiscordCollabAria")}
      className={cn(
        "group relative inline-flex shrink-0 items-center overflow-hidden rounded-full",
        "border border-white/[0.1] bg-white/[0.04] shadow-[inset_0_1px_0_rgba(255,255,255,0.06)]",
        "ring-1 ring-white/[0.06] backdrop-blur-xl transition-all duration-300",
        "hover:border-[#5865F2]/35 hover:bg-white/[0.07] hover:shadow-[0_0_24px_rgba(88,101,242,0.18)]",
        "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#5865F2]/45",
        compact ? "gap-1.5 px-2 py-1.5" : "gap-2 px-2.5 py-1.5 sm:px-3 sm:py-2",
        className,
      )}
    >
      {!reduce ? (
        <motion.span
          aria-hidden
          className="pointer-events-none absolute inset-0 bg-gradient-to-r from-transparent via-white/[0.06] to-transparent"
          initial={{ x: "-120%" }}
          animate={{ x: ["-120%", "140%"] }}
          transition={{ duration: 3.2, repeat: Infinity, ease: "easeInOut", repeatDelay: 2.8 }}
        />
      ) : null}

      <span className={cn(ICON_BOX, "bg-[#5865F2] shadow-[0_0_16px_rgba(88,101,242,0.35)]")}>
        <DiscordGlyph className="h-3.5 w-3.5 text-white sm:h-4 sm:w-4" />
      </span>

      <span className="select-none text-[0.65rem] font-medium text-white/35 sm:text-xs" aria-hidden>
        ×
      </span>

      <span
        className={cn(
          ICON_BOX,
          "border border-white/10 bg-[#0a0f1e]/80 shadow-[0_0_14px_rgba(124,58,237,0.2)]",
        )}
      >
        <AciusfyLogoMark
          presentation="bare"
          alt=""
          className="flex h-full w-full items-center justify-center"
          imgClassName="!max-h-[1.125rem] !max-w-[1.125rem] sm:!max-h-5 sm:!max-w-5 drop-shadow-[0_0_8px_rgba(168,85,247,0.35)]"
        />
      </span>

      {!compact ? (
        <span className="hidden min-w-0 pr-0.5 text-xs font-semibold tracking-tight text-white/85 lg:inline xl:text-[0.8125rem]">
          <span className="text-[#a5b4fc]">Discord</span>
          <span className="mx-1 text-white/30">×</span>
          <span className="bg-gradient-to-r from-violet-200 to-sky-200 bg-clip-text text-transparent">
            Aciusfy
          </span>
        </span>
      ) : null}
    </Link>
  );
}
