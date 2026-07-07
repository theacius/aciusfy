"use client";

import { useEffect } from "react";
import { useSettingsStore } from "@/store/settingsStore";

export function ThemeProvider() {
  const theme = useSettingsStore((s) => s.theme);
  const playerCompactMode = useSettingsStore((s) => s.playerCompactMode);

  useEffect(() => {
    document.documentElement.classList.toggle("player-compact", playerCompactMode);
  }, [playerCompactMode]);

  useEffect(() => {
    const root = document.documentElement;
    const resolved =
      theme === "system"
        ? window.matchMedia("(prefers-color-scheme: dark)").matches
          ? "dark"
          : "light"
        : theme;
    root.classList.remove("dark", "light");
    root.classList.add(resolved);
  }, [theme]);

  useEffect(() => {
    if (theme !== "system") return;
    const mq = window.matchMedia("(prefers-color-scheme: dark)");
    const handler = () => {
      document.documentElement.classList.remove("dark", "light");
      document.documentElement.classList.add(mq.matches ? "dark" : "light");
    };
    mq.addEventListener("change", handler);
    return () => mq.removeEventListener("change", handler);
  }, [theme]);

  return null;
}
