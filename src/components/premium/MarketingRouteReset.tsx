"use client";

import { useEffect } from "react";
import { usePathname } from "next/navigation";
import { resetMarketingDocumentScroll } from "@/lib/entrance-curtain-session";
import { recoverMarketingPageFromBfCache } from "@/lib/marketing-bfcache-recovery";
import { useLenis } from "@/components/providers/LenisProvider";

/** Client navigasyonunda body scroll / Lenis / GSAP takılmasını temizler. */
export function MarketingRouteReset() {
  const pathname = usePathname();
  const lenis = useLenis();

  useEffect(() => {
    resetMarketingDocumentScroll();
    lenis?.scrollTo(0, { immediate: true });
  }, [pathname, lenis]);

  useEffect(() => {
    const onPageShow = (event: PageTransitionEvent) => {
      if (!event.persisted) return;
      recoverMarketingPageFromBfCache();
      lenis?.scrollTo(0, { immediate: true });
    };
    window.addEventListener("pageshow", onPageShow);
    return () => window.removeEventListener("pageshow", onPageShow);
  }, [lenis]);

  return null;
}
