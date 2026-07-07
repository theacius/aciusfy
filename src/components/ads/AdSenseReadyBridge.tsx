"use client";

import { useEffect } from "react";
import { getAdSenseClientId, isAdSenseEnabled } from "@/lib/adsense";
import { isAdSenseScriptLoaded, setAdSenseScriptLoaded } from "@/lib/adsense-script-ready";

export function AdSenseReadyBridge() {
  const active = isAdSenseEnabled() && getAdSenseClientId().startsWith("ca-pub-");

  useEffect(() => {
    if (!active) return;
    if (isAdSenseScriptLoaded()) return;
    const tick = () => {
      if (typeof window !== "undefined" && window.adsbygoogle) {
        setAdSenseScriptLoaded();
        return true;
      }
      return false;
    };
    if (tick()) return;
    const id = window.setInterval(() => {
      if (tick()) window.clearInterval(id);
    }, 80);
    const max = window.setTimeout(() => window.clearInterval(id), 20_000);
    return () => {
      window.clearInterval(id);
      window.clearTimeout(max);
    };
  }, [active]);

  return null;
}
