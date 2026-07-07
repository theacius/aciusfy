"use client";

import { useState, useRef, useCallback } from "react";

export function useHoverPreview(delay: number = 2000) {
  const [isPreviewActive, setIsPreviewActive] = useState(false);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const onMouseEnter = useCallback(() => {
    timerRef.current = setTimeout(() => {
      setIsPreviewActive(true);
    }, delay);
  }, [delay]);

  const onMouseLeave = useCallback(() => {
    if (timerRef.current) {
      clearTimeout(timerRef.current);
      timerRef.current = null;
    }
    setIsPreviewActive(false);
  }, []);

  return {
    isPreviewActive,
    onMouseEnter,
    onMouseLeave,
  };
}
