"use client";

import { useState, useCallback, type ReactNode } from "react";
import { useTranslation } from "@/hooks/useTranslation";
import { Trash2 } from "lucide-react";
import { StevenActionMenu, type StevenActionItem } from "@/components/navigation/StevenActionMenu";

interface SavedSectionContextMenuProps {
  children: ReactNode;
  sectionId: string;
  sectionTitle?: string;
  onRemove: () => void;
}

export function SavedSectionContextMenu({
  children,
  sectionId,
  sectionTitle,
  onRemove,
}: SavedSectionContextMenuProps) {
  const { t } = useTranslation();
  const [open, setOpen] = useState(false);

  const handleContextMenu = useCallback((e: React.MouseEvent) => {
    e.preventDefault();
    setOpen(true);
  }, []);

  const handleRemove = async () => {
    if (!confirm(t("removeFromLibraryConfirm") ?? "Bu öğeyi kütüphaneden kaldırmak istediğinize emin misiniz?")) return;
    try {
      const res = await fetch(`/api/saved-sections?sectionId=${encodeURIComponent(sectionId)}`, { method: "DELETE" });
      if (res.ok) {
        onRemove();
        if (typeof window !== "undefined") window.dispatchEvent(new CustomEvent("playlist-updated"));
      }
    } catch {}
  };

  const items: StevenActionItem[] = [
    {
      id: "remove",
      icon: Trash2,
      label: t("removeFromLibrary"),
      destructive: true,
      onClick: handleRemove,
    },
  ];

  return (
    <div onContextMenu={handleContextMenu}>
      {children}
      <StevenActionMenu
        open={open}
        onClose={() => setOpen(false)}
        items={items}
        title={t("yourLibrary")}
        subtitle={sectionTitle}
      />
    </div>
  );
}
