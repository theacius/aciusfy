import type { Metadata } from "next";
import { Suspense } from "react";
import { DownloadPageContent } from "@/components/landing/DownloadPageContent";

export const metadata: Metadata = {
  title: "İndir — Aciusfy",
  description: "Aciusfy masaüstü uygulamasını indir; tam deneyim ve arka planda çalma.",
};

export default function DownloadPage() {
  return (
    <Suspense
      fallback={
        <div className="flex min-h-dvh items-center justify-center bg-[#050508] text-white/30">…</div>
      }
    >
      <DownloadPageContent />
    </Suspense>
  );
}
