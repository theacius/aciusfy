"use client";

import { useEffect, useRef, useState } from "react";
import { usePathname } from "next/navigation";
import { recoverMarketingPageFromBfCache } from "@/lib/marketing-bfcache-recovery";

/** Marketing sayfalarına geri dönüşte tam remount + bfcache kurtarma. */
export function useMarketingRemountKey(activeWhen: string | string[]) {
  const pathname = usePathname();
  const prevPath = useRef(pathname);
  const [key, setKey] = useState(0);
  const routeKey = Array.isArray(activeWhen) ? activeWhen.join("|") : activeWhen;

  useEffect(() => {
    const routes = routeKey.split("|");
    const isActive = routes.includes(pathname);

    if (isActive) {
      const cameBack =
        prevPath.current !== pathname &&
        prevPath.current !== "" &&
        !routes.includes(prevPath.current);

      if (cameBack) {
        recoverMarketingPageFromBfCache();
        setKey((k) => k + 1);
      }
    }

    prevPath.current = pathname;
  }, [pathname, routeKey]);

  useEffect(() => {
    const routes = routeKey.split("|");
    const onPageShow = (event: PageTransitionEvent) => {
      if (!event.persisted || !routes.includes(pathname)) return;
      recoverMarketingPageFromBfCache();
      setKey((k) => k + 1);
    };
    window.addEventListener("pageshow", onPageShow);
    return () => window.removeEventListener("pageshow", onPageShow);
  }, [pathname, routeKey]);

  return key;
}
