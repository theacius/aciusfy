import { create } from "zustand";

const MUTE_STORAGE_KEY = "aciusfy-muted-convos";

export interface MessageNotification {
  id: string;
  senderId: string;
  senderName: string | null;
  senderAvatar: string | null;
  senderUsername: string | null;
  content: string;
  createdAt: string;
}

interface NotificationState {
  notifications: MessageNotification[];
  mutedUntil: Record<string, string | "until_open">;
  addNotification: (n: MessageNotification) => void;
  removeNotification: (id: string) => void;
  setMuted: (userId: string, until: string | "until_open" | null) => void;
  isMuted: (userId: string) => boolean;
  markOpened: (userId: string) => void;
  hydrateMuted: () => void;
}

function loadMuted(): Record<string, string | "until_open"> {
  if (typeof window === "undefined") return {};
  try {
    const raw = localStorage.getItem(MUTE_STORAGE_KEY);
    if (!raw) return {};
    const parsed = JSON.parse(raw) as Record<string, string>;
    const result: Record<string, string | "until_open"> = {};
    const now = Date.now();
    for (const [uid, v] of Object.entries(parsed)) {
      if (v === "until_open") result[uid] = "until_open";
      else if (v && new Date(v).getTime() > now) result[uid] = v;
    }
    return result;
  } catch {
    return {};
  }
}

function saveMuted(m: Record<string, string | "until_open">) {
  if (typeof window === "undefined") return;
  try {
    localStorage.setItem(MUTE_STORAGE_KEY, JSON.stringify(m));
  } catch {}
}

export const useNotificationStore = create<NotificationState>((set, get) => ({
  notifications: [],
  mutedUntil: typeof window !== "undefined" ? loadMuted() : {},

  addNotification: (n) => {
    if (get().isMuted(n.senderId)) return;
    set((s) => ({
      notifications: [...s.notifications.filter((x) => x.id !== n.id), n].slice(-5),
    }));
  },

  removeNotification: (id) => {
    set((s) => ({ notifications: s.notifications.filter((x) => x.id !== id) }));
  },

  setMuted: (userId, until) => {
    set((s) => {
      const next = { ...s.mutedUntil };
      if (!until) delete next[userId];
      else next[userId] = until;
      saveMuted(next);
      return { mutedUntil: next };
    });
  },

  isMuted: (userId) => {
    const m = get().mutedUntil[userId];
    if (!m) return false;
    if (m === "until_open") return true;
    return new Date(m).getTime() > Date.now();
  },

  markOpened: (userId) => {
    set((s) => {
      if (s.mutedUntil[userId] !== "until_open") return s;
      const next = { ...s.mutedUntil };
      delete next[userId];
      saveMuted(next);
      return { mutedUntil: next };
    });
  },

  hydrateMuted: () => {
    if (typeof window === "undefined") return;
    const loaded = loadMuted();
    set((s) => {
      if (Object.keys(loaded).length === 0 && Object.keys(s.mutedUntil).length === 0) return s;
      return { mutedUntil: loaded };
    });
  },
}));
