"use client";

import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import { useEffect, useState } from "react";
import { useTranslation } from "@/hooks/useTranslation";
import { cn } from "@/lib/utils";

const ROTATE_MS = 3800;

/** Bass visualizer — ortadaki çubuklar daha yüksek, kenarlar kısa; yavaş nabız */
export const VISUALIZER_BARS = [
  { peak: 10, min: 4, dur: 2.4, delay: 0.0 },
  { peak: 14, min: 5, dur: 2.1, delay: 0.18 },
  { peak: 18, min: 6, dur: 1.9, delay: 0.35 },
  { peak: 20, min: 6, dur: 2.0, delay: 0.12 },
  { peak: 22, min: 7, dur: 2.2, delay: 0.28 },
  { peak: 20, min: 6, dur: 1.95, delay: 0.42 },
  { peak: 16, min: 5, dur: 2.15, delay: 0.22 },
  { peak: 12, min: 4, dur: 2.35, delay: 0.38 },
  { peak: 9, min: 3, dur: 2.5, delay: 0.08 },
] as const;

export function BassVisualizer({
  reduceMotion,
  className,
  barClassName,
}: {
  reduceMotion: boolean;
  className?: string;
  barClassName?: string;
}) {
  return (
    <div
      className={cn(
        "relative flex h-5 w-[2.65rem] shrink-0 items-end justify-center gap-[3px] sm:h-[1.35rem] sm:w-[2.85rem]",
        className,
      )}
      aria-hidden
    >
      {!reduceMotion ? (
        <span className="pointer-events-none absolute inset-x-0 bottom-0 h-3 rounded-full bg-blue-500/20 blur-md" />
      ) : null}
      {VISUALIZER_BARS.map((bar, i) => {
        const rMin = bar.min / bar.peak;
        const rMid = (bar.min + 1) / bar.peak;
        const rSoft = (bar.peak * 0.78) / bar.peak;
        return (
          <motion.span
            key={i}
            className={cn(
              "block w-[3px] shrink-0 origin-bottom rounded-full bg-gradient-to-t from-blue-700 via-blue-400 to-sky-200 shadow-[0_0_6px_rgba(59,130,246,0.45)]",
              barClassName,
            )}
            style={{ height: bar.peak }}
            initial={false}
            animate={
              reduceMotion
                ? { scaleY: 0.55, opacity: 0.85 }
                : {
                    scaleY: [rMin, 1, rMid, rSoft, rMin],
                    opacity: [0.6, 1, 0.75, 0.92, 0.6],
                  }
            }
            transition={
              reduceMotion
                ? undefined
                : {
                    duration: bar.dur,
                    repeat: Infinity,
                    ease: [0.45, 0, 0.55, 1],
                    delay: bar.delay,
                  }
            }
          />
        );
      })}
    </div>
  );
}

export function HeroAnimatedBadge({ className }: { className?: string }) {
  const { t } = useTranslation();
  const reduceMotion = useReducedMotion();
  const phrases = [
    t("landingHeroBadgeRotate1"),
    t("landingHeroBadgeRotate2"),
    t("landingHeroBadgeRotate3"),
  ];
  const [index, setIndex] = useState(0);

  useEffect(() => {
    if (reduceMotion) return;
    const id = setInterval(() => {
      setIndex((i) => (i + 1) % phrases.length);
    }, ROTATE_MS);
    return () => clearInterval(id);
  }, [reduceMotion, phrases.length]);

  return (
    <motion.div
      initial={{ opacity: 0, y: 14, scale: 0.97 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      transition={{ duration: 0.45 }}
      whileHover={reduceMotion ? undefined : { scale: 1.02 }}
      className={cn("relative inline-flex max-w-full cursor-default", className)}
    >
      <div className="relative flex min-h-9 max-w-full items-center gap-2.5 overflow-hidden rounded-full border border-blue-500/20 bg-[#0a0c14]/92 px-2.5 py-2 shadow-[0_4px_28px_rgba(37,99,235,0.14)] backdrop-blur-md sm:gap-3 sm:px-3.5">
        <BassVisualizer reduceMotion={!!reduceMotion} />

        <span className="flex shrink-0 items-center gap-1.5">
          <motion.span
            aria-hidden
            className="relative flex h-2 w-2 shrink-0"
            animate={reduceMotion ? undefined : { scale: [1, 1.15, 1], opacity: [0.85, 1, 0.85] }}
            transition={{ duration: 1.6, repeat: Infinity, ease: "easeInOut" }}
          >
            <span className="absolute inset-0 rounded-full bg-emerald-400/35 blur-[3px]" />
            <span className="relative m-auto h-1.5 w-1.5 rounded-full bg-emerald-400 shadow-[0_0_8px_rgba(52,211,153,0.75)]" />
          </motion.span>
          <span className="text-[10px] font-bold uppercase tracking-[0.14em] text-emerald-300/90 sm:text-[11px]">
            {t("landingHeroBadgeTag")}
          </span>
        </span>

        <span className="hidden h-4 w-px shrink-0 bg-white/10 sm:block" aria-hidden />

        <span className="relative min-w-0 flex-1 overflow-hidden sm:min-w-[11rem] sm:flex-none">
          <AnimatePresence mode="wait" initial={false}>
            <motion.span
              key={phrases[index]}
              initial={{ opacity: 0, y: 8, filter: "blur(4px)" }}
              animate={
                reduceMotion
                  ? { opacity: 1, y: 0, filter: "blur(0px)" }
                  : {
                      opacity: 1,
                      y: 0,
                      filter: "blur(0px)",
                      backgroundPosition: ["0% 0%", "100% 0%", "0% 0%"],
                    }
              }
              exit={{ opacity: 0, y: -8, filter: "blur(4px)" }}
              transition={{
                opacity: { duration: 0.35, ease: "easeOut" },
                y: { duration: 0.35, ease: "easeOut" },
                filter: { duration: 0.35, ease: "easeOut" },
                backgroundPosition: { duration: 5, repeat: Infinity, ease: "easeInOut" },
              }}
              className={cn(
                "block truncate text-xs font-medium sm:text-[13px]",
                reduceMotion ? "text-blue-200/90" : "bg-clip-text text-transparent",
              )}
              style={
                reduceMotion
                  ? undefined
                  : {
                      backgroundImage:
                        "linear-gradient(90deg, #bfdbfe 0%, #ffffff 42%, #93c5fd 58%, #dbeafe 100%)",
                      backgroundSize: "200% 100%",
                    }
              }
            >
              {phrases[index]}
            </motion.span>
          </AnimatePresence>
        </span>
      </div>
    </motion.div>
  );
}
