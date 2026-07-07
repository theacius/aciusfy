"use client";

import { motion, useReducedMotion } from "framer-motion";
import { useTranslation } from "@/hooks/useTranslation";
import { LandingSection } from "@/components/landing/section-shell";

const testimonialKeys = [
  { quote: "landingTestimonial0Quote" as const, name: "landingTestimonial0Name" as const, role: "landingTestimonial0Role" as const },
  { quote: "landingTestimonial1Quote" as const, name: "landingTestimonial1Name" as const, role: "landingTestimonial1Role" as const },
  { quote: "landingTestimonial2Quote" as const, name: "landingTestimonial2Name" as const, role: "landingTestimonial2Role" as const },
] as const;

const ease = [0.16, 1, 0.3, 1] as const;

export function TestimonialsSection() {
  const { t } = useTranslation();
  const reduceMotion = useReducedMotion();

  return (
    <LandingSection
      eyebrow={t("landingTestimonialsEyebrow")}
      title={t("landingTestimonialsTitle")}
      description={t("landingTestimonialsLead")}
    >
      <div className="grid gap-4 md:grid-cols-3 md:gap-5">
        {testimonialKeys.map((item, index) => (
          <motion.blockquote
            key={item.quote}
            initial={reduceMotion ? false : { opacity: 0, y: 20 }}
            whileInView={reduceMotion ? undefined : { opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "-8%" }}
            transition={{ duration: 0.5, delay: index * 0.08, ease }}
            className="landing-bento-card flex h-full flex-col justify-between p-6 sm:p-7"
          >
            <p className="text-sm leading-relaxed text-foreground/90 sm:text-base">
              &ldquo;{t(item.quote)}&rdquo;
            </p>
            <footer className="mt-6 border-t border-white/[0.06] pt-4">
              <p className="text-sm font-medium text-foreground">{t(item.name)}</p>
              <p className="mt-0.5 text-xs text-muted">{t(item.role)}</p>
            </footer>
          </motion.blockquote>
        ))}
      </div>
    </LandingSection>
  );
}
