"use client";

import { motion, useReducedMotion } from "framer-motion";
import type { LucideIcon } from "lucide-react";
import { useTranslation } from "@/hooks/useTranslation";
import { LandingSection } from "@/components/landing/section-shell";
import { cn } from "@/lib/utils";

const ease = [0.16, 1, 0.3, 1] as const;

type FeatureKey = {
  icon: LucideIcon;
  titleKey:
    | "landingFeat0Title"
    | "landingFeat1Title"
    | "landingFeat2Title"
    | "landingFeat3Title"
    | "landingFeat4Title"
    | "landingFeat5Title";
  descKey:
    | "landingFeat0Desc"
    | "landingFeat1Desc"
    | "landingFeat2Desc"
    | "landingFeat3Desc"
    | "landingFeat4Desc"
    | "landingFeat5Desc";
  span?: string;
};

type BentoGridProps = {
  features: FeatureKey[];
};

export function BentoGrid({ features }: BentoGridProps) {
  const { t } = useTranslation();
  const reduceMotion = useReducedMotion();

  return (
    <LandingSection
      id="features"
      eyebrow={t("landingNavFeatures")}
      title={t("landingFeaturesHeading")}
      description={t("landingFeaturesSubtext")}
    >
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 sm:gap-5 lg:grid-cols-3 lg:gap-5">
        {features.map((feature, index) => {
          const Icon = feature.icon;
          return (
            <motion.article
              key={feature.titleKey}
              initial={reduceMotion ? false : { opacity: 0, y: 24 }}
              whileInView={reduceMotion ? undefined : { opacity: 1, y: 0 }}
              viewport={{ once: true, margin: "-8%" }}
              transition={{ duration: 0.55, delay: index * 0.06, ease }}
              className={cn(
                "landing-bento-card group flex flex-col p-6 sm:p-7",
                feature.span,
              )}
            >
              <div className="mb-5 inline-flex h-11 w-11 items-center justify-center rounded-xl border border-white/10 bg-white/[0.04] text-foreground transition-colors group-hover:border-white/16 group-hover:bg-white/[0.06]">
                <Icon className="h-5 w-5" aria-hidden />
              </div>
              <h3 className="mb-2 font-display text-lg font-medium tracking-tight text-foreground sm:text-xl">
                {t(feature.titleKey)}
              </h3>
              <p className="text-sm leading-relaxed text-muted sm:text-base">{t(feature.descKey)}</p>
            </motion.article>
          );
        })}
      </div>
    </LandingSection>
  );
}
