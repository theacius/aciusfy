"use client";

import { useEffect, useRef } from "react";
import { usePathname } from "next/navigation";

const STORAGE_KEY = "aciusfy_vid";
const SESSION_DEBOUNCE_MS = 30 * 60 * 1000;
const SESSION_KEY = "aciusfy_visit_last";

function getOrCreateVisitorId(): string {
  if (typeof window === "undefined") return "";
  try {
    let id = localStorage.getItem(STORAGE_KEY);
    if (!id || id.length < 8) {
      id =
        typeof crypto !== "undefined" && crypto.randomUUID
          ? crypto.randomUUID().replace(/-/g, "")
          : `v${Date.now().toString(36)}${Math.random().toString(36).slice(2, 12)}`;
      localStorage.setItem(STORAGE_KEY, id);
    }
    return id.slice(0, 64);
  } catch {
    return `fallback_${Date.now()}`;
  }
}

export function VisitBeacon() {
  const pathname = usePathname();
  const sentRef = useRef(false);

  useEffect(() => {
    sentRef.current = false;
  }, [pathname]);

  useEffect(() => {
    if (sentRef.current) return;

    const now = Date.now();
    try {
      const last = sessionStorage.getItem(SESSION_KEY);
      if (last) {
        const t = parseInt(last, 10);
        if (!Number.isNaN(t) && now - t < SESSION_DEBOUNCE_MS) return;
      }
    } catch {}

    const visitorId = getOrCreateVisitorId();
    if (!visitorId) return;

    sentRef.current = true;

    void fetch("/api/analytics/visit", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      credentials: "include",
      body: JSON.stringify({
        visitorId,
        path: pathname || "/",
      }),
    })
      .then((r) => {
        if (r.ok) {
          try {
            sessionStorage.setItem(SESSION_KEY, String(now));
          } catch {}
        }
      })
      .catch(() => {
        sentRef.current = false;
      });
  }, [pathname]);

  return null;
}
