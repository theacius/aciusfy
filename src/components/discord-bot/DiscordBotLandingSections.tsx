"use client";

import { motion, useReducedMotion, type Variants } from "framer-motion";
import {
  ChevronDown,
  Headphones,
  ListMusic,
  Mic2,
  Music2,
  Server,
  Shield,
  Sparkles,
} from "lucide-react";
import Link from "next/link";
import { useTranslation } from "@/hooks/useTranslation";

const cardGradients = [
  "from-fuchsia-600/90 via-violet-600/80 to-indigo-900/90",
  "from-sky-500/85 via-cyan-600/75 to-blue-900/90",
  "from-amber-500/80 via-orange-600/70 to-rose-900/85",
];

const heroTitleLine: Variants = {
  hidden: { scaleX: 0, opacity: 0 },
  visible: {
    scaleX: 1,
    opacity: 1,
    transition: { delay: 0.35, duration: 0.65, ease: [0.22, 1, 0.36, 1] },
  },
};

const springTap = { type: "spring" as const, stiffness: 400, damping: 22 };

export function DiscordBotHeroBlock({
  onScrollToPanel,
  showLogout,
  onLogout,
  inviteHref,
  showSiteAdminLink = false,
}: {
  onScrollToPanel: () => void;
  showLogout: boolean;
  onLogout: () => void;
  inviteHref: string;
  showSiteAdminLink?: boolean;
}) {
  const { t } = useTranslation();
  const reduceMotion = useReducedMotion();

  return (
    <section className="relative overflow-hidden pb-16 pt-8 sm:pb-24 sm:pt-12 lg:pb-28">
      <div
        className="pointer-events-none absolute inset-0 opacity-[0.4]"
        aria-hidden
        style={{
          backgroundImage: `linear-gradient(rgba(255,255,255,0.04) 1px, transparent 1px),
            linear-gradient(90deg, rgba(255,255,255,0.04) 1px, transparent 1px)`,
          backgroundSize: "56px 56px",
          maskImage: "linear-gradient(180deg, black 0%, black 55%, transparent 100%)",
        }}
      />
      <div className="relative mx-auto grid max-w-6xl items-center gap-12 px-4 sm:px-6 lg:grid-cols-2 lg:gap-16">
        <div className="relative z-10 max-w-xl">
          <motion.div
            initial={{ opacity: 0, y: 16, scale: 0.96 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            transition={{ duration: 0.5 }}
            whileHover={reduceMotion ? undefined : { scale: 1.03 }}
            className="mb-5 inline-flex cursor-default items-center gap-2 rounded-full border border-white/10 bg-white/5 px-3 py-1 text-xs font-medium text-violet-200/90 shadow-lg shadow-violet-900/20 backdrop-blur-sm"
          >
            <motion.span
              animate={reduceMotion ? undefined : { rotate: [0, 12, -8, 0] }}
              transition={{ type: "tween", duration: 4, repeat: Infinity, ease: "easeInOut" }}
            >
              <Sparkles className="h-3.5 w-3.5 text-amber-300/90" aria-hidden />
            </motion.span>
            {t("discordBotHeroBadge")}
          </motion.div>
          <motion.h1
            className={`text-3xl font-semibold leading-tight tracking-tight sm:text-4xl lg:text-[2.75rem] lg:leading-[1.1] ${reduceMotion ? "text-white" : ""}`}
            style={
              reduceMotion
                ? undefined
                : {
                    backgroundImage:
                      "linear-gradient(100deg, #fafafa 0%, #ddd6fe 30%, #7dd3fc 52%, #e9d5ff 72%, #fafafa 100%)",
                    backgroundSize: "200% 100%",
                    WebkitBackgroundClip: "text",
                    backgroundClip: "text",
                    color: "transparent",
                  }
            }
            initial={{ opacity: 0, y: 20 }}
            animate={
              reduceMotion
                ? { opacity: 1, y: 0 }
                : { opacity: 1, y: 0, backgroundPosition: ["0% 0%", "100% 0%", "0% 0%"] }
            }
            transition={
              reduceMotion
                ? { duration: 0.55, delay: 0.05 }
                : {
                    opacity: { duration: 0.55, delay: 0.05 },
                    y: { duration: 0.55, delay: 0.05 },
                    backgroundPosition: {
                      duration: 9,
                      repeat: Infinity,
                      ease: "easeInOut",
                      delay: 0.55,
                    },
                  }
            }
          >
            {t("discordBotHeroTitle")}
          </motion.h1>
          <motion.div
            className="mt-3 h-1 w-24 origin-left rounded-full bg-gradient-to-r from-violet-500 via-fuchsia-500 to-sky-400 sm:w-32"
            variants={heroTitleLine}
            initial="hidden"
            animate="visible"
          />
          <motion.p
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.12 }}
            className="mt-5 text-base leading-relaxed text-zinc-400 sm:text-lg"
          >
            {t("discordBotHeroLead")}
          </motion.p>
          <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.45, delay: 0.2 }}
            className="mt-8 flex flex-wrap items-center gap-3"
          >
            <motion.a
              href={inviteHref}
              target="_blank"
              rel="noopener noreferrer"
              aria-label={t("discordBotAddToServerAria")}
              whileHover={reduceMotion ? undefined : { scale: 1.04, boxShadow: "0 14px 44px rgba(88,101,242,0.45)" }}
              whileTap={reduceMotion ? undefined : { scale: 0.97 }}
              transition={springTap}
              className="inline-flex items-center gap-2 rounded-full bg-[#5865F2] px-5 py-2.5 text-sm font-semibold text-white shadow-lg shadow-indigo-900/40"
            >
              <Server className="h-4 w-4 shrink-0 opacity-95" aria-hidden />
              {t("discordBotAddToServer")}
            </motion.a>
            <motion.button
              type="button"
              onClick={onScrollToPanel}
              whileHover={reduceMotion ? undefined : { scale: 1.04, boxShadow: "0 12px 40px rgba(124,58,237,0.35)" }}
              whileTap={reduceMotion ? undefined : { scale: 0.97 }}
              transition={springTap}
              className="inline-flex items-center gap-2 rounded-full bg-gradient-to-r from-violet-600 to-indigo-600 px-5 py-2.5 text-sm font-medium text-white shadow-lg shadow-violet-900/35"
            >
              {t("discordBotScrollToPanel")}
              <motion.span
                animate={reduceMotion ? undefined : { y: [0, 4, 0] }}
                transition={{ type: "tween", duration: 1.4, repeat: Infinity, ease: "easeInOut" }}
              >
                <ChevronDown className="h-4 w-4 opacity-90" aria-hidden />
              </motion.span>
            </motion.button>
            {showLogout ? (
              <motion.button
                type="button"
                onClick={onLogout}
                whileHover={reduceMotion ? undefined : { scale: 1.03, borderColor: "rgba(248,113,113,0.45)" }}
                whileTap={reduceMotion ? undefined : { scale: 0.98 }}
                transition={springTap}
                className="rounded-full border border-white/15 px-4 py-2.5 text-sm text-zinc-300 hover:bg-red-500/10 hover:text-red-200"
              >
                {t("discordBotLogout")}
              </motion.button>
            ) : null}
            {showSiteAdminLink ? (
              <motion.div whileHover={reduceMotion ? undefined : { scale: 1.04 }} whileTap={reduceMotion ? undefined : { scale: 0.97 }} transition={springTap}>
                <Link
                  href="/discord-bot/admin"
                  className="inline-flex items-center gap-2 rounded-full border border-amber-500/35 bg-amber-500/15 px-4 py-2.5 text-sm font-semibold text-amber-100 shadow-lg shadow-amber-950/30 transition hover:border-amber-400/50 hover:bg-amber-500/25"
                >
                  <Shield className="h-4 w-4 shrink-0" aria-hidden />
                  {t("discordBotNavAdminPanel")}
                </Link>
              </motion.div>
            ) : null}
          </motion.div>
        </div>

        <HeroFloatingCards reduceMotion={!!reduceMotion} />
      </div>
    </section>
  );
}

const heroCardPositions = [
  "left-[4%] top-[5%] z-[3] w-[min(168px,46vw)] sm:left-[3%] sm:top-[7%] sm:w-[min(190px,44vw)] lg:left-[2%] lg:top-[8%] lg:w-[min(200px,42vw)]",
  "right-[4%] top-[34%] z-[2] w-[min(172px,48vw)] sm:right-[3%] sm:top-[28%] sm:w-[min(198px,46vw)] lg:right-[4%] lg:top-[22%] lg:w-[min(210px,44vw)]",
  "bottom-[12%] left-[8%] z-[1] w-[min(162px,44vw)] sm:bottom-[9%] sm:left-[14%] sm:w-[min(178px,42vw)] lg:bottom-[6%] lg:left-[18%] lg:w-[min(190px,40vw)]",
];

function HeroFloatingCards({ reduceMotion }: { reduceMotion: boolean }) {
  const { t } = useTranslation();
  return (
    <div className="relative mx-auto flex h-[min(460px,88vw)] w-full max-w-md items-center justify-center sm:h-[min(430px,78vw)] lg:mx-0 lg:h-[min(420px,70vw)] lg:max-w-none lg:justify-end">
      <div className="pointer-events-none absolute inset-0 flex items-center justify-center">
        <motion.div
          className="h-[min(340px,55vw)] w-[min(340px,55vw)] rounded-full bg-gradient-to-tr from-violet-600/30 via-fuchsia-500/15 to-transparent blur-3xl"
          animate={
            reduceMotion
              ? undefined
              : { scale: [1, 1.08, 1], opacity: [0.5, 0.75, 0.5] }
          }
          transition={{ duration: 8, repeat: Infinity, ease: "easeInOut" }}
        />
      </div>

      {[0, 1, 2].map((i) => (
        <motion.div
          key={i}
          className={`absolute overflow-hidden rounded-2xl border border-white/15 bg-gradient-to-br shadow-2xl ${heroCardPositions[i]} ${cardGradients[i]}`}
          initial={{ opacity: 0, y: 40, scale: 0.92 }}
          animate={
            reduceMotion
              ? { opacity: 1, y: 0, scale: 1, rotate: i === 0 ? -6 : i === 1 ? 4 : -3 }
              : {
                  opacity: 1,
                  y: [0, -10 - i * 4, 0],
                  x: i === 0 ? [-4, 4, -4] : i === 1 ? [6, -4, 6] : [-2, 2, -2],
                  rotate: i === 0 ? [-6, -4, -6] : i === 1 ? [4, 6, 4] : [-3, -5, -3],
                  scale: 1,
                }
          }
          transition={{
            opacity: { duration: 0.6, delay: 0.15 + i * 0.1 },
            y: reduceMotion
              ? { duration: 0.6 }
              : { type: "tween", duration: 5 + i, repeat: Infinity, ease: "easeInOut" },
            x: reduceMotion
              ? undefined
              : { type: "tween", duration: 6 + i * 0.5, repeat: Infinity, ease: "easeInOut" },
            rotate: reduceMotion
              ? { duration: 0.6 }
              : { type: "tween", duration: 7, repeat: Infinity, ease: "easeInOut" },
            scale: { duration: 0.6, delay: 0.15 + i * 0.1 },
          }}
        >
          {!reduceMotion ? (
            <motion.div
              className="pointer-events-none absolute inset-0 z-10 opacity-40"
              style={{
                background:
                  "linear-gradient(105deg, transparent 40%, rgba(255,255,255,0.35) 50%, transparent 60%)",
                backgroundSize: "200% 100%",
              }}
              animate={{ backgroundPosition: ["100% 0%", "-100% 0%"] }}
              transition={{
                duration: 3.5,
                repeat: Infinity,
                ease: "linear",
                delay: i * 0.9,
              }}
            />
          ) : null}
          <MockAlbumFace index={i} reduceMotion={reduceMotion} />
        </motion.div>
      ))}

      <motion.div
        className="absolute bottom-3 right-3 z-20 flex items-center gap-2 rounded-full border border-emerald-500/25 bg-emerald-950/50 px-3 py-1.5 text-[10px] font-semibold uppercase tracking-[0.15em] text-emerald-200/95 backdrop-blur-md sm:bottom-2 sm:right-4 sm:text-[11px]"
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ delay: 0.8, duration: 0.45, type: "spring", stiffness: 260 }}
        whileHover={reduceMotion ? undefined : { scale: 1.05, borderColor: "rgba(52,211,153,0.45)" }}
      >
        <span className="relative flex h-2 w-2">
          {!reduceMotion ? (
            <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-50" />
          ) : null}
          <span className="relative inline-flex h-2 w-2 rounded-full bg-emerald-400 shadow-[0_0_8px_rgba(52,211,153,0.8)]" />
        </span>
        {t("discordBotHeroLiveLabel")}
      </motion.div>
    </div>
  );
}

function MockAlbumFace({ index, reduceMotion }: { index: number; reduceMotion: boolean }) {
  const bars = [12, 20, 16, 24, 14, 22, 18];
  return (
    <div className="relative aspect-square p-4 sm:p-5">
      <div className="flex h-full flex-col justify-between">
        <div className="flex items-start justify-between">
          <div className="rounded-lg bg-black/25 p-2 backdrop-blur-sm">
            <Music2 className="h-6 w-6 text-white/90 sm:h-7 sm:w-7" aria-hidden />
          </div>
          <motion.span
            animate={reduceMotion ? undefined : { rotate: [0, 8, -6, 0] }}
            transition={{
              type: "tween",
              duration: 5,
              repeat: Infinity,
              ease: "easeInOut",
              delay: index * 0.4,
            }}
          >
            <Headphones className="h-5 w-5 text-white/50" aria-hidden />
          </motion.span>
        </div>
        <div className="space-y-1">
          <div className="h-2 w-3/4 rounded bg-white/30" />
          <div className="h-2 w-1/2 rounded bg-white/20" />
        </div>
        <div className="flex h-10 items-end justify-center gap-1 sm:h-12">
          {bars.map((h, j) => (
            <motion.span
              key={j}
              className="origin-bottom w-1.5 rounded-full bg-white/70"
              style={{ height: h }}
              animate={
                reduceMotion
                  ? undefined
                  : {
                      scaleY: [0.45, 1, 0.55, 0.9, 0.45],
                    }
              }
              transition={{
                type: "tween",
                duration: 0.9 + (j % 3) * 0.15,
                repeat: Infinity,
                ease: "easeInOut",
                delay: j * 0.08 + index * 0.12,
              }}
            />
          ))}
        </div>
      </div>
    </div>
  );
}

export function DiscordBotFeaturesBlock() {
  const { t } = useTranslation();
  const reduceMotion = useReducedMotion();
  const items = [
    {
      icon: Music2,
      titleKey: "discordBotFeatureMusicTitle" as const,
      descKey: "discordBotFeatureMusicDesc" as const,
    },
    {
      icon: Server,
      titleKey: "discordBotFeatureServerTitle" as const,
      descKey: "discordBotFeatureServerDesc" as const,
    },
    {
      icon: Mic2,
      titleKey: "discordBotFeatureVoiceTitle" as const,
      descKey: "discordBotFeatureVoiceDesc" as const,
    },
    {
      icon: ListMusic,
      titleKey: "discordBotFeatureControlTitle" as const,
      descKey: "discordBotFeatureControlDesc" as const,
    },
  ];

  return (
    <section className="relative border-y border-white/[0.07] bg-gradient-to-b from-white/[0.035] via-transparent to-transparent py-20 sm:py-24">
      <div
        className="pointer-events-none absolute inset-0 opacity-30"
        aria-hidden
        style={{
          backgroundImage: "radial-gradient(ellipse 80% 50% at 50% 0%, rgba(124,58,237,0.12), transparent)",
        }}
      />
      <div className="relative mx-auto max-w-6xl px-4 sm:px-6">
        <div className="mx-auto max-w-2xl text-center">
          <motion.p
            initial={{ opacity: 0, y: 8 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "-60px" }}
            className="text-xs font-semibold uppercase tracking-[0.22em] text-violet-400/90"
          >
            {t("discordBotFeaturesTitle")}
          </motion.p>
          <motion.h2
            initial={{ opacity: 0, y: 12 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "-60px" }}
            transition={{ delay: 0.05, duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
            className="mt-3 text-2xl font-semibold tracking-tight text-white sm:text-3xl"
          >
            {t("discordBotFeaturesSubtitle")}
          </motion.h2>
        </div>
        <div className="mt-12 grid gap-4 sm:grid-cols-2 lg:grid-cols-4 lg:gap-5">
          {items.map((item, i) => (
            <motion.article
              key={item.titleKey}
              initial={{ opacity: 0, y: 28 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: "-40px" }}
              transition={{ delay: i * 0.08, duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
              whileHover={
                reduceMotion
                  ? undefined
                  : {
                      y: -8,
                      scale: 1.02,
                      boxShadow: "0 20px 50px rgba(0,0,0,0.45), 0 0 0 1px rgba(167,139,250,0.25)",
                    }
              }
              whileTap={reduceMotion ? undefined : { scale: 0.99 }}
              className="group relative overflow-hidden rounded-2xl border border-white/[0.09] bg-zinc-950/55 p-5 shadow-lg shadow-black/30 ring-1 ring-white/[0.04] backdrop-blur-md"
            >
              {!reduceMotion ? (
                <motion.div
                  className="pointer-events-none absolute -inset-px rounded-2xl opacity-0 transition-opacity duration-300 group-hover:opacity-100"
                  style={{
                    background:
                      "linear-gradient(135deg, rgba(167,139,250,0.35), transparent 40%, rgba(56,189,248,0.2))",
                  }}
                />
              ) : null}
              <div className="relative">
                <motion.div
                  className="mb-4 flex h-11 w-11 items-center justify-center rounded-xl bg-gradient-to-br from-violet-600/40 to-sky-600/30 text-white ring-1 ring-white/10"
                  whileHover={
                    reduceMotion
                      ? undefined
                      : {
                          rotate: [0, -6, 6, 0],
                          scale: 1.08,
                          transition: { type: "tween", duration: 0.45, ease: "easeInOut" },
                        }
                  }
                >
                  <item.icon className="h-5 w-5" strokeWidth={1.75} aria-hidden />
                </motion.div>
                <h3 className="font-semibold text-white">{t(item.titleKey)}</h3>
                <p className="mt-2 text-sm leading-relaxed text-zinc-400">{t(item.descKey)}</p>
              </div>
            </motion.article>
          ))}
        </div>
      </div>
    </section>
  );
}

export function DiscordBotHowBlock() {
  const { t } = useTranslation();
  const reduceMotion = useReducedMotion();
  const steps = [
    { n: "1", textKey: "discordBotHowStep1" as const, icon: Shield },
    { n: "2", textKey: "discordBotHowStep2" as const, icon: Server },
    { n: "3", textKey: "discordBotHowStep3" as const, icon: Headphones },
  ];

  return (
    <section className="relative py-20 sm:py-[5.5rem]">
      <div className="pointer-events-none absolute inset-x-6 top-0 h-px max-w-6xl bg-gradient-to-r from-transparent via-violet-500/35 to-transparent sm:inset-x-auto sm:left-1/2 sm:w-full sm:max-w-4xl sm:-translate-x-1/2" />
      <div className="mx-auto max-w-6xl px-4 sm:px-6">
        <div className="mx-auto max-w-2xl text-center">
          <motion.p
            initial={{ opacity: 0, y: 8 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "-50px" }}
            className="text-xs font-semibold uppercase tracking-[0.28em] text-fuchsia-400/85"
          >
            {t("discordBotHowTitle")}
          </motion.p>
          <motion.h2
            initial={{ opacity: 0, y: 14 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "-50px" }}
            transition={{ delay: 0.06, duration: 0.55, ease: [0.22, 1, 0.36, 1] }}
            className="mt-3 text-3xl font-semibold tracking-tight text-white sm:text-4xl sm:leading-tight"
          >
            {t("discordBotHowSubtitle")}
          </motion.h2>
        </div>

        <div className="relative mt-14 lg:mt-20">
          <div
            className="absolute left-[8%] right-[8%] top-8 hidden h-px lg:block"
            aria-hidden
            style={{
              background:
                "linear-gradient(90deg, transparent, rgba(167,139,250,0.5) 15%, rgba(56,189,248,0.45) 50%, rgba(167,139,250,0.5) 85%, transparent)",
            }}
          />
          <ol className="grid gap-6 md:grid-cols-3 md:gap-5 lg:gap-8">
            {steps.map((s, i) => (
              <motion.li
                key={s.n}
                initial={{ opacity: 0, y: 32 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, margin: "-40px" }}
                transition={{ delay: i * 0.1, duration: 0.55, ease: [0.22, 1, 0.36, 1] }}
                className="relative"
              >
                <div className="relative flex h-full flex-col rounded-[1.35rem] border border-white/[0.1] bg-gradient-to-b from-zinc-900/65 to-zinc-950/90 p-6 shadow-[0_24px_60px_rgba(0,0,0,0.35)] ring-1 ring-white/[0.05] backdrop-blur-md sm:p-7">
                  <div className="mb-5 flex items-center gap-3">
                    <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-violet-600/50 to-indigo-900/55 text-sm font-bold text-white shadow-inner shadow-black/20 ring-1 ring-white/15">
                      {s.n}
                    </div>
                    <div className="flex h-10 w-10 items-center justify-center rounded-xl border border-violet-500/25 bg-violet-500/10 text-violet-200/90">
                      <s.icon className="h-5 w-5" strokeWidth={1.65} aria-hidden />
                    </div>
                  </div>
                  <p className="text-sm leading-relaxed text-zinc-400 sm:text-[0.9375rem]">{t(s.textKey)}</p>
                </div>
              </motion.li>
            ))}
          </ol>
        </div>
      </div>
    </section>
  );
}
