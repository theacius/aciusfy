"use client";

import { useEffect } from "react";
import { listOfflineSongIds } from "@/lib/offline-storage";
import { useOfflineStore } from "@/store/offlineStore";

export function OfflineSync() {
  const setDownloadedIds = useOfflineStore((s) => s.setDownloadedIds);

  useEffect(() => {
    listOfflineSongIds()
      .then((ids) => setDownloadedIds(ids))
      .catch(() => {});
  }, [setDownloadedIds]);

  return null;
}
