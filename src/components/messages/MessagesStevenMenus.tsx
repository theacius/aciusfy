"use client";

import { useMemo } from "react";
import {
  Bell,
  BellOff,
  Ban,
  UserCheck,
  ChevronLeft,
  Pin,
  Trash2,
  Mail,
} from "lucide-react";
import {
  StevenActionMenu,
  type StevenActionItem,
} from "@/components/navigation/StevenActionMenu";
import { AnimatedModal } from "@/components/ui/animated-modal";
import { StevenSelect } from "@/components/ui/StevenSelect";

const MUTE_DURATION_OPTIONS = [
  { label: "5 dakika", value: 5 },
  { label: "10 dakika", value: 10 },
  { label: "15 dakika", value: 15 },
  { label: "Ben açana kadar", value: "until_open" as const },
  { label: "Özel", value: "custom" as const },
];

type MuteUnit = { value: string; label: string; max: number | null };

type MenuUser = { id: string; name: string | null; blockedByMe?: boolean };

function buildMuteSubmenuItems(
  userId: string,
  onBack: () => void,
  onCustom: () => void,
  setMuted: (id: string, until: string | null | "until_open") => void,
  onClose: () => void,
): StevenActionItem[] {
  const closeAll = () => onClose();
  return [
    {
      id: "back",
      label: "Geri",
      icon: ChevronLeft,
      onClick: onBack,
    },
    { id: "div-mute", label: "", divider: true },
    ...MUTE_DURATION_OPTIONS.map((opt) => ({
      id: `mute-${opt.value}`,
      label: opt.label,
      onClick: () => {
        if (opt.value === "custom") {
          onCustom();
        } else if (opt.value === "until_open") {
          setMuted(userId, "until_open");
        } else if (typeof opt.value === "number") {
          setMuted(userId, new Date(Date.now() + opt.value * 60000).toISOString());
        }
        closeAll();
      },
    })),
  ];
}

function buildBlockItems(
  user: MenuUser,
  blockLoading: boolean,
  onBlock: (id: string) => void,
  onUnblock: (id: string) => void,
  onClose: () => void,
): StevenActionItem[] {
  if (user.blockedByMe) {
    return [
      {
        id: "unblock",
        label: "Engeli aç",
        icon: UserCheck,
        onClick: () => {
          onUnblock(user.id);
          onClose();
        },
      },
    ];
  }
  return [
    {
      id: "block",
      label: "Engelle",
      icon: Ban,
      destructive: true,
      onClick: () => {
        onBlock(user.id);
        onClose();
      },
    },
  ];
}

export type MessagesStevenMenusProps = {
  chatMenuOpen: boolean;
  onChatMenuClose: () => void;
  chatMuteSubmenu: boolean;
  onChatMuteSubmenu: (open: boolean) => void;
  selectedUser: MenuUser | null;

  listMenuUserId: string | null;
  listMenuUser: MenuUser | null;
  onListMenuClose: () => void;
  listMuteSubmenu: boolean;
  onListMuteSubmenu: (open: boolean) => void;
  isPinned: (id: string) => boolean;

  isMuted: (id: string) => boolean;
  setMuted: (id: string, until: string | null | "until_open") => void;
  onOpenCustomMute: (userId: string) => void;
  blockLoading: boolean;
  listActionLoading: boolean;
  onBlock: (id: string) => void;
  onUnblock: (id: string) => void;
  onDeleteConversation: (id: string) => void;
  onTogglePin: (id: string) => void;
  onMarkUnread: (id: string) => void;

  customMuteUserId: string | null;
  onCustomMuteClose: () => void;
  customMuteValue: number;
  onCustomMuteValueChange: (v: number) => void;
  customMuteUnit: string;
  onCustomMuteUnitChange: (v: string) => void;
  onCustomMuteApply: () => void;
  customMuteUnits: readonly MuteUnit[];
};

export function MessagesStevenMenus(props: MessagesStevenMenusProps) {
  const {
    chatMenuOpen,
    onChatMenuClose,
    chatMuteSubmenu,
    onChatMuteSubmenu,
    selectedUser,
    listMenuUserId,
    listMenuUser,
    onListMenuClose,
    listMuteSubmenu,
    onListMuteSubmenu,
    isPinned,
    isMuted,
    setMuted,
    onOpenCustomMute,
    blockLoading,
    listActionLoading,
    onBlock,
    onUnblock,
    onDeleteConversation,
    onTogglePin,
    onMarkUnread,
    customMuteUserId,
    onCustomMuteClose,
    customMuteValue,
    onCustomMuteValueChange,
    customMuteUnit,
    onCustomMuteUnitChange,
    onCustomMuteApply,
    customMuteUnits,
  } = props;

  const closeChatMenu = () => {
    onChatMenuClose();
    onChatMuteSubmenu(false);
  };

  const closeListMenu = () => {
    onListMenuClose();
    onListMuteSubmenu(false);
  };

  const chatHeaderItems = useMemo((): StevenActionItem[] => {
    if (!selectedUser) return [];
    const uid = selectedUser.id;

    if (chatMuteSubmenu) {
      return buildMuteSubmenuItems(
        uid,
        () => onChatMuteSubmenu(false),
        () => {
          onOpenCustomMute(uid);
          closeChatMenu();
        },
        setMuted,
        closeChatMenu,
      );
    }

    const items: StevenActionItem[] = [];

    if (isMuted(uid)) {
      items.push({
        id: "unmute",
        label: "Bildirim sesini aç",
        icon: Bell,
        onClick: () => {
          setMuted(uid, null);
          closeChatMenu();
        },
      });
    } else {
      items.push({
        id: "mute",
        label: "Bildirimi sessize al",
        icon: BellOff,
        onClick: () => onChatMuteSubmenu(true),
      });
    }

    items.push({ id: "div-block", label: "", divider: true });
    items.push(
      ...buildBlockItems(selectedUser, blockLoading, onBlock, onUnblock, closeChatMenu),
    );

    return items;
  }, [
    selectedUser,
    chatMuteSubmenu,
    isMuted,
    setMuted,
    blockLoading,
    onBlock,
    onUnblock,
    onChatMuteSubmenu,
    onOpenCustomMute,
  ]);

  const listMenuItems = useMemo((): StevenActionItem[] => {
    if (!listMenuUser || !listMenuUserId) return [];
    const uid = listMenuUser.id;

    if (listMuteSubmenu) {
      return buildMuteSubmenuItems(
        uid,
        () => onListMuteSubmenu(false),
        () => {
          onOpenCustomMute(uid);
          closeListMenu();
        },
        setMuted,
        closeListMenu,
      );
    }

    const items: StevenActionItem[] = [
      {
        id: "pin",
        label: isPinned(uid) ? "Sabitlemeyi kaldır" : "Üste sabitle",
        icon: Pin,
        onClick: () => {
          onTogglePin(uid);
          closeListMenu();
        },
      },
      {
        id: "unread",
        label: "Okunmadı olarak işaretle",
        icon: Mail,
        onClick: () => {
          onMarkUnread(uid);
          closeListMenu();
        },
      },
      { id: "div-mute", label: "", divider: true },
    ];

    if (isMuted(uid)) {
      items.push({
        id: "unmute",
        label: "Bildirim sesini aç",
        icon: Bell,
        onClick: () => {
          setMuted(uid, null);
          closeListMenu();
        },
      });
    } else {
      items.push({
        id: "mute",
        label: "Bildirimi sessize al",
        icon: BellOff,
        onClick: () => onListMuteSubmenu(true),
      });
    }

    items.push({ id: "div-actions", label: "", divider: true });
    items.push({
      id: "delete",
      label: "Sil",
      icon: Trash2,
      destructive: true,
      onClick: () => {
        onDeleteConversation(uid);
        closeListMenu();
      },
    });
    items.push(
      ...buildBlockItems(listMenuUser, blockLoading, onBlock, onUnblock, closeListMenu),
    );

    return items;
  }, [
    listMenuUser,
    listMenuUserId,
    listMuteSubmenu,
    isPinned,
    isMuted,
    setMuted,
    blockLoading,
    onTogglePin,
    onMarkUnread,
    onDeleteConversation,
    onBlock,
    onUnblock,
    onListMuteSubmenu,
    onOpenCustomMute,
  ]);

  const unitInfo = customMuteUnits.find((u) => u.value === customMuteUnit);

  return (
    <>
      <StevenActionMenu
        open={chatMenuOpen && !!selectedUser}
        onClose={closeChatMenu}
        items={chatHeaderItems}
        title="Sohbet"
        subtitle={selectedUser?.name ?? undefined}
        closeLabel="Kapat"
      />

      <StevenActionMenu
        open={!!listMenuUserId && !!listMenuUser}
        onClose={closeListMenu}
        items={listMenuItems}
        title="Sohbet"
        subtitle={listMenuUser?.name ?? undefined}
        closeLabel="Kapat"
      />

      <AnimatedModal
        isOpen={!!customMuteUserId}
        onClose={onCustomMuteClose}
        title="Özel sessize alma"
        className="max-w-sm"
      >
        <div className="space-y-4 p-6 pt-2">
          <div className="flex gap-2">
            <input
              type="number"
              min={1}
              max={unitInfo?.max ?? undefined}
              value={customMuteValue}
              onChange={(e) => {
                let v = parseInt(e.target.value, 10) || 1;
                if (unitInfo?.max != null && v > unitInfo.max) v = unitInfo.max;
                onCustomMuteValueChange(v);
              }}
              className="w-24 rounded-full border border-white/[0.08] bg-white/[0.04] px-4 py-2.5 text-sm text-white focus:border-white/20 focus:outline-none"
            />
            <StevenSelect
              value={customMuteUnit}
              onChange={(e) => onCustomMuteUnitChange(e.target.value)}
              className="flex-1"
            >
              {customMuteUnits.map((u) => (
                <option key={u.value} value={u.value}>
                  {u.label}
                </option>
              ))}
            </StevenSelect>
          </div>
          <div className="flex justify-end gap-2">
            <button
              type="button"
              onClick={onCustomMuteClose}
              className="rounded-full px-4 py-2 text-sm text-white/50 transition-colors hover:bg-white/[0.06] hover:text-white"
            >
              İptal
            </button>
            <button
              type="button"
              onClick={onCustomMuteApply}
              className="rounded-full bg-white px-4 py-2 text-sm font-medium text-[#09090b] transition-opacity hover:opacity-90"
            >
              Uygula
            </button>
          </div>
        </div>
      </AnimatedModal>
    </>
  );
}
