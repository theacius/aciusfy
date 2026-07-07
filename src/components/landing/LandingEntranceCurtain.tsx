"use client";

import { useEffect, useLayoutEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import dynamic from "next/dynamic";
import { getGsap } from "@/lib/gsap-client";
import { AciusfyLogoMark } from "@/components/branding/AciusfyLogoMark";
import { AciusfyLandingWordmark } from "@/components/branding/AciusfyLandingWordmark";
import { useTranslation } from "@/hooks/useTranslation";
import { ENTRANCE_CURTAIN_KEYS } from "@/lib/entrance-curtain-session";
import { useEntranceCurtainGate } from "@/hooks/useEntranceCurtainGate";

const SpaceBackground = dynamic(
  () => import("@/components/premium/SpaceBackground").then((m) => m.SpaceBackground),
  { ssr: false },
);

const AUTO_MS = 2800;
const AUTO_MS_REDUCED = 1800;

export function LandingEntranceCurtain({ onDismiss }: { onDismiss?: () => void }) {
  const { t } = useTranslation();
  const { ready, open, dismiss } = useEntranceCurtainGate(ENTRANCE_CURTAIN_KEYS.landing);
  const [portalEl, setPortalEl] = useState<HTMLElement | null>(null);

  const overlayRef = useRef<HTMLDivElement>(null);
  const contentRef = useRef<HTMLDivElement>(null);
  const logoRef = useRef<HTMLDivElement>(null);
  const wordmarkRef = useRef<HTMLDivElement>(null);
  const lineRef = useRef<HTMLDivElement>(null);
  const exitingRef = useRef(false);
  const onDismissRef = useRef(onDismiss);
  onDismissRef.current = onDismiss;

  useLayoutEffect(() => {
    setPortalEl(document.body);
  }, []);

  const runFinish = () => {
    if (exitingRef.current || !overlayRef.current) return;
    exitingRef.current = true;

    const finish = () => {
      dismiss();
      onDismissRef.current?.();
    };

    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const gsap = getGsap();

    if (reduced) {
      gsap.to(overlayRef.current, {
        opacity: 0,
        duration: 0.4,
        onComplete: finish,
      });
      return;
    }

    const tl = gsap.timeline({ onComplete: finish });

    tl.to(contentRef.current, { opacity: 0, y: -20, scale: 1.03, duration: 0.42, ease: "power2.in" }, 0)
      .to(
        overlayRef.current,
        {
          clipPath: "circle(0% at 50% 50%)",
          duration: 0.9,
          ease: "power4.inOut",
        },
        0.06,
      )
      .to(overlayRef.current, { opacity: 0, duration: 0.18 }, 0.74);
  };

  useEffect(() => {
    if (!open || !overlayRef.current || !contentRef.current) return;

    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const gsap = getGsap();
    const root = overlayRef.current;

    const contentEl = contentRef.current;
    const logoEl = logoRef.current;
    const wordmarkEl = wordmarkRef.current;
    const lineEl = lineRef.current;
    if (!contentEl) return;

    const ctx = gsap.context(() => {
      gsap.set(root, {
        clipPath: reduced ? "none" : "circle(0% at 50% 50%)",
        opacity: reduced ? 0 : 1,
      });

      if (reduced) {
        gsap.to(root, { opacity: 1, duration: 0.35 });
        gsap.fromTo(contentEl, { opacity: 0 }, { opacity: 1, duration: 0.4 });
      } else {
        const tl = gsap.timeline();
        tl.to(root, {
          clipPath: "circle(150% at 50% 50%)",
          duration: 1,
          ease: "power3.out",
        })
          .from(
            logoEl,
            { opacity: 0, scale: 0.72, y: 28, duration: 0.95, ease: "power3.out" },
            0.28,
          )
          .from(
            wordmarkEl,
            { opacity: 0, y: 22, filter: "blur(12px)", duration: 0.85, ease: "power3.out" },
            0.48,
          )
          .from(
            lineEl,
            { scaleX: 0, opacity: 0, duration: 0.7, ease: "power2.out" },
            0.62,
          )
          .from(
            contentEl.querySelectorAll("[data-intro-fade]"),
            { opacity: 0, y: 10, stagger: 0.07, duration: 0.5, ease: "power2.out" },
            0.72,
          )
          .fromTo(contentEl, { opacity: 0 }, { opacity: 1, duration: 0.01 }, 0.28);
      }
    }, root);

    const ms = reduced ? AUTO_MS_REDUCED : AUTO_MS;
    const tId = window.setTimeout(() => runFinish(), ms);
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Enter" || e.key === "Escape") {
        e.preventDefault();
        runFinish();
      }
    };
    window.addEventListener("keydown", onKey);
    return () => {
      ctx.revert();
      window.clearTimeout(tId);
      window.removeEventListener("keydown", onKey);
      document.body.style.overflow = "";
    };
  }, [open]);

  if (!ready || !portalEl || !open) return null;

  return createPortal(
    <div
      ref={overlayRef}
      className="fixed inset-0 z-[270] flex items-center justify-center overflow-hidden bg-[#09090b]"
      style={{ clipPath: "circle(0% at 50% 50%)" }}
    >
      <button
        type="button"
        aria-label={t("landingEntranceBackdropAria")}
        className="absolute inset-0 z-[1] cursor-pointer border-0 bg-transparent"
        onClick={runFinish}
      />

      <div className="pointer-events-none absolute inset-0 z-0">
        <SpaceBackground intensity="intro" className="absolute inset-0 opacity-95" />
        <div
          className="absolute inset-0"
          style={{
            background:
              "radial-gradient(ellipse 100% 80% at 50% -20%, rgba(255,255,255,0.06) 0%, transparent 55%)",
          }}
        />
        <div
          className="absolute inset-0 opacity-[0.1]"
          style={{
            backgroundImage: `
              linear-gradient(rgba(255,255,255,0.06) 1px, transparent 1px),
              linear-gradient(90deg, rgba(255,255,255,0.04) 1px, transparent 1px)
            `,
            backgroundSize: "64px 64px",
          }}
        />
      </div>

      <div
        ref={contentRef}
        className="pointer-events-none relative z-10 flex flex-col items-center gap-6 px-6 opacity-0"
      >
        <div ref={logoRef} className="relative flex items-center justify-center">
          <div
            className="absolute h-36 w-36 rounded-full bg-white/[0.06] blur-3xl sm:h-44 sm:w-44"
            aria-hidden
          />
          <AciusfyLogoMark
            presentation="bare"
            priority
            alt=""
            className="relative h-[5.5rem] w-[5.5rem] sm:h-[6.75rem] sm:w-[6.75rem]"
          />
        </div>

        <div className="text-center">
          <div ref={wordmarkRef}>
            <AciusfyLandingWordmark variant="intro" className="mx-auto block" />
            <span className="sr-only">{t("landingHeroTitle")}</span>
          </div>

          <div
            ref={lineRef}
            className="mx-auto mt-5 h-px w-28 origin-center bg-gradient-to-r from-transparent via-white/25 to-transparent opacity-0 sm:w-36"
          />

          <p
            className="mx-auto mt-5 max-w-xs text-sm leading-relaxed text-white/45 sm:max-w-sm sm:text-[0.9375rem]"
            data-intro-fade
          >
            {t("landingEntranceSubtitle")}
          </p>
        </div>

        <p className="text-[0.625rem] uppercase tracking-[0.22em] text-white/30" data-intro-fade>
          {t("landingEntranceSkip")}
        </p>
      </div>
    </div>,
    portalEl,
  );
}
