"use client";

import { Check } from "lucide-react";
import { motion, useReducedMotion } from "framer-motion";
import { useTranslation } from "@/hooks/useTranslation";
import { LandingSection } from "@/components/landing/section-shell";
import { AnimatedButton } from "@/components/landing/animated-button";

const perkKeys = [
  "landingPricingPerk0",
  "landingPricingPerk1",
  "landingPricingPerk2",
  "landingPricingPerk3",
] as const;

const ease = [0.16, 1, 0.3, 1] as const;

export function PricingSection() {
  const { t } = useTranslation();
  const reduceMotion = useReducedMotion();

  return (
    <LandingSection
      id="pricing"
      eyebrow={t("landingPricingEyebrow")}
      title={t("landingPricingTitle")}
      description={t("landingPricingLead")}
    >
      <motion.div
        initial={reduceMotion ? false : { opacity: 0, y: 24 }}
        whileInView={reduceMotion ? undefined : { opacity: 1, y: 0 }}
        viewport={{ once: true }}
        transition={{ duration: 0.55, ease }}
        className="landing-bento-card mx-auto max-w-lg p-8 sm:p-10"
      >
        <div className="mb-8 flex items-end justify-between gap-4">
          <div>
            <p className="text-sm font-medium text-muted">{t("landingPricingPlanName")}</p>
            <p className="mt-2 font-display text-5xl font-semibold tracking-tight text-foreground">
              {t("landingPricingPrice")}
            </p>
          </div>
          <span className="rounded-full border border-white/10 bg-white/[0.04] px-3 py-1 text-xs font-medium text-foreground/80">
            {t("landingPricingBadge")}
          </span>
        </div>
        <ul className="mb-8 space-y-3">
          {perkKeys.map((key) => (
            <li key={key} className="flex items-start gap-3 text-sm text-muted sm:text-base">
              <Check className="mt-0.5 h-4 w-4 shrink-0 text-foreground/70" aria-hidden />
              {t(key)}
            </li>
          ))}
        </ul>
        <div className="w-full">
          <AnimatedButton href="/register" size="lg" className="w-full min-w-full">
            {t("landingPricingCta")}
          </AnimatedButton>
        </div>
      </motion.div>
    </LandingSection>
  );
}
