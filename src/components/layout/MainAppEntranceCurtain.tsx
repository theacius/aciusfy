"use client";

import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import { useEffect, useLayoutEffect, useState } from "react";
import { createPortal } from "react-dom";
import { AciusfyLogoMark } from "@/components/branding/AciusfyLogoMark";
import { useTranslation } from "@/hooks/useTranslation";

const STORAGE_KEY = "aciusfy_main_entrance_v1";
const AUTO_MS = 2000;
const AUTO_MS_REDUCED = 1400;

export function MainAppEntranceCurtain() {
  const { t } = useTranslation();
  const reduceMotion = useReducedMotion();
  const [portalEl, setPortalEl] = useState<HTMLElement | null>(null);
  const [open, setOpen] = useState(false);

  useLayoutEffect(() => {
    setPortalEl(document.body);
    try {
      if (sessionStorage.getItem(STORAGE_KEY) === "1") return;
    } catch {}
    setOpen(true);
  }, []);

  const close = () => {
    try {
      sessionStorage.setItem(STORAGE_KEY, "1");
    } catch {}
    setOpen(false);
  };

  useEffect(() => {
    if (!open) return;
    const ms = reduceMotion ? AUTO_MS_REDUCED : AUTO_MS;
    const tId = window.setTimeout(() => close(), ms);
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Enter" || e.key === "Escape") {
        e.preventDefault();
        close();
      }
    };
    window.addEventListener("keydown", onKey);
    return () => {
      window.clearTimeout(tId);
      window.removeEventListener("keydown", onKey);
    };
  }, [open, reduceMotion]);

  if (!portalEl) return null;

  return createPortal(
    <AnimatePresence>
      {open ? (
        <motion.div
          key="main-app-curtain"
          className="fixed inset-0 z-[265] flex items-center justify-center overflow-hidden"
          initial={
            reduceMotion ? { opacity: 0 } : { opacity: 1, clipPath: "inset(50% 50% 50% 50% round 2rem)" }
          }
          animate={{
            opacity: 1,
            clipPath: reduceMotion ? undefined : "inset(0% 0% 0% 0% round 0px)",
            filter: "blur(0px)",
          }}
          exit={
            reduceMotion
              ? { opacity: 0, transition: { duration: 0.35 } }
              : {
                  opacity: 0,
                  clipPath: "inset(48% 48% 48% 48% round 2.5rem)",
                  filter: "blur(14px)",
                  transition: { duration: 0.5, ease: [0.65, 0, 0.35, 1] },
                }
          }
          transition={
            reduceMotion
              ? { duration: 0.35 }
              : { duration: 0.72, ease: [0.19, 1, 0.22, 1] }
          }
          aria-hidden={false}
        >
          <motion.button
            type="button"
            aria-label={t("mainAppEntranceBackdropAria")}
            className="absolute inset-0 z-[1] cursor-pointer border-0 bg-transparent p-0"
            onClick={close}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
          />
          <div className="pointer-events-none absolute inset-0 bg-[#09090b]" />
          <div
            className="pointer-events-none absolute inset-0 opacity-30"
            style={{
              background:
                "radial-gradient(ellipse 100% 80% at 50% -20%, rgba(255,255,255,0.06), transparent 55%)",
            }}
          />

          <motion.div
            className="pointer-events-none relative z-10 flex flex-col items-center gap-5 px-6"
            initial={reduceMotion ? { opacity: 0 } : { opacity: 0, y: 20, scale: 0.94 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            transition={{
              delay: reduceMotion ? 0 : 0.18,
              duration: 0.55,
              ease: [0.22, 1, 0.36, 1],
            }}
          >
            <motion.div
              className="relative flex items-center justify-center"
              initial={{ opacity: 0, scale: 0.82, rotate: -6 }}
              animate={{ opacity: 1, scale: 1, rotate: 0 }}
              transition={{ type: "spring", stiffness: 260, damping: 22, delay: reduceMotion ? 0 : 0.2 }}
            >
              <AciusfyLogoMark presentation="bare" priority alt="" />
            </motion.div>
            <motion.p
              className="text-center text-sm font-medium tracking-[0.2em] text-white/50 sm:text-base"
              initial={{ opacity: 0, letterSpacing: "0.35em" }}
              animate={{ opacity: 1, letterSpacing: "0.2em" }}
              transition={{ delay: reduceMotion ? 0 : 0.35, duration: 0.5 }}
            >
              {t("mainAppEntranceWelcome")}
            </motion.p>
          </motion.div>
        </motion.div>
      ) : null}
    </AnimatePresence>,
    portalEl
  );
}
