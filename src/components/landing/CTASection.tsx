"use client";

import { motion, useReducedMotion } from "framer-motion";
import { useTranslation } from "@/hooks/useTranslation";
import { AnimatedButton } from "@/components/landing/animated-button";

const ease = [0.16, 1, 0.3, 1] as const;

export function CTASection() {
  const { t } = useTranslation();
  const reduceMotion = useReducedMotion();

  return (
    <section className="landing-section">
      <div className="landing-section-inner">
        <motion.div
          initial={reduceMotion ? false : { opacity: 0, y: 24 }}
          whileInView={reduceMotion ? undefined : { opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.55, ease }}
          className="relative overflow-hidden rounded-[1.75rem] border border-white/[0.08] bg-white/[0.03] px-6 py-16 text-center sm:px-10 sm:py-20"
        >
          <div
            className="pointer-events-none absolute inset-0 opacity-60"
            aria-hidden
            style={{
              background:
                "radial-gradient(ellipse 70% 60% at 50% 0%, rgba(167,139,250,0.14), transparent 60%)",
            }}
          />
          <div className="relative">
            <h2 className="font-display text-[clamp(2rem,5vw,3.75rem)] font-semibold leading-[0.95] tracking-[-0.03em] text-foreground">
              {t("landingCtaTitleBefore")}{" "}
              <span className="text-foreground/55">{t("landingCtaTitleAccent")}</span>
            </h2>
            <p className="mx-auto mt-5 max-w-lg text-base text-muted sm:text-lg">{t("landingCtaLead")}</p>
            <div className="mt-8 flex justify-center">
              <AnimatedButton href="/register" size="lg">
                {t("landingCtaButton")}
              </AnimatedButton>
            </div>
          </div>
        </motion.div>
      </div>
    </section>
  );
}
