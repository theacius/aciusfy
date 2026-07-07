"use client";

import {
  createContext,
  useContext,
  useEffect,
  useRef,
  useState,
  type ReactNode,
} from "react";
import Lenis from "lenis";
import { getGsap } from "@/lib/gsap-client";
import { ScrollTrigger } from "@/lib/gsap-client";

type LenisMode = "window" | "element";

const LenisContext = createContext<Lenis | null>(null);

export function useLenis() {
  return useContext(LenisContext);
}

export function scrollWithLenis(lenis: Lenis | null, target: string | number | HTMLElement) {
  if (lenis) {
    lenis.scrollTo(target, { offset: -72, duration: 1.4 });
    return;
  }
  if (typeof target === "string") {
    const el = document.querySelector(target);
    el?.scrollIntoView({ behavior: "smooth", block: "start" });
    return;
  }
  if (typeof target === "number") {
    window.scrollTo({ top: target, behavior: "smooth" });
    return;
  }
  target.scrollIntoView({ behavior: "smooth", block: "start" });
}

type LenisProviderProps = {
  children: ReactNode;
  mode?: LenisMode;
  /** Scroll container element when mode === "element" */
  scrollElement?: HTMLElement | null;
};

export function LenisProvider({ children, mode = "window", scrollElement }: LenisProviderProps) {
  const [lenis, setLenis] = useState<Lenis | null>(null);
  const [bfCacheNonce, setBfCacheNonce] = useState(0);
  const instanceRef = useRef<Lenis | null>(null);

  useEffect(() => {
    const onPageShow = (event: PageTransitionEvent) => {
      if (event.persisted) setBfCacheNonce((n) => n + 1);
    };
    window.addEventListener("pageshow", onPageShow);
    return () => window.removeEventListener("pageshow", onPageShow);
  }, []);

  useEffect(() => {
    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (reduced) return;
    if (mode === "element" && !scrollElement) return;

    const gsap = getGsap();
    const instance = new Lenis(
      mode === "element" && scrollElement
        ? { wrapper: scrollElement, content: scrollElement, lerp: 0.09, smoothWheel: true }
        : { lerp: 0.08, smoothWheel: true },
    );

    instanceRef.current = instance;
    setLenis(instance);

    instance.on("scroll", ScrollTrigger.update);

    const tick = (time: number) => {
      instance.raf(time * 1000);
    };
    gsap.ticker.add(tick);
    gsap.ticker.lagSmoothing(0);

    return () => {
      gsap.ticker.remove(tick);
      instance.destroy();
      instanceRef.current = null;
      setLenis(null);
    };
  }, [mode, scrollElement, bfCacheNonce]);

  return <LenisContext.Provider value={lenis}>{children}</LenisContext.Provider>;
}
