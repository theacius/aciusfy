"use client";

import { useCallback, useLayoutEffect, useState } from "react";
import {
  hasSeenEntranceCurtain,
  markEntranceCurtainSeen,
  type EntranceCurtainKey,
} from "@/lib/entrance-curtain-session";

export function useEntranceCurtainGate(storageKey: EntranceCurtainKey) {
  const [ready, setReady] = useState(false);
  const [open, setOpen] = useState(false);

  useLayoutEffect(() => {
    setOpen(!hasSeenEntranceCurtain(storageKey));
    setReady(true);
  }, [storageKey]);

  const dismiss = useCallback(() => {
    markEntranceCurtainSeen(storageKey);
    setOpen(false);
  }, [storageKey]);

  return { ready, open, dismiss };
}
