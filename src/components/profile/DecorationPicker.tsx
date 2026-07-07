"use client";

import { useState, useEffect, useCallback } from "react";
import { X, Check, Sparkles, Coins } from "lucide-react";
import { AvatarFrame, getAvatarFrameReservedBox, type DecorationData } from "./AvatarFrame";
import { AnimatedModal } from "@/components/ui/animated-modal";

interface OwnedDecoration extends DecorationData {
  description?: string | null;
  previewImage?: string | null;
  category?: string;
  price?: number;
  acquiredAt?: string;
  acquireMethod?: string;
}

interface DecorationPickerProps {
  open: boolean;
  onClose: () => void;
  userAvatar?: string | null;
  userName?: string | null;
  activeDecorationId?: string | null;
  onEquip: (decoration: DecorationData | null) => void;
}

const CATEGORY_LABELS: Record<string, string> = {
  STANDARD: "Standart",
  PREMIUM: "Premium",
  SPECIAL: "Özel",
  SEASONAL: "Sezonluk",
};

export function DecorationPicker({
  open,
  onClose,
  userAvatar,
  userName,
  activeDecorationId,
  onEquip,
}: DecorationPickerProps) {
  const [decorations, setDecorations] = useState<OwnedDecoration[]>([]);
  const [loading, setLoading] = useState(false);
  const [equipping, setEquipping] = useState(false);
  const [selectedId, setSelectedId] = useState<string | null>(activeDecorationId ?? null);
  const [coins, setCoins] = useState(0);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/decorations/user");
      const d = await res.json();
      setDecorations(d.decorations ?? []);
      setSelectedId(d.activeDecorationId ?? null);
      setCoins(d.coins ?? 0);
    } catch {}
    setLoading(false);
  }, []);

  useEffect(() => {
    if (open) load();
  }, [open, load]);

  useEffect(() => {
    if (!open) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = prev;
    };
  }, [open]);

  const handleEquip = async () => {
    setEquipping(true);
    try {
      const res = await fetch("/api/decorations/equip", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ decorationId: selectedId }),
      });
      if (res.ok) {
        const data = (await res.json().catch(() => ({}))) as { decoration?: DecorationData | null };
        const next =
          data.decoration !== undefined
            ? data.decoration
            : selectedId
              ? decorations.find((d) => d.id === selectedId) ?? null
              : null;
        onEquip(next);
        onClose();
      }
    } catch {}
    setEquipping(false);
  };

  const selectedDecoration = selectedId
    ? decorations.find((d) => d.id === selectedId) ?? null
    : null;

  const grouped = new Map<string, OwnedDecoration[]>();
  for (const d of decorations) {
    const cat = d.category || "STANDARD";
    const list = grouped.get(cat) ?? [];
    list.push(d);
    grouped.set(cat, list);
  }

  const previewBox = getAvatarFrameReservedBox(96);

  return (
    <AnimatedModal
      isOpen={open}
      onClose={onClose}
      title="Profil Çerçevesi"
      className="max-w-md"
    >
      <div className="flex items-center gap-3 border-b border-white/[0.06] px-5 py-4">
        <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-purple-500/15 ring-1 ring-purple-500/25">
          <Sparkles className="h-5 w-5 text-purple-400" />
        </div>
        <div className="flex items-center gap-2 text-xs text-muted">
          <Coins className="h-3 w-3 text-amber-400" />
          <span>{coins.toLocaleString("tr-TR")} puan</span>
        </div>
      </div>

      <div className="flex justify-center border-b border-white/[0.06] bg-white/[0.02] py-6">
              <div
                className="flex items-center justify-center"
                style={{
                  width: previewBox.w,
                  height: previewBox.h,
                  minWidth: previewBox.w,
                  minHeight: previewBox.h,
                }}
              >
                <AvatarFrame
                  src={userAvatar}
                  alt={userName ?? "Avatar"}
                  fallbackInitial={userName?.[0]?.toUpperCase() ?? "U"}
                  size={96}
                  decoration={selectedDecoration}
                />
              </div>
      </div>

      <div className="max-h-[50vh] overflow-y-auto p-5">
              {loading ? (
                <div className="flex justify-center py-8">
                  <div className="h-6 w-6 animate-spin rounded-full border-2 border-accent border-t-transparent" />
                </div>
              ) : decorations.length === 0 ? (
                <div className="py-8 text-center text-sm text-muted">
                  Henüz dekorasyonunuz yok. Mağazadan satın alabilirsiniz.
                </div>
              ) : (
                <div className="space-y-4">
                  
                  <button
                    onClick={() => setSelectedId(null)}
                    className={`flex w-full items-center gap-3 rounded-xl p-3 text-left transition-colors ${
                      selectedId === null
                        ? "bg-accent/10 ring-1 ring-accent/30"
                        : "bg-white/[0.03] hover:bg-white/[0.06]"
                    }`}
                  >
                    <div className="flex h-10 w-10 items-center justify-center rounded-full bg-white/10">
                      <X className="h-4 w-4 text-muted" />
                    </div>
                    <div className="flex-1">
                      <p className="text-sm font-medium text-foreground">Çerçeve Yok</p>
                      <p className="text-xs text-muted">Varsayılan görünüm</p>
                    </div>
                    {selectedId === null && <Check className="h-4 w-4 text-accent" />}
                  </button>

                  {[...grouped.entries()].map(([category, catDecs]) => (
                    <div key={category}>
                      <h4 className="mb-2 flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-muted">
                        <span className="h-px flex-1 bg-border" />
                        {CATEGORY_LABELS[category] || category}
                        <span className="h-px flex-1 bg-border" />
                      </h4>
                      <div className="space-y-1.5">
                        {catDecs.map((dec) => (
                          <button
                            key={dec.id}
                            onClick={() => setSelectedId(dec.id)}
                            className={`flex w-full items-center gap-3 rounded-xl p-3 text-left transition-colors ${
                              selectedId === dec.id
                                ? "bg-accent/10 ring-1 ring-accent/30"
                                : "bg-white/[0.03] hover:bg-white/[0.06]"
                            }`}
                          >
                            <AvatarFrame
                              src={userAvatar}
                              fallbackInitial={userName?.[0]?.toUpperCase() ?? "U"}
                              size={40}
                              decoration={dec}
                            />
                            <div className="min-w-0 flex-1">
                              <p className="text-sm font-medium text-foreground">{dec.name}</p>
                              {dec.description && (
                                <p className="truncate text-xs text-muted">{dec.description}</p>
                              )}
                            </div>
                            {selectedId === dec.id && <Check className="h-4 w-4 text-accent" />}
                          </button>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              )}
      </div>

      <div className="border-t border-white/[0.06] p-4">
        <div className="flex gap-3">
          <button
            onClick={onClose}
            className="flex-1 rounded-full border border-white/[0.08] bg-white/[0.04] px-4 py-2.5 text-sm font-medium text-muted transition hover:bg-white/[0.08]"
          >
            İptal
          </button>
          <button
            onClick={handleEquip}
            disabled={equipping || selectedId === activeDecorationId}
            className="flex-1 rounded-full border border-white/[0.08] bg-accent px-4 py-2.5 text-sm font-medium text-white transition-colors hover:bg-accent/90 disabled:opacity-50"
          >
            {equipping ? "Uygulanıyor..." : "Uygula"}
          </button>
        </div>
      </div>
    </AnimatedModal>
  );
}
