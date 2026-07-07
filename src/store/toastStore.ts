import { create } from "zustand";

export type ToastType = "error" | "success" | "info" | "warning" | "badge";

export interface Toast {
  id: string;
  type: ToastType;
  message: string;
  duration?: number;
}

interface ToastState {
  toasts: Toast[];
  addToast: (type: ToastType, message: string, duration?: number) => void;
  removeToast: (id: string) => void;
}

let counter = 0;

export const useToastStore = create<ToastState>((set) => ({
  toasts: [],
  addToast: (type, message, duration = 4000) => {
    const id = `toast-${++counter}-${Date.now()}`;
    set((s) => ({ toasts: [...s.toasts.slice(-4), { id, type, message, duration }] }));
  },
  removeToast: (id) => {
    set((s) => ({ toasts: s.toasts.filter((t) => t.id !== id) }));
  },
}));

export function showErrorToast(message: string) {
  useToastStore.getState().addToast("error", message);
}

export function showSuccessToast(message: string) {
  useToastStore.getState().addToast("success", message);
}

export function showInfoToast(message: string) {
  useToastStore.getState().addToast("info", message);
}

export function showBadgeToast(badgeName: string) {
  useToastStore.getState().addToast("badge", badgeName, 6000);
}
