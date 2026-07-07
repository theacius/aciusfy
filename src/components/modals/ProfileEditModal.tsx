"use client";

import { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import Link from "next/link";
import { AnimatedModal } from "@/components/ui/animated-modal";
import { Loader2, Settings } from "lucide-react";

interface ProfileEditModalProps {
  isOpen: boolean;
  onClose: () => void;
  initialData?: { email: string };
  onSuccess?: () => void;
}

export function ProfileEditModal({
  isOpen,
  onClose,
  initialData,
  onSuccess,
}: ProfileEditModalProps) {
  const { data: session, update: updateSession } = useSession();
  const [email, setEmail] = useState("");
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  useEffect(() => {
    if (isOpen) {
      setEmail(initialData?.email ?? session?.user?.email ?? "");
      setCurrentPassword("");
      setNewPassword("");
      setConfirmPassword("");
      setError(null);
      setSuccess(false);
    }
  }, [isOpen, initialData?.email, session?.user?.email]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (newPassword && newPassword !== confirmPassword) {
      setError("Yeni şifreler eşleşmiyor");
      return;
    }

    if (newPassword && newPassword.length < 6) {
      setError("Yeni şifre en az 6 karakter olmalı");
      return;
    }

    if (newPassword && !currentPassword) {
      setError("Yeni şifre için mevcut şifrenizi girin");
      return;
    }

    setSaving(true);
    try {
      const body: Record<string, string> = { email: email.trim() };
      if (newPassword && currentPassword) {
        body.currentPassword = currentPassword;
        body.newPassword = newPassword;
      }

      const res = await fetch("/api/profile", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.error ?? "Bir hata oluştu");
        return;
      }

      setSuccess(true);
      await updateSession({ user: { email: data.email } });
      onSuccess?.();
      setTimeout(() => {
        onClose();
      }, 800);
    } catch {
      setError("Bir hata oluştu");
    } finally {
      setSaving(false);
    }
  };

  return (
    <AnimatedModal isOpen={isOpen} onClose={onClose} className="max-w-md">
      <form onSubmit={handleSubmit} className="p-6 pt-12">
        <h2 className="text-xl font-bold text-white">Oturum açma seçenekleri</h2>
        <p className="mt-1 text-sm text-muted">E-posta ve şifrenizi güncelleyebilirsiniz</p>

        <div className="mt-6 space-y-4">
          <div>
            <label htmlFor="profile-email" className="block text-sm font-medium text-white">
              E-posta
            </label>
            <input
              id="profile-email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="ornek@email.com"
              required
              className="mt-1 w-full rounded-lg border border-white/10 bg-white/5 px-4 py-2.5 text-white placeholder:text-muted focus:border-green-500 focus:outline-none"
            />
          </div>

          <div className="border-t border-white/10 pt-4">
            <p className="text-sm font-medium text-white">Şifre değiştir</p>
            <p className="text-xs text-muted">Değiştirmek istemiyorsanız boş bırakın</p>

            <div className="mt-3 space-y-3">
              <input
                type="password"
                value={currentPassword}
                onChange={(e) => setCurrentPassword(e.target.value)}
                placeholder="Mevcut şifre"
                className="w-full rounded-lg border border-white/10 bg-white/5 px-4 py-2.5 text-white placeholder:text-muted focus:border-green-500 focus:outline-none"
              />
              <input
                type="password"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                placeholder="Yeni şifre"
                className="w-full rounded-lg border border-white/10 bg-white/5 px-4 py-2.5 text-white placeholder:text-muted focus:border-green-500 focus:outline-none"
              />
              <input
                type="password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                placeholder="Yeni şifre (tekrar)"
                className="w-full rounded-lg border border-white/10 bg-white/5 px-4 py-2.5 text-white placeholder:text-muted focus:border-green-500 focus:outline-none"
              />
            </div>
          </div>

          {error && (
            <p className="text-sm text-red-400">{error}</p>
          )}

          {success && (
            <p className="text-sm text-green-400">Profil güncellendi</p>
          )}
        </div>

        <div className="mt-6 flex gap-3">
          <button
            type="button"
            onClick={onClose}
            className="flex-1 rounded-full border border-white/20 px-4 py-2.5 text-sm font-medium text-white transition-colors hover:border-white/40 hover:bg-white/5"
          >
            İptal
          </button>
          <button
            type="submit"
            disabled={saving}
            className="flex flex-1 items-center justify-center gap-2 rounded-full bg-green-500 px-4 py-2.5 text-sm font-medium text-white transition-colors hover:bg-green-600 disabled:opacity-60"
          >
            {saving ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                Kaydediliyor...
              </>
            ) : (
              "Kaydet"
            )}
          </button>
        </div>
        <Link
          href="/settings"
          onClick={onClose}
          className="mt-4 flex items-center justify-center gap-2 text-sm text-muted transition-colors hover:text-white"
        >
          <Settings className="h-4 w-4" />
          Tüm ayarlar
        </Link>
      </form>
    </AnimatedModal>
  );
}
