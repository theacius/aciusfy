"use client";

import { motion, useReducedMotion, type Variants } from "framer-motion";
import { useIsMobile } from "@/hooks/useIsMobile";
import { useTranslation } from "@/hooks/useTranslation";
import { cn } from "@/lib/utils";
import {
  HeroDeviceShowcase,
  type HeroDeviceShowcaseProps,
} from "@/components/landing/HeroDeviceShowcase";
import { HeroAnimatedBadge } from "@/components/landing/HeroAnimatedBadge";
import { AnimatedButton } from "@/components/landing/animated-button";
import type { HeroDeviceLayout } from "@/lib/hero-device-layout";
import { useGsapEntrance } from "@/hooks/useGsapReveal";
import { useLenis, scrollWithLenis } from "@/components/providers/LenisProvider";

const ease = [0.16, 1, 0.3, 1] as const;

const heroStagger: Variants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: { staggerChildren: 0.1, delayChildren: 0.06 },
  },
};

const heroItem: Variants = {
  hidden: { opacity: 0, y: 20 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.55, ease },
  },
};

export type HeroSectionProps = {
  heroLiveLayout?: HeroDeviceLayout;
  heroLiveUsePlaceholders?: boolean;
  heroLivePhonePath?: string;
  heroLiveLaptopPath?: string;
  heroOrbitPreview?: HeroDeviceShowcaseProps["orbitPreview"];
};

export function HeroSection({
  heroLiveLayout,
  heroLiveUsePlaceholders,
  heroLivePhonePath,
  heroLiveLaptopPath,
  heroOrbitPreview,
}: HeroSectionProps = {}) {
  const { t } = useTranslation();
  const isMobile = useIsMobile();
  const reduceMotion = useReducedMotion();
  const trustLabels = [
    t("landingHeroTrustFree"),
    t("landingHeroTrustUnlimited"),
    t("landingHeroTrustHQ"),
  ];
  const heroRef = useGsapEntrance<HTMLDivElement>(0.12);
  const lenis = useLenis();

  const scrollToFeatures = () => {
    const el = document.getElementById("features");
    if (el) scrollWithLenis(lenis, el);
  };

  return (
    <div id="top" ref={heroRef} className="relative min-h-[100dvh] overflow-hidden">
      <div
        className="pointer-events-none absolute inset-0 z-[1] opacity-[0.35]"
        aria-hidden
        style={{
          backgroundImage: `radial-gradient(ellipse 80% 50% at 50% -10%, rgba(167,139,250,0.12), transparent 55%),
            linear-gradient(rgba(255,255,255,0.03) 1px, transparent 1px),
            linear-gradient(90deg, rgba(255,255,255,0.025) 1px, transparent 1px)`,
          backgroundSize: "auto, 64px 64px, 64px 64px",
          maskImage: "linear-gradient(180deg, black 0%, black 65%, transparent 100%)",
        }}
      />

      {!isMobile ? (
        <div
          className={cn(
            "absolute inset-0 z-[2]",
            !heroOrbitPreview && "pointer-events-none",
          )}
        >
          <div className="absolute inset-0 h-full min-h-[100dvh] w-full">
            <HeroDeviceShowcase
              reduceMotion={!!reduceMotion}
              liveLayout={heroLiveLayout}
              liveUsePlaceholders={heroLiveUsePlaceholders}
              livePhonePath={heroLivePhonePath}
              liveLaptopPath={heroLiveLaptopPath}
              orbitPreview={heroOrbitPreview}
            />
          </div>
          <div
            className="pointer-events-none absolute inset-0 z-[3] flex min-h-[100dvh] items-center justify-center overflow-visible"
            aria-hidden
          >
            <motion.div
              className="h-[min(90vh,820px)] w-[min(140vw,1200px)] rounded-[48%] bg-gradient-to-tr from-violet-500/10 via-white/5 to-transparent blur-[100px]"
              animate={reduceMotion ? undefined : { scale: [1, 1.04, 1], opacity: [0.35, 0.55, 0.35] }}
              transition={{ duration: 8, repeat: Infinity, ease: "easeInOut" }}
            />
          </div>
        </div>
      ) : null}

      {!isMobile ? (
        <div
          className="pointer-events-none absolute inset-0 z-[5] bg-gradient-to-r from-[#09090b]/90 via-[#09090b]/50 via-[42%] to-transparent"
          aria-hidden
        />
      ) : null}

      <div className="relative z-10 mx-auto flex min-h-[100dvh] max-w-7xl flex-col justify-center px-4 pb-28 pt-28 sm:px-6 sm:pb-32 sm:pt-32 lg:pb-36 lg:pt-24">
        <motion.div
          data-landing-parallax
          className="relative mx-auto max-w-2xl text-center lg:mx-0 lg:max-w-xl lg:text-left"
          variants={reduceMotion ? undefined : heroStagger}
          initial={reduceMotion ? false : "hidden"}
          animate={reduceMotion ? undefined : "visible"}
        >
          <motion.div variants={reduceMotion ? undefined : heroItem}>
            <HeroAnimatedBadge className="mb-6" />
          </motion.div>

          <motion.h1
            variants={reduceMotion ? undefined : heroItem}
            className="font-display text-[clamp(2.75rem,7vw,5.5rem)] font-semibold leading-[0.92] tracking-[-0.04em] text-foreground"
          >
            <span className="sr-only">{t("landingHeroTitle")}</span>
            <span className="block">{t("landingHeroTitle")}</span>
          </motion.h1>

          <motion.p
            variants={reduceMotion ? undefined : heroItem}
            className="mt-5 max-w-lg text-base leading-relaxed text-muted sm:text-lg lg:max-w-md"
          >
            {t("landingHeroLead")}
          </motion.p>

          <motion.p
            variants={reduceMotion ? undefined : heroItem}
            className="mt-3 text-sm italic tracking-tight text-foreground/55 sm:text-base"
          >
            &ldquo;{t("landingHeroTagline")}&rdquo;
          </motion.p>

          <motion.div
            variants={reduceMotion ? undefined : heroItem}
            className="mt-9 flex flex-col items-center gap-3 sm:flex-row sm:justify-center lg:justify-start"
          >
            <AnimatedButton href="/register" size="lg" variant="primary">
              {t("landingHeroCtaStart")}
            </AnimatedButton>
            <AnimatedButton size="lg" variant="secondary" onClick={scrollToFeatures}>
              {t("landingHeroCtaMore")}
            </AnimatedButton>
          </motion.div>

          <motion.div
            variants={reduceMotion ? undefined : heroItem}
            className="mt-10 flex flex-wrap items-center justify-center gap-2 sm:gap-2.5 lg:justify-start"
          >
            {trustLabels.map((label) => (
              <span
                key={label}
                className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/[0.03] px-3 py-1.5 text-xs text-foreground/70 sm:text-sm"
              >
                <span className="h-1.5 w-1.5 rounded-full bg-foreground/60" aria-hidden />
                {label}
              </span>
            ))}
          </motion.div>
        </motion.div>
      </div>

      <motion.button
        type="button"
        onClick={scrollToFeatures}
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: isMobile ? 0.35 : 0.85, duration: 0.45 }}
        className="absolute bottom-8 left-1/2 z-30 -translate-x-1/2 cursor-pointer border-0 bg-transparent"
        aria-label={t("landingHeroScrollHint")}
      >
        <div className="flex flex-col items-center gap-2 text-[0.625rem] font-medium uppercase tracking-[0.18em] text-muted transition hover:text-foreground">
          <span>{t("landingHeroScrollHint")}</span>
          {!isMobile && !reduceMotion ? (
            <motion.svg
              className="h-5 w-5"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              animate={{ y: [0, 6, 0] }}
              transition={{ duration: 1.6, repeat: Infinity, ease: "easeInOut" }}
            >
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 14l-7 7m0 0l-7-7m7 7V3" />
            </motion.svg>
          ) : (
            <svg className="h-5 w-5 opacity-80" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 14l-7 7m0 0l-7-7m7 7V3" />
            </svg>
          )}
        </div>
      </motion.button>
    </div>
  );
}
