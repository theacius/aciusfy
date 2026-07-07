"use client";

import { useEffect, useRef } from "react";

const DEFAULT_INTERVAL_MS = 5000;

export function useRefreshInterval(
  callback: () => void,
  intervalMs: number = DEFAULT_INTERVAL_MS,
  enabled: boolean = true
) {
  const callbackRef = useRef(callback);

  useEffect(() => {
    callbackRef.current = callback;
  }, [callback]);

  useEffect(() => {
    if (!enabled || intervalMs <= 0) return;
    const id = setInterval(() => callbackRef.current(), intervalMs);
    return () => clearInterval(id);
  }, [intervalMs, enabled]);
}
