"use client";

import { useEffect, useRef } from "react";
import dynamic from "next/dynamic";
import { getGsap } from "@/lib/gsap-client";
import { ScrollTrigger } from "@/lib/gsap-client";
import { useLandingScroll } from "@/components/landing/LandingScrollContext";
import { useLenis } from "@/components/providers/LenisProvider";

const LandingScrollVinyl = dynamic(
  () => import("@/components/landing/LandingScrollVinyl").then((m) => m.LandingScrollVinyl),
  { ssr: false },
);

/** GSAP ScrollTrigger + Lenis: vinyl yaklaşması, parallax, arka plan */
export function LandingScrollDriver() {
  const { setProgress } = useLandingScroll();
  const lenis = useLenis();
  const parallaxRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;

    const gsap = getGsap();

    const ctx = gsap.context(() => {
      ScrollTrigger.create({
        trigger: "#top",
        start: "top top",
        endTrigger: "#features",
        end: "top 55%",
        scrub: 1.4,
        onUpdate: (self) => {
          setProgress(self.progress);
          document.documentElement.style.setProperty("--landing-scroll", String(self.progress));
        },
      });

      if (parallaxRef.current) {
        gsap.to(parallaxRef.current, {
          y: 180,
          ease: "none",
          scrollTrigger: {
            trigger: "#top",
            start: "top top",
            end: "bottom top",
            scrub: 1.2,
          },
        });
      }

      gsap.utils.toArray<HTMLElement>("[data-landing-parallax]").forEach((el, i) => {
        gsap.to(el, {
          y: (i + 1) * 40,
          ease: "none",
          scrollTrigger: {
            trigger: el,
            start: "top bottom",
            end: "bottom top",
            scrub: 1.5,
          },
        });
      });
    });

    ScrollTrigger.refresh();

    return () => {
      ctx.revert();
      document.documentElement.style.removeProperty("--landing-scroll");
      setProgress(0);
    };
  }, [setProgress]);

  useEffect(() => {
    if (!lenis) return;
    const onScroll = () => ScrollTrigger.update();
    lenis.on("scroll", onScroll);
    return () => lenis.off("scroll", onScroll);
  }, [lenis]);

  return (
    <>
      <div
        ref={parallaxRef}
        className="pointer-events-none fixed inset-0 z-[2]"
        aria-hidden
        style={{
          background:
            "radial-gradient(ellipse 70% 50% at calc(50% + var(--landing-scroll, 0) * 20%) 40%, rgba(59,130,246,0.22) 0%, transparent 55%)",
          opacity: "calc(0.35 + var(--landing-scroll, 0) * 0.45)",
        }}
      />
      <LandingScrollVinyl />
    </>
  );
}
