"use client";

import { motion } from "framer-motion";
import { useTranslation } from "@/hooks/useTranslation";
import { Compass, Radio } from "lucide-react";
import Link from "next/link";

export function NowPlayingIdleCanvas() {
  const { t } = useTranslation();

  return (
    <div className="flex h-full min-h-0 flex-1 flex-col px-2 pb-3 pt-1">
      <div className="relative flex min-h-[min(100%,520px)] flex-1 flex-col overflow-hidden rounded-2xl border border-white/[0.08] shadow-[inset_0_1px_0_rgba(255,255,255,0.06),0_20px_50px_rgba(0,0,0,0.45)]">
        <div
          className="pointer-events-none absolute inset-0 bg-gradient-to-br from-[#1a1033]/40 via-transparent to-[#061510]/40"
          aria-hidden
        />

        <motion.div
          className="pointer-events-none absolute inset-0 opacity-50"
          animate={{
            background: [
              "radial-gradient(ellipse 80% 60% at 15% 20%, rgba(124,58,237,0.45), transparent 50%), radial-gradient(ellipse 70% 50% at 85% 75%, rgba(16,185,129,0.25), transparent 45%)",
              "radial-gradient(ellipse 75% 55% at 80% 25%, rgba(59,130,246,0.35), transparent 50%), radial-gradient(ellipse 65% 45% at 20% 80%, rgba(168,85,247,0.3), transparent 45%)",
              "radial-gradient(ellipse 80% 60% at 15% 20%, rgba(124,58,237,0.45), transparent 50%), radial-gradient(ellipse 70% 50% at 85% 75%, rgba(16,185,129,0.25), transparent 45%)",
            ],
          }}
          transition={{ duration: 14, repeat: Infinity, ease: "linear" }}
        />
        <div className="pointer-events-none absolute -right-12 -top-12 h-40 w-40 rounded-full bg-violet-500/20 blur-3xl" />
        <div className="pointer-events-none absolute -bottom-16 -left-8 h-44 w-44 rounded-full bg-emerald-500/15 blur-3xl" />

        <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/25 to-black/10" />

        <div className="relative flex flex-1 flex-col">
          <div className="flex items-start justify-end p-4">
            <span className="rounded-full border border-white/10 bg-black/25 px-2.5 py-1 text-[10px] font-semibold uppercase tracking-[0.2em] text-white/35 backdrop-blur-sm">
              Aciusfy
            </span>
          </div>

          <div className="flex flex-1 flex-col items-center justify-center px-6 pb-2 text-center">
            <motion.div
              className="relative mb-6"
              animate={{ y: [0, -6, 0] }}
              transition={{ duration: 5, repeat: Infinity, ease: "easeInOut" }}
            >
              <div className="absolute inset-0 scale-150 rounded-full bg-violet-500/20 blur-2xl" />
              <div className="relative flex h-24 w-24 items-center justify-center rounded-full border border-white/15 bg-gradient-to-br from-white/10 to-white/[0.02] shadow-[0_8px_32px_rgba(0,0,0,0.4)] backdrop-blur-sm">
                <motion.div
                  className="absolute inset-2 rounded-full border border-dashed border-white/10"
                  animate={{ rotate: 360 }}
                  transition={{ duration: 24, repeat: Infinity, ease: "linear" }}
                />
                <div className="h-3 w-3 rounded-full bg-white/20 ring-2 ring-white/10" />
              </div>
            </motion.div>

            <motion.p
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
              className="text-xl font-bold tracking-tight text-white"
            >
              {t("nowPlayingIdleTitle")}
            </motion.p>
            <motion.p
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.18 }}
              className="mt-2 max-w-[240px] text-sm leading-relaxed text-white/45"
            >
              {t("nowPlayingIdleHint")}
            </motion.p>
            <motion.p
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.28 }}
              className="mt-4 text-xs font-medium text-white/25"
            >
              {t("noSongSelected")}
            </motion.p>
          </div>

          <div className="border-t border-white/[0.06] bg-black/25 p-3 backdrop-blur-md">
            <p className="mb-2 px-1 text-[10px] font-semibold uppercase tracking-wider text-white/30">
              {t("nowPlayingIdleExplore")}
            </p>
            <div className="grid grid-cols-2 gap-2">
              <Link
                href="/search"
                className="group flex items-center gap-2 rounded-xl border border-white/[0.08] bg-white/[0.04] px-3 py-2.5 transition hover:border-white/15 hover:bg-white/[0.08]"
              >
                <Compass className="h-4 w-4 text-violet-300/80 transition group-hover:text-violet-200" />
                <span className="text-xs font-medium text-white/70 group-hover:text-white">
                  {t("browse")}
                </span>
              </Link>
              <Link
                href="/radio"
                className="group flex items-center gap-2 rounded-xl border border-white/[0.08] bg-white/[0.04] px-3 py-2.5 transition hover:border-white/15 hover:bg-white/[0.08]"
              >
                <Radio className="h-4 w-4 text-emerald-300/80 transition group-hover:text-emerald-200" />
                <span className="text-xs font-medium text-white/70 group-hover:text-white">
                  {t("smartRadio")}
                </span>
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
