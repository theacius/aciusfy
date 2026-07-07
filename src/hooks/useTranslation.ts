"use client";

import { useCallback } from "react";
import { useSettingsStore } from "@/store/settingsStore";
import {
  getTranslation,
  type LanguageCode,
} from "@/lib/i18n";

export function useTranslation() {
  const language = useSettingsStore((s) => s.language) as LanguageCode;

  const t = useCallback(
    (key: Parameters<typeof getTranslation>[0]) => getTranslation(key, language),
    [language]
  );

  return { t, language };
}
