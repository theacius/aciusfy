"use client";

import Link from "next/link";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import { useEffect, useState } from "react";
import { AciusfyLogoMark } from "@/components/branding/AciusfyLogoMark";
import { cn } from "@/lib/utils";

const HOLD_MS = 5000;
const FLICKER_MS = 900;
const COLOR_MS = 650;

type ActiveLogo = "discord" | "aciusfy";

function DiscordGlyph({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="currentColor" aria-hidden>
      <path d="M20.317 4.37a19.791 19.791 0 0 0-4.885-1.515.074.074 0 0 0-.079.037c-.21.375-.444.864-.608 1.25a18.27 18.27 0 0 0-5.487 0 12.64 12.64 0 0 0-.617-1.25.077.077 0 0 0-.079-.037A19.736 19.736 0 0 0 3.677 4.37a.07.07 0 0 0-.032.027C.533 9.046-.32 13.58.099 18.057a.082.082 0 0 0 .031.057 19.9 19.9 0 0 0 5.993 3.03.078.078 0 0 0 .084-.028 14.09 14.09 0 0 0 1.226-1.994.076.076 0 0 0-.041-.106 13.107 13.107 0 0 1-1.872-.892.077.077 0 0 1-.008-.128 10.2 10.2 0 0 0 .372-.292.074.074 0 0 1 .077-.01c3.928 1.793 8.18 1.793 12.062 0a.074.074 0 0 1 .078.01c.12.098.246.198.373.292a.077.077 0 0 1-.006.127 12.299 12.299 0 0 1-1.873.892.077.077 0 0 0-.041.107c.36.698.772 1.362 1.225 1.993a.076.076 0 0 0 .084.028 19.839 19.839 0 0 0 6.002-3.03.077.077 0 0 0 .032-.054c.5-5.177-.838-9.674-3.549-13.66a.061.061 0 0 0-.031-.03zM8.02 15.33c-1.183 0-2.157-1.085-2.157-2.419 0-1.333.956-2.419 2.157-2.419 1.21 0 2.176 1.096 2.157 2.42 0 1.333-.956 2.418-2.157 2.418zm7.975 0c-1.183 0-2.157-1.085-2.157-2.419 0-1.333.955-2.419 2.157-2.419 1.21 0 2.176 1.096 2.157 2.42 0 1.333-.946 2.418-2.157 2.418z" />
    </svg>
  );
}

const theme = {
  discord: {
    bg: "rgba(88, 101, 242, 0.12)",
    ring: "rgba(114, 137, 218, 0.28)",
    halo: "rgba(88, 101, 242, 0.32)",
    glow: "0 0 8px rgba(88, 101, 242, 0.28), inset 0 0 6px rgba(88, 101, 242, 0.06)",
    logoGlow: "drop-shadow(0 0 2px rgba(114, 137, 218, 0.55))",
    haloPulse: [0.2, 0.28, 0.2] as number[],
  },
  aciusfy: {
    bg: "rgba(30, 64, 175, 0.16)",
    ring: "rgba(59, 130, 246, 0.38)",
    halo: "rgba(37, 99, 235, 0.42)",
    glow: "0 0 12px rgba(37, 99, 235, 0.38), 0 0 22px rgba(30, 64, 175, 0.14), inset 0 0 8px rgba(59, 130, 246, 0.1)",
    logoGlow:
      "drop-shadow(0 0 3px rgba(147, 197, 253, 0.85)) drop-shadow(0 0 8px rgba(37, 99, 235, 0.55))",
    haloPulse: [0.32, 0.48, 0.32] as number[],
  },
} as const;

const flickerTransition = {
  duration: FLICKER_MS / 1000,
  times: [0, 0.08, 0.16, 0.24, 0.32, 0.42, 0.52, 0.64, 0.76, 0.88, 1],
  ease: "linear" as const,
};

const flickerKeyframes = {
  opacity: [1, 0.15, 1, 0.05, 0.85, 0.1, 1, 0.25, 0.95, 0.2, 1],
  filter: [
    "brightness(1)",
    "brightness(2.2)",
    "brightness(0.35)",
    "brightness(1.9)",
    "brightness(0.2)",
    "brightness(1.6)",
    "brightness(0.45)",
    "brightness(1.4)",
    "brightness(0.55)",
    "brightness(1.2)",
    "brightness(1)",
  ],
};

type Props = {
  href: string;
  ariaLabel: string;
  className?: string;
};

export function LandingDiscordCompactNavButton({ href, ariaLabel, className }: Props) {
  const reduceMotion = useReducedMotion();
  const [active, setActive] = useState<ActiveLogo>("discord");
  const [flickering, setFlickering] = useState(false);

  useEffect(() => {
    if (reduceMotion) return;

    let cancelled = false;
    let holdTimer: ReturnType<typeof setTimeout> | undefined;
    let flickerTimer: ReturnType<typeof setTimeout> | undefined;

    const sleep = (ms: number) =>
      new Promise<void>((resolve) => {
        holdTimer = setTimeout(() => resolve(), ms);
      });

    const runFlicker = (next: ActiveLogo) =>
      new Promise<void>((resolve) => {
        setFlickering(true);
        const swapAt = Math.round(FLICKER_MS * 0.72);
        flickerTimer = setTimeout(() => {
          setActive(next);
          holdTimer = setTimeout(() => {
            setFlickering(false);
            resolve();
          }, Math.max(80, FLICKER_MS - swapAt));
        }, swapAt);
      });

    void (async () => {
      let current: ActiveLogo = "discord";
      setActive(current);

      while (!cancelled) {
        await sleep(HOLD_MS);
        if (cancelled) break;
        const next: ActiveLogo = current === "discord" ? "aciusfy" : "discord";
        await runFlicker(next);
        if (cancelled) break;
        current = next;
      }
    })();

    return () => {
      cancelled = true;
      if (holdTimer) clearTimeout(holdTimer);
      if (flickerTimer) clearTimeout(flickerTimer);
    };
  }, [reduceMotion]);

  const palette = theme[active];

  return (
    <Link
      href={href}
      aria-label={ariaLabel}
      title={ariaLabel}
      className={cn("relative flex h-9 w-9 shrink-0 items-center justify-center overflow-visible", className)}
    >
      <motion.span
        aria-hidden
        className="pointer-events-none absolute inset-0 rounded-full"
        animate={{
          backgroundColor: palette.bg,
          boxShadow: palette.glow,
          borderColor: palette.ring,
        }}
        style={{ borderWidth: 1, borderStyle: "solid" }}
        transition={{ duration: COLOR_MS / 1000, ease: "easeInOut" }}
      />

      <motion.span
        aria-hidden
        className="pointer-events-none absolute inset-[-3px] rounded-full blur-md"
        animate={{
          backgroundColor: palette.halo,
          opacity: flickering ? [0.35, 0.95, 0.2, 0.85, 0.15, 0.75, 0.25, 0.55] : palette.haloPulse,
          scale: flickering ? [1, 1.18, 0.94, 1.12, 1] : [1, 1.06, 1],
        }}
        transition={
          flickering
            ? { duration: FLICKER_MS / 1000, ease: "linear" }
            : { duration: 2.8, repeat: Infinity, ease: "easeInOut" }
        }
      />

      <motion.span
        className="relative flex h-[1.375rem] w-[1.375rem] items-center justify-center"
        animate={flickering ? flickerKeyframes : { opacity: 1, filter: "brightness(1)" }}
        transition={flickering ? flickerTransition : { duration: 0.2 }}
      >
        <AnimatePresence mode="wait" initial={false}>
          {active === "discord" ? (
            <motion.span
              key="discord"
              className="flex items-center justify-center"
              initial={{ opacity: 0, scale: 0.72, filter: "brightness(2.4)" }}
              animate={{
                opacity: 1,
                scale: 1,
                filter: flickering ? undefined : palette.logoGlow,
              }}
              exit={{ opacity: 0, scale: 0.78, filter: "brightness(0.2)" }}
              transition={{ duration: 0.38, ease: "easeOut" }}
            >
              <DiscordGlyph className="h-[1.125rem] w-[1.125rem] shrink-0 text-[#7289da]" />
            </motion.span>
          ) : (
            <motion.span
              key="aciusfy"
              className="flex h-[1.375rem] w-[1.375rem] items-center justify-center"
              initial={{ opacity: 0, scale: 0.72, filter: "brightness(2.4)" }}
              animate={{
                opacity: 1,
                scale: 1,
                filter: flickering ? undefined : palette.logoGlow,
              }}
              exit={{ opacity: 0, scale: 0.78, filter: "brightness(0.2)" }}
              transition={{ duration: 0.38, ease: "easeOut" }}
            >
              <AciusfyLogoMark
                className="size-[1.375rem] rounded-md bg-transparent shadow-none"
                alt=""
                presentation="bare"
                imgClassName="!relative !inset-auto !h-[1.375rem] !w-[1.375rem] !min-h-[1.375rem] !min-w-[1.375rem] !max-h-none !max-w-none !p-0 object-contain [transform:scale(1.18)]"
              />
            </motion.span>
          )}
        </AnimatePresence>
      </motion.span>
    </Link>
  );
}
