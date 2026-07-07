"use client";

import { useState, useEffect, useCallback } from "react";
import { X, Check, Crown } from "lucide-react";
import { ProfileTitleChip } from "./ProfileTitleChip";
import { AnimatedModal } from "@/components/ui/animated-modal";
import type { ProfileTitlePublic } from "@/lib/profile-title-public";

type Props = {
  open: boolean;
  onClose: () => void;
  activeTitleId?: string | null;
  onEquip: (title: ProfileTitlePublic | null) => void;
};

export function TitlePicker({ open, onClose, activeTitleId, onEquip }: Props) {
  const [titles, setTitles] = useState<ProfileTitlePublic[]>([]);
  const [selectedId, setSelectedId] = useState<string | null>(activeTitleId ?? null);
  const [loading, setLoading] = useState(false);
  const [equipping, setEquipping] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/titles/user");
      const d = await res.json();
      setTitles(d.titles ?? []);
      setSelectedId(d.activeTitleId ?? null);
    } catch {}
    setLoading(false);
  }, []);

  useEffect(() => {
    if (open) void load();
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
      const res = await fetch("/api/titles/equip", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ titleId: selectedId }),
      });
      if (res.ok) {
        const data = (await res.json().catch(() => ({}))) as { title?: ProfileTitlePublic | null };
        const next =
          data.title !== undefined
            ? data.title
            : selectedId
              ? titles.find((x) => x.id === selectedId) ?? null
              : null;
        onEquip(next);
        onClose();
      }
    } catch {}
    setEquipping(false);
  };

  const selectedTitle = selectedId ? titles.find((x) => x.id === selectedId) ?? null : null;

  return (
    <AnimatedModal
      isOpen={open}
      onClose={onClose}
      title="Profil ünvanı"
      className="max-w-md"
    >
      <div className="flex items-center gap-3 border-b border-white/[0.06] px-5 py-4">
        <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-amber-500/15 ring-1 ring-amber-500/25">
          <Crown className="h-5 w-5 text-amber-400" />
        </div>
        <p className="text-xs text-muted">Sahip olduğun ünvanlardan birini seç</p>
      </div>

      <div className="border-b border-white/[0.06] bg-white/[0.02] px-5 py-4">
              <p className="mb-2 text-xs text-muted">Önizleme</p>
              <ProfileTitleChip title={selectedTitle} className="text-xs" />
      </div>

      <div className="max-h-[45vh] overflow-y-auto p-5">
              {loading ? (
                <div className="flex justify-center py-8">
                  <div className="h-6 w-6 animate-spin rounded-full border-2 border-accent border-t-transparent" />
                </div>
              ) : titles.length === 0 ? (
                <p className="py-6 text-center text-sm text-muted">Henüz atanmış ünvanın yok.</p>
              ) : (
                <div className="space-y-2">
                  <button
                    type="button"
                    onClick={() => setSelectedId(null)}
                    className={`flex w-full items-center gap-3 rounded-xl p-3 text-left transition-colors ${
                      selectedId === null ? "bg-accent/10 ring-1 ring-accent/30" : "bg-white/[0.03] hover:bg-white/[0.06]"
                    }`}
                  >
                    <div className="flex h-9 w-9 items-center justify-center rounded-full bg-white/10">
                      <X className="h-4 w-4 text-muted" />
                    </div>
                    <span className="text-sm font-medium text-foreground">Ünvan yok</span>
                    {selectedId === null ? <Check className="ml-auto h-4 w-4 text-accent" /> : null}
                  </button>
                  {titles.map((t) => (
                    <button
                      key={t.id}
                      type="button"
                      onClick={() => setSelectedId(t.id)}
                      className={`flex w-full items-center gap-3 rounded-xl p-3 text-left transition-colors ${
                        selectedId === t.id ? "bg-accent/10 ring-1 ring-accent/30" : "bg-white/[0.03] hover:bg-white/[0.06]"
                      }`}
                    >
                      <ProfileTitleChip title={t} />
                      {selectedId === t.id ? <Check className="ml-auto h-4 w-4 shrink-0 text-accent" /> : null}
                    </button>
                  ))}
                </div>
              )}
      </div>

      <div className="flex gap-3 border-t border-white/[0.06] p-4">
        <button
          type="button"
          onClick={onClose}
          className="flex-1 rounded-full border border-white/[0.08] bg-white/[0.04] px-4 py-2.5 text-sm font-medium text-muted transition hover:bg-white/[0.08]"
        >
          İptal
        </button>
        <button
          type="button"
          onClick={() => void handleEquip()}
          disabled={equipping || selectedId === (activeTitleId ?? null)}
          className="flex-1 rounded-full border border-white/[0.08] bg-accent px-4 py-2.5 text-sm font-medium text-white transition-colors hover:bg-accent/90 disabled:opacity-50"
        >
          {equipping ? "Uygulanıyor..." : "Uygula"}
        </button>
      </div>
    </AnimatedModal>
  );
}
