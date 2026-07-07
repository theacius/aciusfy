"use client";

import { useEffect, useRef } from "react";
import { getGsap } from "@/lib/gsap-client";

/** GSAP ile hareket eden aurora / mesh blobları — landing arka planı */
export function PremiumGsapAmbience() {
  const rootRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const root = rootRef.current;
    if (!root) return;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;

    const gsap = getGsap();
    const orbs = gsap.utils.toArray<HTMLElement>(root.querySelectorAll("[data-orb]"));
    const beams = gsap.utils.toArray<HTMLElement>(root.querySelectorAll("[data-beam]"));

    const ctx = gsap.context(() => {
      orbs.forEach((orb, i) => {
        gsap.fromTo(
          orb,
          { x: 0, y: 0, scale: 1 },
          {
            x: () => gsap.utils.random(-90, 90),
            y: () => gsap.utils.random(-70, 70),
            scale: () => gsap.utils.random(0.88, 1.14),
            duration: 9 + i * 1.8,
            repeat: -1,
            yoyo: true,
            ease: "sine.inOut",
          },
        );
      });

      beams.forEach((beam, i) => {
        gsap.fromTo(
          beam,
          { opacity: 0.15, scaleX: 0.6 },
          {
            opacity: 0.45,
            scaleX: 1.05,
            duration: 4 + i,
            repeat: -1,
            yoyo: true,
            ease: "sine.inOut",
          },
        );
      });

      gsap.to(root.querySelector("[data-grid]"), {
        backgroundPosition: "0px 120px",
        duration: 24,
        repeat: -1,
        ease: "none",
      });
    }, root);

    return () => ctx.revert();
  }, []);

  return (
    <div ref={rootRef} className="pointer-events-none fixed inset-0 z-0 overflow-hidden" aria-hidden>
      <div
        data-grid
        className="absolute inset-0 opacity-[0.14]"
        style={{
          backgroundImage: `
            linear-gradient(rgba(255,255,255,0.06) 1px, transparent 1px),
            linear-gradient(90deg, rgba(255,255,255,0.05) 1px, transparent 1px)
          `,
          backgroundSize: "72px 72px",
          maskImage: "radial-gradient(ellipse 90% 80% at 50% 40%, black 20%, transparent 75%)",
        }}
      />

      <div
        data-orb
        className="absolute -left-[12%] top-[2%] h-[min(62vh,520px)] w-[min(62vw,620px)] rounded-full bg-[radial-gradient(circle,rgba(59,130,246,0.42)_0%,rgba(59,130,246,0.08)_45%,transparent_72%)] blur-3xl"
      />
      <div
        data-orb
        className="absolute -right-[8%] top-[12%] h-[min(58vh,480px)] w-[min(50vw,540px)] rounded-full bg-[radial-gradient(circle,rgba(139,92,246,0.36)_0%,rgba(124,58,237,0.06)_50%,transparent_72%)] blur-[90px]"
      />
      <div
        data-orb
        className="absolute bottom-[8%] left-[22%] h-[min(42vh,360px)] w-[min(44vw,460px)] rounded-full bg-[radial-gradient(circle,rgba(14,165,233,0.28)_0%,transparent_68%)] blur-[80px]"
      />
      <div
        data-orb
        className="absolute right-[18%] top-[48%] h-[min(36vh,300px)] w-[min(32vw,340px)] rounded-full bg-[radial-gradient(circle,rgba(96,165,250,0.22)_0%,transparent_70%)] blur-[70px]"
      />

      <div
        data-beam
        className="absolute left-[8%] top-[32%] h-px w-[45vw] origin-left bg-gradient-to-r from-transparent via-blue-400/50 to-transparent"
      />
      <div
        data-beam
        className="absolute right-[5%] top-[58%] h-px w-[38vw] origin-right bg-gradient-to-l from-transparent via-violet-400/40 to-transparent"
      />

      <div className="absolute inset-0 bg-[radial-gradient(ellipse_70%_55%_at_50%_45%,transparent_30%,rgba(3,3,3,0.55)_100%)]" />
    </div>
  );
}
