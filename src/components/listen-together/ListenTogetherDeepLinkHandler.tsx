"use client";

import { useSession } from "next-auth/react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useEffect, useRef } from "react";
import { useTranslation } from "@/hooks/useTranslation";
import { useListenTogetherStore } from "@/store/listenTogetherStore";
import { showErrorToast } from "@/store/toastStore";

export function ListenTogetherDeepLinkHandler() {
  const { t } = useTranslation();
  const searchParams = useSearchParams();
  const router = useRouter();
  const pathname = usePathname();
  const { status } = useSession();
  const doneRef = useRef(false);

  useEffect(() => {
    const code = searchParams.get("lt")?.trim().toUpperCase() ?? "";
    if (code.length !== 6 || doneRef.current) return;
    if (status === "loading") return;
    if (status !== "authenticated") return;

    doneRef.current = true;
    const join = useListenTogetherStore.getState().joinSession;
    void (async () => {
      const ok = await join(code);
      const url = new URL(window.location.href);
      url.searchParams.delete("lt");
      router.replace(`${pathname}${url.search}`, { scroll: false });
      if (!ok) {
        showErrorToast(t("listenTogetherDeepLinkError"));
      }
    })();
  }, [searchParams, router, pathname, status, t]);

  return null;
}
