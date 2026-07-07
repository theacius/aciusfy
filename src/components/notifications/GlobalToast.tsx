"use client";

import { useToastStore, type Toast } from "@/store/toastStore";
import { motion, AnimatePresence } from "framer-motion";
import { X, AlertCircle, CheckCircle, Info, AlertTriangle, Award } from "lucide-react";
import { useEffect } from "react";

const ICONS = {
  error: AlertCircle,
  success: CheckCircle,
  info: Info,
  warning: AlertTriangle,
  badge: Award,
} as const;

const COLORS = {
  error: "bg-red-500/90 text-white",
  success: "bg-emerald-500/90 text-white",
  info: "bg-blue-500/90 text-white",
  warning: "bg-amber-500/90 text-white",
  badge: "bg-gradient-to-r from-yellow-500/90 to-amber-600/90 text-white",
} as const;

function ToastItem({ toast }: { toast: Toast }) {
  const removeToast = useToastStore((s) => s.removeToast);
  const Icon = ICONS[toast.type];
  const isBadge = toast.type === "badge";

  useEffect(() => {
    const t = setTimeout(() => removeToast(toast.id), toast.duration ?? 4000);
    return () => clearTimeout(t);
  }, [toast.id, toast.duration, removeToast]);

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 30, scale: 0.95 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      exit={{ opacity: 0, y: 30, scale: 0.95 }}
      transition={{ type: "spring", damping: 25, stiffness: 350 }}
      className={`pointer-events-auto flex items-center gap-2.5 rounded-lg px-4 py-3 shadow-lg backdrop-blur-sm ${COLORS[toast.type]}`}
    >
      <Icon className={`h-5 w-5 flex-shrink-0 ${isBadge ? "animate-bounce" : ""}`} />
      <p className="min-w-0 flex-1 text-sm font-medium">
        {isBadge ? `🏆 Yeni Rozet: ${toast.message}` : toast.message}
      </p>
      <button
        type="button"
        onClick={() => removeToast(toast.id)}
        className="flex-shrink-0 rounded p-0.5 transition-colors hover:bg-white/20"
      >
        <X className="h-4 w-4" />
      </button>
    </motion.div>
  );
}

export function GlobalToast() {
  const toasts = useToastStore((s) => s.toasts);

  return (
    <div className="pointer-events-none fixed bottom-[calc(var(--main-content-bottom-padding,5rem)+0.75rem)] left-1/2 z-[9999] flex w-full max-w-sm -translate-x-1/2 flex-col gap-2 px-3 lg:px-0">
      <AnimatePresence mode="popLayout">
        {toasts.map((t) => (
          <ToastItem key={t.id} toast={t} />
        ))}
      </AnimatePresence>
    </div>
  );
}
