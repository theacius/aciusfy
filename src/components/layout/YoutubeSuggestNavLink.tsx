"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { motion } from "framer-motion";
import { Youtube } from "lucide-react";
import { useTranslation } from "@/hooks/useTranslation";
import { cn } from "@/lib/utils";

export function YoutubeSuggestNavLink() {
  const { t } = useTranslation();
  const pathname = usePathname();
  const active = pathname === "/youtube-oneri";

  return (
    <Link
      href="/youtube-oneri"
      className="relative inline-flex shrink-0 rounded-full outline-none focus-visible:ring-2 focus-visible:ring-red-400/70 focus-visible:ring-offset-2 focus-visible:ring-offset-transparent"
      title={t("youtubeSuggestTrial")}
    >
      <motion.span
        className={cn(
          "relative inline-flex h-9 min-w-0 max-w-[8.5rem] items-center justify-center overflow-hidden rounded-full px-2.5 text-xs font-semibold text-white shadow-[0_4px_24px_rgba(239,68,68,0.35)] ring-1 ring-white/15 sm:max-w-none sm:px-4 sm:text-sm",
          active && "ring-red-400/45 shadow-[0_4px_28px_rgba(239,68,68,0.45)]"
        )}
        whileHover={{ scale: 1.04 }}
        whileTap={{ scale: 0.97 }}
      >
        <span className="absolute inset-0 bg-gradient-to-r from-[#CD201F] via-[#FF0000] to-[#cc181e]" />
        <span className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,_rgba(255,255,255,0.22),_transparent_55%)]" />
        <span className="absolute inset-x-0 bottom-0 h-1/2 bg-gradient-to-t from-black/25 to-transparent" />
        <span className="relative z-10 flex items-center gap-1.5 drop-shadow-sm">
          <Youtube className="h-3.5 w-3.5 shrink-0 opacity-95 sm:h-4 sm:w-4" strokeWidth={2.25} />
          <span className="truncate">{t("youtubeSuggestTrial")}</span>
        </span>
      </motion.span>
    </Link>
  );
}
