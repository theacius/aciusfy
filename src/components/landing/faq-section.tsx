"use client";

import { useState } from "react";
import { motion, AnimatePresence, useReducedMotion } from "framer-motion";
import { ChevronDown } from "lucide-react";
import { useTranslation } from "@/hooks/useTranslation";
import { LandingSection } from "@/components/landing/section-shell";
import { cn } from "@/lib/utils";

const faqKeys = [
  { q: "landingFaq0Q" as const, a: "landingFaq0A" as const },
  { q: "landingFaq1Q" as const, a: "landingFaq1A" as const },
  { q: "landingFaq2Q" as const, a: "landingFaq2A" as const },
  { q: "landingFaq3Q" as const, a: "landingFaq3A" as const },
] as const;

export function FaqSection() {
  const { t } = useTranslation();
  const [openIndex, setOpenIndex] = useState<number | null>(0);
  const reduceMotion = useReducedMotion();

  return (
    <LandingSection
      id="faq"
      eyebrow={t("landingFaqEyebrow")}
      title={t("landingFaqTitle")}
      description={t("landingFaqLead")}
    >
      <div className="mx-auto max-w-2xl divide-y divide-white/[0.06] rounded-2xl border border-white/[0.08] bg-white/[0.02]">
        {faqKeys.map((item, index) => {
          const open = openIndex === index;
          return (
            <div key={item.q}>
              <button
                type="button"
                className="flex w-full items-center justify-between gap-4 px-5 py-5 text-left transition-colors hover:bg-white/[0.03] sm:px-6"
                aria-expanded={open}
                onClick={() => setOpenIndex(open ? null : index)}
              >
                <span className="text-sm font-medium tracking-tight text-foreground sm:text-base">
                  {t(item.q)}
                </span>
                <ChevronDown
                  className={cn(
                    "h-4 w-4 shrink-0 text-muted transition-transform duration-300",
                    open && "rotate-180",
                  )}
                  aria-hidden
                />
              </button>
              <AnimatePresence initial={false}>
                {open ? (
                  <motion.div
                    initial={reduceMotion ? false : { height: 0, opacity: 0 }}
                    animate={{ height: "auto", opacity: 1 }}
                    exit={reduceMotion ? undefined : { height: 0, opacity: 0 }}
                    transition={{ duration: 0.3, ease: [0.16, 1, 0.3, 1] }}
                    className="overflow-hidden"
                  >
                    <p className="px-5 pb-5 text-sm leading-relaxed text-muted sm:px-6 sm:text-base">
                      {t(item.a)}
                    </p>
                  </motion.div>
                ) : null}
              </AnimatePresence>
            </div>
          );
        })}
      </div>
    </LandingSection>
  );
}
