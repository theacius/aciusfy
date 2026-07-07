"use client";

import { useState, useEffect, useCallback } from "react";
import { useSession } from "next-auth/react";
import { motion } from "framer-motion";
import Link from "next/link";
import { Coins, ShoppingBag, Check, Lock, Sparkles, Crown, CalendarDays } from "lucide-react";
import { useTranslation } from "@/hooks/useTranslation";
import { AvatarFrame, type DecorationData } from "@/components/profile/AvatarFrame";
import { AnimatedModal } from "@/components/ui/animated-modal";

interface ShopDecoration {
  id: string;
  name: string;
  description: string | null;
  previewImage: string | null;
  frameImage: string | null;
  animationType: string;
  cssConfig: string | null;
  category: string;
  price: number;
  requiredBadgeId: string | null;
}

const CATEGORY_META: Record<string, { label: string; icon: React.ReactNode; color: string }> = {
  STANDARD: { label: "Standart", icon: <Sparkles className="h-4 w-4" />, color: "text-blue-400" },
  PREMIUM: { label: "Premium", icon: <Crown className="h-4 w-4" />, color: "text-amber-400" },
  SPECIAL: { label: "Özel", icon: <ShoppingBag className="h-4 w-4" />, color: "text-purple-400" },
  SEASONAL: { label: "Sezonluk", icon: <Sparkles className="h-4 w-4" />, color: "text-emerald-400" },
};

export default function ShopPage() {
  const { data: session } = useSession();
  const { t } = useTranslation();
  const [allDecorations, setAllDecorations] = useState<ShopDecoration[]>([]);
  const [ownedIds, setOwnedIds] = useState<Set<string>>(new Set());
  const [coins, setCoins] = useState(0);
  const [loading, setLoading] = useState(true);
  const [purchasing, setPurchasing] = useState<string | null>(null);
  const [previewDec, setPreviewDec] = useState<ShopDecoration | null>(null);
  const [userAvatar, setUserAvatar] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const [allRes, ownedRes] = await Promise.all([
        fetch("/api/decorations"),
        fetch("/api/decorations/user"),
      ]);
      const allData = await allRes.json();
      const ownedData = await ownedRes.json();

      setAllDecorations(allData.decorations ?? []);
      setOwnedIds(new Set((ownedData.decorations ?? []).map((d: { id: string }) => d.id)));
      setCoins(ownedData.coins ?? 0);
    } catch {}
    setLoading(false);
  }, []);

  useEffect(() => { load(); }, [load]);

  useEffect(() => {
    if (session?.user?.id) {
      fetch("/api/profile")
        .then((r) => r.json())
        .then((d) => setUserAvatar(d.avatar ?? null))
        .catch(() => {});
    }
  }, [session?.user?.id]);

  const handlePurchase = async (decorationId: string) => {
    setPurchasing(decorationId);
    try {
      const res = await fetch("/api/shop/purchase", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ decorationId }),
      });
      const data = await res.json();
      if (res.ok) {
        setOwnedIds((prev) => new Set([...prev, decorationId]));
        setCoins(data.remainingCoins ?? coins);
      } else {
        alert(data.error || "Satın alma başarısız");
      }
    } catch {
      alert("Bir hata oluştu");
    }
    setPurchasing(null);
  };

  const grouped = new Map<string, ShopDecoration[]>();
  for (const d of allDecorations) {
    const cat = d.category || "STANDARD";
    const list = grouped.get(cat) ?? [];
    list.push(d);
    grouped.set(cat, list);
  }

  return (
    <div className="min-h-screen px-4 py-6 sm:px-8">
      
      <div className="mb-8">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-foreground">Mağaza</h1>
            <p className="mt-1 text-sm text-muted">Profil çerçeveleri ile profilini özelleştir</p>
            <Link
              href="/rewards"
              className="mt-2 inline-flex items-center gap-2 text-sm font-medium text-amber-400/90 underline-offset-2 hover:underline"
            >
              <CalendarDays className="h-4 w-4 shrink-0" aria-hidden />
              {t("shopLinkDailyQuests")}
            </Link>
          </div>
          <div className="flex items-center gap-2 rounded-xl bg-amber-500/10 px-4 py-2 ring-1 ring-amber-500/20">
            <Coins className="h-4 w-4 text-amber-400" />
            <span className="font-semibold text-amber-400">{coins.toLocaleString("tr-TR")}</span>
            <span className="text-xs text-amber-400/70">puan</span>
          </div>
        </div>
      </div>

      {loading ? (
        <div className="flex justify-center py-16">
          <div className="h-8 w-8 animate-spin rounded-full border-2 border-accent border-t-transparent" />
        </div>
      ) : allDecorations.length === 0 ? (
        <div className="py-16 text-center">
          <ShoppingBag className="mx-auto mb-4 h-12 w-12 text-muted" />
          <p className="text-lg font-medium text-foreground">Mağaza boş</p>
          <p className="mt-1 text-sm text-muted">Yakında yeni dekorasyonlar eklenecek</p>
        </div>
      ) : (
        <div className="space-y-10">
          {[...grouped.entries()].map(([category, decs]) => {
            const meta = CATEGORY_META[category] ?? CATEGORY_META.STANDARD;
            return (
              <section key={category}>
                <div className="mb-4 flex items-center gap-2">
                  <span className={meta.color}>{meta.icon}</span>
                  <h2 className={`text-lg font-semibold ${meta.color}`}>{meta.label}</h2>
                  <span className="rounded-full bg-white/5 px-2 py-0.5 text-xs font-medium text-muted">
                    {decs.length}
                  </span>
                </div>

                <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5">
                  {decs.map((dec) => {
                    const owned = ownedIds.has(dec.id);
                    const isBadgeLocked = !!dec.requiredBadgeId && !owned;

                    return (
                      <motion.div
                        key={dec.id}
                        whileHover={{ scale: 1.02 }}
                        className={`group relative overflow-hidden rounded-2xl border transition-colors ${
                          owned
                            ? "border-emerald-500/30 bg-emerald-500/5"
                            : "border-border bg-white/[0.02] hover:border-white/20"
                        }`}
                      >
                        <button
                          onClick={() => setPreviewDec(dec)}
                          className="flex w-full flex-col items-center px-4 py-5 text-center"
                        >
                          <AvatarFrame
                            src={userAvatar}
                            fallbackInitial={session?.user?.name?.[0]?.toUpperCase() ?? "U"}
                            size={64}
                            decoration={{
                              id: dec.id,
                              name: dec.name,
                              frameImage: dec.frameImage,
                              animationType: dec.animationType,
                              cssConfig: dec.cssConfig,
                            }}
                          />
                          <p className="mt-3 text-sm font-medium text-foreground">{dec.name}</p>
                          {dec.description && (
                            <p className="mt-0.5 line-clamp-2 text-[11px] text-muted">{dec.description}</p>
                          )}

                          <div className="mt-3">
                            {owned ? (
                              <span className="inline-flex items-center gap-1 rounded-full bg-emerald-500/20 px-3 py-1 text-xs font-medium text-emerald-400">
                                <Check className="h-3 w-3" /> Sahipsin
                              </span>
                            ) : isBadgeLocked ? (
                              <span className="inline-flex items-center gap-1 rounded-full bg-white/5 px-3 py-1 text-xs font-medium text-muted">
                                <Lock className="h-3 w-3" /> Rozet Gerekli
                              </span>
                            ) : dec.price === 0 ? (
                              <span className="inline-flex items-center gap-1 rounded-full bg-accent/20 px-3 py-1 text-xs font-medium text-accent">
                                Ücretsiz
                              </span>
                            ) : (
                              <span className="inline-flex items-center gap-1 rounded-full bg-amber-500/10 px-3 py-1 text-xs font-medium text-amber-400">
                                <Coins className="h-3 w-3" /> {dec.price.toLocaleString("tr-TR")}
                              </span>
                            )}
                          </div>
                        </button>
                      </motion.div>
                    );
                  })}
                </div>
              </section>
            );
          })}
        </div>
      )}

      
      <AnimatedModal
        isOpen={!!previewDec}
        onClose={() => setPreviewDec(null)}
        title={previewDec?.name ?? "Önizleme"}
        className="max-w-sm"
      >
        {previewDec && (
              <div className="flex flex-col items-center gap-4 p-6 pt-2">
                <AvatarFrame
                  src={userAvatar}
                  fallbackInitial={session?.user?.name?.[0]?.toUpperCase() ?? "U"}
                  size={120}
                  decoration={{
                    id: previewDec.id,
                    name: previewDec.name,
                    frameImage: previewDec.frameImage,
                    animationType: previewDec.animationType,
                    cssConfig: previewDec.cssConfig,
                  }}
                />

                {previewDec.description && (
                  <p className="text-center text-sm text-muted">{previewDec.description}</p>
                )}

                {ownedIds.has(previewDec.id) ? (
                  <div className="flex items-center gap-2 rounded-full border border-white/[0.08] bg-emerald-500/10 px-5 py-2.5 text-sm font-medium text-emerald-400">
                    <Check className="h-4 w-4" /> Sahipsiniz
                  </div>
                ) : previewDec.requiredBadgeId ? (
                  <div className="flex items-center gap-2 rounded-full border border-white/[0.08] bg-white/[0.04] px-5 py-2.5 text-sm font-medium text-muted">
                    <Lock className="h-4 w-4" /> Gerekli rozete sahip değilsiniz
                  </div>
                ) : (
                  <div className="flex w-full flex-col gap-2">
                    {previewDec.price > 0 && (
                      <div className="flex items-center justify-center gap-2 text-sm text-muted">
                        <Coins className="h-4 w-4 text-amber-400" />
                        <span>Fiyat: <strong className="text-amber-400">{previewDec.price.toLocaleString("tr-TR")}</strong></span>
                        <span className="mx-1">·</span>
                        <span>Bakiye: <strong className={coins >= previewDec.price ? "text-emerald-400" : "text-red-400"}>{coins.toLocaleString("tr-TR")}</strong></span>
                      </div>
                    )}
                    <button
                      onClick={() => handlePurchase(previewDec.id)}
                      disabled={purchasing === previewDec.id || (previewDec.price > 0 && coins < previewDec.price)}
                      className="w-full rounded-full border border-white/[0.08] bg-accent px-5 py-2.5 text-sm font-medium text-white transition hover:bg-accent/90 disabled:opacity-50"
                    >
                      {purchasing === previewDec.id
                        ? "Satın Alınıyor..."
                        : previewDec.price === 0
                          ? "Ücretsiz Al"
                          : `${previewDec.price.toLocaleString("tr-TR")} Puan ile Satın Al`}
                    </button>
                  </div>
                )}
              </div>
        )}
      </AnimatedModal>
    </div>
  );
}
