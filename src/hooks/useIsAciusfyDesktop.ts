"use client";

import { useEffect, useState } from "react";

export function useIsAciusfyDesktop() {
  const [v, setV] = useState(false);
  useEffect(() => {
    setV(typeof window !== "undefined" && !!window.aciusfyDesktop);
  }, []);
  return v;
}
