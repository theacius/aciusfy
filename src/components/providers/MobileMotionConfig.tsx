"use client";

import { MotionConfig } from "framer-motion";
import { useSyncExternalStore } from "react";

const MOBILE_MQ = "(max-width: 1023px)";

function subscribe(onChange: () => void) {
  const mq = window.matchMedia(MOBILE_MQ);
  mq.addEventListener("change", onChange);
  return () => mq.removeEventListener("change", onChange);
}

function getIsMobileSnapshot(): boolean {
  return window.matchMedia(MOBILE_MQ).matches;
}

function getServerSnapshot(): boolean {
  return false;
}

export function MobileMotionConfig({ children }: { children: React.ReactNode }) {
  const isMobile = useSyncExternalStore(
    subscribe,
    getIsMobileSnapshot,
    getServerSnapshot
  );

  return (
    <MotionConfig reducedMotion={isMobile ? "always" : "user"}>
      {children}
    </MotionConfig>
  );
}
