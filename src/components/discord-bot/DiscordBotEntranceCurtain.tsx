"use client";

import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import { useEffect, useLayoutEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import dynamic from "next/dynamic";
import { Server } from "lucide-react";
import { AciusfyLogoMark } from "@/components/branding/AciusfyLogoMark";
import { DiscordGlyph } from "@/components/discord-bot/DiscordGlyph";
import { CinematicLabel } from "@/components/cinematic";
import { useTranslation } from "@/hooks/useTranslation";
import { useEntranceCurtainGate } from "@/hooks/useEntranceCurtainGate";
import { ENTRANCE_CURTAIN_KEYS } from "@/lib/entrance-curtain-session";
import { getDiscordBotInviteHref } from "@/lib/discord-bot-invite";
import { cn } from "@/lib/utils";

const SpaceBackground = dynamic(
  () => import("@/components/premium/SpaceBackground").then((m) => m.SpaceBackground),
  { ssr: false },
);

const AUTO_MS = 2800;
const AUTO_MS_REDUCED = 1800;

const ICON_TILE =
  "relative flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl sm:h-16 sm:w-16";
const ICON_GLYPH = "h-7 w-7 sm:h-8 sm:w-8";

export function DiscordBotEntranceCurtain({ onDismiss }: { onDismiss?: () => void }) {
  const { t } = useTranslation();
  const reduceMotion = useReducedMotion();
  const { ready, open, dismiss } = useEntranceCurtainGate(ENTRANCE_CURTAIN_KEYS.discordBot);
  const [portalEl, setPortalEl] = useState<HTMLElement | null>(null);
  const [exiting, setExiting] = useState(false);

  const exitingRef = useRef(false);
  const onDismissRef = useRef(onDismiss);
  onDismissRef.current = onDismiss;

  useLayoutEffect(() => {
    setPortalEl(document.body);
  }, []);

  const runFinish = () => {
    if (exitingRef.current) return;
    exitingRef.current = true;
    setExiting(true);
    window.setTimeout(() => {
      dismiss();
      onDismissRef.current?.();
    }, reduceMotion ? 280 : 520);
  };

  useEffect(() => {
    if (!open) return;
    const ms = reduceMotion ? AUTO_MS_REDUCED : AUTO_MS;
    const tId = window.setTimeout(() => runFinish(), ms);
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Enter" || e.key === "Escape") {
        e.preventDefault();
        runFinish();
      }
    };
    window.addEventListener("keydown", onKey);
    return () => {
      window.clearTimeout(tId);
      window.removeEventListener("keydown", onKey);
      document.body.style.overflow = "";
    };
  }, [open, reduceMotion]);

  if (!ready || !portalEl || !open) return null;

  return createPortal(
    <AnimatePresence>
      {open ? (
        <motion.div
          key="discord-bot-curtain"
          className="fixed inset-0 z-[260] flex items-center justify-center overflow-hidden"
          initial={reduceMotion ? { opacity: 0 } : { opacity: 1, clipPath: "circle(0% at 50% 50%)" }}
          animate={
            reduceMotion
              ? { opacity: exiting ? 0 : 1 }
              : exiting
                ? {
                    opacity: 0,
                    clipPath: "circle(0% at 50% 50%)",
                    filter: "blur(10px)",
                  }
                : { opacity: 1, clipPath: "circle(150% at 50% 50%)", filter: "blur(0px)" }
          }
          transition={{
            duration: reduceMotion ? 0.35 : exiting ? 0.52 : 0.85,
            ease: [0.22, 1, 0.36, 1],
          }}
        >
          <button
            type="button"
            aria-label={t("discordBotEntranceBackdropAria")}
            className="absolute inset-0 z-[1] cursor-pointer border-0 bg-transparent"
            onClick={runFinish}
          />

          <div className="pointer-events-none absolute inset-0 z-0 bg-[#030510]">
            <SpaceBackground intensity="intro" className="absolute inset-0 opacity-90" />
            <div
              className="absolute inset-0"
              style={{
                background:
                  "radial-gradient(ellipse 70% 50% at 50% 35%, rgba(88,101,242,0.18) 0%, transparent 55%), radial-gradient(ellipse 50% 40% at 80% 80%, rgba(124,58,237,0.12) 0%, transparent 50%)",
              }}
            />
          </div>

          <motion.div
            className="premium-glass-card pointer-events-none relative z-10 mx-4 flex w-full max-w-md flex-col items-center gap-8 rounded-3xl px-8 py-10 sm:px-10"
            initial={reduceMotion ? { opacity: 0 } : { opacity: 0, y: 24, scale: 0.96 }}
            animate={{
              opacity: exiting ? 0 : 1,
              y: exiting ? -12 : 0,
              scale: exiting ? 1.03 : 1,
            }}
            transition={{ duration: 0.55, ease: [0.22, 1, 0.36, 1], delay: reduceMotion ? 0 : 0.12 }}
          >
            <CinematicLabel className="justify-center text-[#5865F2]/90">Discord Bot</CinematicLabel>

            <div className="flex items-center gap-4 sm:gap-5">
              <motion.div
                className={cn(ICON_TILE, "bg-[#5865F2] shadow-[0_0_40px_rgba(88,101,242,0.45)]")}
                initial={{ scale: 0.8, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                transition={{ type: "spring", stiffness: 260, damping: 20, delay: 0.08 }}
              >
                <DiscordGlyph className={cn(ICON_GLYPH, "text-white")} />
              </motion.div>

              <motion.span
                className="text-lg font-light text-white/35"
                initial={{ opacity: 0, scale: 0.5 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: 0.18, duration: 0.35 }}
                aria-hidden
              >
                ×
              </motion.span>

              <motion.div
                className={cn(
                  ICON_TILE,
                  "border border-white/10 bg-white/[0.04] shadow-[0_0_32px_rgba(124,58,237,0.2)]",
                )}
                initial={{ scale: 0.8, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                transition={{ type: "spring", stiffness: 260, damping: 20, delay: 0.14 }}
              >
                <AciusfyLogoMark
                  presentation="bare"
                  alt=""
                  priority
                  className="flex h-full w-full items-center justify-center"
                  imgClassName="!max-h-[1.75rem] !max-w-[1.75rem] sm:!max-h-8 sm:!max-w-8 drop-shadow-[0_0_12px_rgba(168,85,247,0.35)]"
                />
              </motion.div>
            </div>

            <div className="text-center">
              <h1 className="font-display text-2xl tracking-[-0.03em] text-foreground sm:text-[1.65rem]">
                {t("discordBotPageTitle")}
              </h1>
              <p className="mt-2 text-sm text-muted">{t("discordBotHeroBadge")}</p>
            </div>

            <motion.div
              className="pointer-events-auto flex w-full flex-col items-center gap-3"
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: exiting ? 0 : 1, y: 0 }}
              transition={{ delay: 0.35, duration: 0.4 }}
            >
              <a
                href={getDiscordBotInviteHref()}
                target="_blank"
                rel="noopener noreferrer"
                aria-label={t("discordBotAddToServerAria")}
                className="inline-flex w-full max-w-xs items-center justify-center gap-2 rounded-full bg-[#5865F2] px-5 py-2.5 text-sm font-semibold text-white shadow-lg shadow-indigo-900/35 ring-1 ring-white/10 transition hover:bg-[#4752c4]"
              >
                <Server className="h-4 w-4 shrink-0 opacity-95" aria-hidden />
                {t("discordBotAddToServer")}
              </a>
              <button
                type="button"
                onClick={runFinish}
                className="text-sm font-medium text-zinc-400 underline-offset-4 transition hover:text-zinc-200 hover:underline"
              >
                {t("discordBotEntranceContinue")}
              </button>
              <p className="text-center text-[11px] text-zinc-600">{t("discordBotEntranceKeyboardHint")}</p>
            </motion.div>
          </motion.div>
        </motion.div>
      ) : null}
    </AnimatePresence>,
    portalEl,
  );
}
