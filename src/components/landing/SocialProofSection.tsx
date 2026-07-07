"use client";

import { motion, useReducedMotion } from "framer-motion";
import { useTranslation } from "@/hooks/useTranslation";

const avatars = ["A", "E", "M", "T", "S"];
const ease = [0.16, 1, 0.3, 1] as const;

export function SocialProofSection() {
  const { t } = useTranslation();
  const reduceMotion = useReducedMotion();

  const stats = [
    { val: t("landingStatSongs"), label: t("landingStatSongsLabel") },
    { val: t("landingStatArtists"), label: t("landingStatArtistsLabel") },
    { val: t("landingStatPlaylists"), label: t("landingStatPlaylistsLabel") },
  ];

  return (
    <section className="landing-section">
      <div className="landing-section-inner">
        <motion.div
          initial={reduceMotion ? false : { opacity: 0, y: 20 }}
          whileInView={reduceMotion ? undefined : { opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5, ease }}
          className="mx-auto flex max-w-3xl flex-col items-center gap-8 text-center"
        >
          <div className="flex -space-x-2.5">
            {avatars.map((letter) => (
              <div
                key={letter}
                className="flex h-10 w-10 items-center justify-center rounded-full border-2 border-[#09090b] bg-white/[0.08] text-xs font-semibold text-foreground"
              >
                {letter}
              </div>
            ))}
            <div className="flex h-10 w-10 items-center justify-center rounded-full border-2 border-[#09090b] bg-foreground text-xs font-semibold text-background">
              +9K
            </div>
          </div>
          <div>
            <p className="text-lg font-medium tracking-tight text-foreground sm:text-xl">
              {t("landingSocialHeadline")}
            </p>
            <p className="mt-1 text-sm text-muted sm:text-base">{t("landingSocialSub")}</p>
          </div>
        </motion.div>

        <div className="mt-16 grid grid-cols-3 gap-6 border-t border-white/[0.06] pt-12 sm:gap-10">
          {stats.map((stat, index) => (
            <motion.div
              key={stat.label}
              initial={reduceMotion ? false : { opacity: 0, y: 12 }}
              whileInView={reduceMotion ? undefined : { opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.45, delay: index * 0.06, ease }}
              className="text-center"
            >
              <p className="font-display text-2xl font-semibold tracking-tight text-foreground sm:text-4xl">
                {stat.val}
              </p>
              <p className="mt-1 text-xs text-muted sm:text-sm">{stat.label}</p>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
