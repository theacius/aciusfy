import { devLog, devWarn, devError } from "@/lib/dev-log";
"use client";

import { useEffect, useId, useRef, useState } from "react";
import { getAdSenseClientId, isAdSenseEnabled, shouldRenderAdUnit } from "@/lib/adsense";
import { isAdSenseScriptLoaded, setAdSenseScriptLoaded, waitForAdSenseScript } from "@/lib/adsense-script-ready";
import { useTranslation } from "@/hooks/useTranslation";

declare global {
  interface Window {
    adsbygoogle?: unknown[];
  }
}

type Props = {
  adSlot: string
  className?: string;
};

export function AdSenseUnit({ adSlot, className }: Props) {
  const { t } = useTranslation();
  const client = getAdSenseClientId();
  const regionId = useId();
  const insRef = useRef<HTMLModElement>(null);
  const pushed = useRef(false);
  const [scriptReady, setScriptReady] = useState(() => isAdSenseScriptLoaded());
  const enabled = shouldRenderAdUnit(adSlot);

  useEffect(() => {
    if (!enabled) return;
    if (scriptReady) return;
    waitForAdSenseScript(() => setScriptReady(true));
  }, [enabled, scriptReady]);

  useEffect(() => {
    if (!enabled || !scriptReady || pushed.current || !insRef.current) return;
    try {
      window.adsbygoogle = window.adsbygoogle || [];
      window.adsbygoogle.push({});
      pushed.current = true;
    } catch (e) {
      devError("[AdSense] push failed", e);
    }
  }, [enabled, scriptReady, adSlot]);

  if (!enabled) {
    return null;
  }

  return (
    <section
      className={className}
      aria-label={t("adLabel")}
      data-ad-region={regionId}
    >
      <ins
        ref={insRef}
        className="adsbygoogle"
        style={{ display: "block" }}
        data-ad-client={client}
        data-ad-slot={adSlot}
        data-ad-format="auto"
        data-full-width-responsive="true"
      />
    </section>
  );
}
