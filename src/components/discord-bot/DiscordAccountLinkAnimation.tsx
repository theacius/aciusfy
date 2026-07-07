"use client";

import { motion, AnimatePresence, useReducedMotion } from "framer-motion";
import { Check } from "lucide-react";
import { AciusfyLogoMark } from "@/components/branding/AciusfyLogoMark";
import { useTranslation } from "@/hooks/useTranslation";

function DiscordMark({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="currentColor" aria-hidden>
      <path d="M20.317 4.37a19.791 19.791 0 0 0-4.885-1.515.074.074 0 0 0-.079.037c-.21.375-.444.864-.608 1.25a18.27 18.27 0 0 0-5.487 0 12.64 12.64 0 0 0-.617-1.25.077.077 0 0 0-.079-.037A19.736 19.736 0 0 0 3.677 4.37a.07.07 0 0 0-.032.027C.533 9.046-.32 13.58.099 18.057a.082.082 0 0 0 .031.057 19.9 19.9 0 0 0 5.993 3.03.078.078 0 0 0 .084-.028 14.09 14.09 0 0 0 1.226-1.994.076.076 0 0 0-.041-.106 13.107 13.107 0 0 1-1.872-.892.077.077 0 0 1-.008-.128 10.2 10.2 0 0 0 .372-.292.074.074 0 0 1 .077-.01c3.928 1.793 8.18 1.793 12.062 0a.074.074 0 0 1 .078.01c.12.098.246.198.373.292a.077.077 0 0 1-.006.127 12.299 12.299 0 0 1-1.873.892.077.077 0 0 0-.041.107c.36.698.772 1.362 1.225 1.993a.076.076 0 0 0 .084.028 19.839 19.839 0 0 0 6.002-3.03.077.077 0 0 0 .032-.054c.5-5.177-.838-9.674-3.549-13.66a.061.061 0 0 0-.031-.03zM8.02 15.33c-1.183 0-2.157-1.085-2.157-2.419 0-1.333.956-2.419 2.157-2.419 1.21 0 2.176 1.096 2.157 2.42 0 1.333-.956 2.418-2.157 2.418zm7.975 0c-1.183 0-2.157-1.085-2.157-2.419 0-1.333.955-2.419 2.157-2.419 1.21 0 2.176 1.096 2.157 2.42 0 1.333-.946 2.418-2.157 2.418z" />
    </svg>
  );
}

type Mode = "redirect" | "success" | "disconnect";

type Props = {
  open: boolean;
  mode: Mode;
  onExitComplete?: () => void
};

function DisconnectSplitVisual({ reduce }: { reduce: boolean }) {
  const { t } = useTranslation();
  if (reduce) {
    return (
      <div className="flex min-h-[9rem] flex-col items-center justify-center">
        <p className="max-w-xs text-center text-sm text-zinc-400">{t("discordBotOAuthDisconnectMessage")}</p>
      </div>
    );
  }
  return (
    <>
      <motion.div
        className="absolute flex h-[5.5rem] w-[5.5rem] items-center justify-center rounded-3xl bg-gradient-to-br from-violet-600 via-[#5865F2] to-indigo-700 p-1 shadow-[0_0_48px_rgba(88,101,242,0.45)] ring-2 ring-white/25 sm:h-24 sm:w-24"
        initial={{ opacity: 1, scale: 1 }}
        animate={{ opacity: [1, 1, 0], scale: [1, 1, 0.78] }}
        transition={{ duration: 0.52, times: [0, 0.38, 1], ease: "easeInOut" }}
      >
        <div className="flex h-full w-full items-center justify-center gap-1 rounded-[1.35rem] bg-black/25 px-0.5 backdrop-blur-sm">
          <AciusfyLogoMark className="h-8 w-8 shrink-0 rounded-lg" alt="" imgClassName="p-0" />
          <span className="text-white/40">×</span>
          <DiscordMark className="h-7 w-7 shrink-0 text-white sm:h-8 sm:w-8" />
        </div>
      </motion.div>

      <motion.div
        className="pointer-events-none absolute inset-0 flex items-center justify-center"
        initial={{ opacity: 0.45, scale: 0.85 }}
        animate={{ opacity: [0.45, 0], scale: [0.85, 1.65] }}
        transition={{ duration: 0.7, delay: 0.12, ease: "easeOut" }}
      >
        <div className="h-28 w-28 rounded-full bg-gradient-to-br from-violet-400/45 via-[#5865F2]/40 to-emerald-400/35 blur-2xl sm:h-36 sm:w-36" />
      </motion.div>

      <motion.div
        className="absolute flex h-[4.5rem] w-[4.5rem] items-center justify-center sm:h-20 sm:w-20"
        initial={{ x: 0, opacity: 0, scale: 0.78 }}
        animate={{
          x: [0, -32, -148],
          opacity: [0, 1, 0],
          scale: [0.78, 1, 0.62],
        }}
        transition={{ duration: 1.08, times: [0, 0.2, 1], ease: [0.32, 0, 0.67, 1] }}
      >
        <AciusfyLogoMark
          className="h-full w-full rounded-2xl shadow-lg ring-2 ring-white/25"
          alt=""
          imgClassName="p-0.5"
        />
      </motion.div>

      <motion.div
        className="absolute flex h-[4.5rem] w-[4.5rem] items-center justify-center rounded-2xl bg-[#5865F2] text-white shadow-xl shadow-indigo-900/50 ring-2 ring-white/20 sm:h-20 sm:w-20"
        initial={{ x: 0, opacity: 0, scale: 0.78 }}
        animate={{
          x: [0, 32, 148],
          opacity: [0, 1, 0],
          scale: [0.78, 1, 0.62],
        }}
        transition={{ duration: 1.08, times: [0, 0.2, 1], ease: [0.32, 0, 0.67, 1] }}
      >
        <DiscordMark className="h-[55%] w-[55%]" />
      </motion.div>
    </>
  );
}

export function DiscordAccountLinkAnimation({ open, mode, onExitComplete }: Props) {
  const { t } = useTranslation();
  const reduce = useReducedMotion();
  const fast = mode === "redirect";
  const disconnect = mode === "disconnect";
  const pulseFast = fast || disconnect;

  return (
    <AnimatePresence onExitComplete={onExitComplete}>
      {open ? (
        <motion.div
          key="oauth-overlay"
          className="fixed inset-0 z-[200] flex flex-col items-center justify-center gap-8 bg-[#050508]/88 px-6 backdrop-blur-xl"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: reduce ? 0.15 : 0.35 }}
        >
          
          {!reduce ? (
            <>
              <motion.div
                className="pointer-events-none absolute left-1/2 top-1/2 h-[min(90vw,420px)] w-[min(90vw,420px)] -translate-x-1/2 -translate-y-1/2 rounded-full bg-violet-600/20 blur-[100px]"
                animate={{ scale: [1, 1.15, 1], opacity: [0.4, 0.7, 0.4] }}
                transition={{ duration: pulseFast ? 1.2 : 2.8, repeat: Infinity, ease: "easeInOut" }}
              />
              <motion.div
                className="pointer-events-none absolute left-1/2 top-1/2 h-[min(70vw,320px)] w-[min(70vw,320px)] -translate-x-1/2 -translate-y-1/2 rounded-full bg-[#5865F2]/15 blur-[80px]"
                animate={{ scale: [1.08, 1, 1.08], opacity: [0.35, 0.6, 0.35] }}
                transition={{
                  duration: pulseFast ? 1.35 : 3.2,
                  repeat: Infinity,
                  ease: "easeInOut",
                  delay: 0.2,
                }}
              />
            </>
          ) : null}

          <div className="relative flex h-36 w-full max-w-sm items-center justify-center sm:h-44 sm:max-w-md">
            {disconnect ? (
              <DisconnectSplitVisual reduce={!!reduce} />
            ) : (
              <>
            
            <motion.div
              className="absolute flex h-[4.5rem] w-[4.5rem] items-center justify-center sm:h-20 sm:w-20"
              initial={reduce ? { x: 0, opacity: 1, scale: 1 } : { x: -120, opacity: 0, scale: 0.6 }}
              animate={
                reduce
                  ? {}
                  : fast
                    ? {
                        x: [-120, -28, 0],
                        opacity: [0, 1, 1],
                        scale: [0.6, 1, 0.92],
                      }
                    : {
                        x: [-140, -36, -8, 0],
                        opacity: [0, 1, 1, 0],
                        scale: [0.5, 1, 1, 0.75],
                      }
              }
              transition={
                reduce
                  ? {}
                  : fast
                    ? { duration: 0.55, times: [0, 0.65, 1], ease: "easeOut" }
                    : { duration: 1.15, times: [0, 0.22, 0.48, 0.62], ease: "easeOut" }
              }
            >
              <AciusfyLogoMark
                className="h-full w-full rounded-2xl shadow-lg ring-2 ring-white/25"
                alt=""
                imgClassName="p-0.5"
              />
            </motion.div>

            
            <motion.div
              className="absolute flex h-[4.5rem] w-[4.5rem] items-center justify-center rounded-2xl bg-[#5865F2] text-white shadow-xl shadow-indigo-900/50 ring-2 ring-white/20 sm:h-20 sm:w-20"
              initial={reduce ? { x: 0, opacity: 1, scale: 1 } : { x: 120, opacity: 0, scale: 0.6 }}
              animate={
                reduce
                  ? {}
                  : fast
                    ? {
                        x: [120, 28, 0],
                        opacity: [0, 1, 1],
                        scale: [0.6, 1, 0.92],
                      }
                    : {
                        x: [140, 36, 8, 0],
                        opacity: [0, 1, 1, 0],
                        scale: [0.5, 1, 1, 0.75],
                      }
              }
              transition={
                reduce
                  ? {}
                  : fast
                    ? { duration: 0.55, times: [0, 0.65, 1], ease: "easeOut" }
                    : { duration: 1.15, times: [0, 0.22, 0.48, 0.62], ease: "easeOut" }
              }
            >
              <DiscordMark className="h-[55%] w-[55%]" />
            </motion.div>

            
            {!reduce ? (
              <motion.div
                className="pointer-events-none absolute inset-0 flex items-center justify-center"
                initial={{ opacity: 0, scale: 0.2 }}
                animate={
                  fast
                    ? { opacity: [0, 0, 1, 0.85], scale: [0.2, 0.2, 1.35, 1.05] }
                    : { opacity: [0, 0, 0, 1, 0.9, 0], scale: [0.2, 0.2, 0.2, 1.5, 1.2, 1.4] }
                }
                transition={
                  fast
                    ? { duration: 0.75, times: [0, 0.35, 0.55, 1], ease: "easeOut" }
                    : { duration: 2.2, times: [0, 0.35, 0.45, 0.58, 0.75, 1], ease: "easeOut" }
                }
              >
                <div className="h-28 w-28 rounded-full bg-gradient-to-br from-violet-400/50 via-[#5865F2]/45 to-emerald-400/40 blur-2xl sm:h-36 sm:w-36" />
              </motion.div>
            ) : null}

            
            {!fast && !reduce ? (
              <motion.div
                className="absolute flex h-[5.5rem] w-[5.5rem] items-center justify-center rounded-3xl bg-gradient-to-br from-violet-600 via-[#5865F2] to-indigo-700 p-1 shadow-[0_0_48px_rgba(88,101,242,0.45)] ring-2 ring-white/25 sm:h-24 sm:w-24"
                initial={{ opacity: 0, scale: 0.5 }}
                animate={{ opacity: [0, 0, 0, 1, 1, 1], scale: [0.5, 0.5, 0.5, 1.08, 1, 1] }}
                transition={{
                  duration: 2.2,
                  times: [0, 0.45, 0.52, 0.62, 0.78, 1],
                  ease: "easeOut",
                }}
              >
                <div className="flex h-full w-full items-center justify-center gap-1 rounded-[1.35rem] bg-black/25 backdrop-blur-sm px-0.5">
                  <AciusfyLogoMark className="h-8 w-8 shrink-0 rounded-lg" alt="" imgClassName="p-0" />
                  <span className="text-white/40">×</span>
                  <DiscordMark className="h-7 w-7 shrink-0 text-white sm:h-8 sm:w-8" />
                </div>
                <motion.div
                  className="absolute -bottom-1 -right-1 flex h-8 w-8 items-center justify-center rounded-full bg-emerald-500 text-white shadow-lg ring-2 ring-[#050508]"
                  initial={{ scale: 0, opacity: 0 }}
                  animate={{ scale: [0, 0, 1.2, 1], opacity: [0, 0, 1, 1] }}
                  transition={{ duration: 2.2, times: [0, 0.55, 0.68, 1], ease: "easeOut" }}
                >
                  <Check className="h-4 w-4" strokeWidth={3} />
                </motion.div>
              </motion.div>
            ) : null}
              </>
            )}
          </div>

          <motion.p
            className="max-w-xs text-center text-sm font-medium text-zinc-300 sm:text-base"
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: reduce ? 0 : 0.15, duration: 0.35 }}
          >
            {disconnect
              ? t("discordBotOAuthDisconnectMessage")
              : fast
                ? t("discordBotOAuthRedirectMessage")
                : t("discordBotOAuthLinkedMessage")}
          </motion.p>

          {!reduce && fast ? (
            <motion.div
              className="flex gap-1"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.2 }}
            >
              {[0, 1, 2].map((i) => (
                <motion.span
                  key={i}
                  className="h-1.5 w-1.5 rounded-full bg-violet-400"
                  animate={{ y: [0, -6, 0], opacity: [0.4, 1, 0.4] }}
                  transition={{ type: "tween", duration: 0.6, repeat: Infinity, delay: i * 0.12 }}
                />
              ))}
            </motion.div>
          ) : null}
        </motion.div>
      ) : null}
    </AnimatePresence>
  );
}
