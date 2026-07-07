"use client";

import { useEffect, useRef } from "react";
import { getGsap } from "@/lib/gsap-client";
import { ScrollTrigger } from "@/lib/gsap-client";

type RevealOptions = {
  y?: number;
  duration?: number;
  stagger?: number;
  start?: string;
  scrub?: boolean | number;
};

export function useGsapReveal<T extends HTMLElement>(options: RevealOptions = {}) {
  const ref = useRef<T>(null);
  const {
    y = 48,
    duration = 1,
    stagger = 0.08,
    start = "top 85%",
    scrub = false,
  } = options;

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (reduced) return;

    const gsap = getGsap();
    const targets = el.querySelectorAll("[data-reveal]");
    const animTargets = targets.length ? targets : [el];

    const tween = gsap.from(animTargets, {
      y,
      opacity: 0,
      duration,
      stagger,
      ease: "power3.out",
      scrollTrigger: {
        trigger: el,
        start,
        scrub: scrub || false,
        toggleActions: scrub ? undefined : "play none none reverse",
      },
    });

    return () => {
      tween.scrollTrigger?.kill();
      tween.kill();
      gsap.set(animTargets, { clearProps: "opacity,transform,y" });
      ScrollTrigger.getAll().forEach((t) => {
        if (t.trigger === el) t.kill();
      });
    };
  }, [y, duration, stagger, start, scrub]);

  return ref;
}

export function useGsapEntrance<T extends HTMLElement>(delay = 0) {
  const ref = useRef<T>(null);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (reduced) return;

    const gsap = getGsap();
    const targets = el.querySelectorAll("[data-entrance]");
    const animTargets = targets.length ? targets : [el];

    const tween = gsap.from(animTargets, {
      y: 32,
      opacity: 0,
      duration: 1.1,
      stagger: 0.1,
      delay,
      ease: "power3.out",
    });

    return () => {
      tween.kill();
      gsap.set(animTargets, { clearProps: "opacity,transform,y" });
    };
  }, [delay]);

  return ref;
}
