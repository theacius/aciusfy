"use client";

import { Suspense, useState, useEffect } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";
import { motion } from "framer-motion";
import { Lock, Eye, EyeOff, Loader2, ArrowRight } from "lucide-react";
import { AciusfyLandingWordmark } from "@/components/branding/AciusfyLandingWordmark";

function ResetForm() {
  const searchParams = useSearchParams();
  const token = searchParams.get("token") || "";
  const [password, setPassword] = useState("");
  const [password2, setPassword2] = useState("");
  const [show, setShow] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [done, setDone] = useState(false);

  useEffect(() => {
    if (!token) setError("Geçersiz veya eksik bağlantı. E-postadaki linki kullan veya yeni sıfırlama iste.");
  }, [token]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!token) return;
    if (password.length < 6) {
      setError("Şifre en az 6 karakter olmalı");
      return;
    }
    if (password !== password2) {
      setError("Şifreler eşleşmiyor");
      return;
    }
    setLoading(true);
    setError("");
    try {
      const res = await fetch("/api/auth/reset-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token, password }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        setError(typeof data?.error === "string" ? data.error : "İşlem başarısız");
        return;
      }
      setDone(true);
    } catch {
      setError("İstek gönderilemedi");
    } finally {
      setLoading(false);
    }
  };

  return (
    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="w-full">
        <div className="mb-10 flex flex-col items-center gap-3">
          <Link
            href="/"
            className="rounded-md outline-offset-4 focus-visible:outline focus-visible:outline-2 focus-visible:outline-white/35"
            aria-label="Aciusfy"
          >
            <AciusfyLandingWordmark variant="auth" />
          </Link>
        </div>

        <div className="premium-glass-card overflow-hidden rounded-3xl p-8 sm:p-10">
          <div>
            <h1 className="mb-1 text-2xl font-bold text-white">Yeni şifre</h1>
            <p className="mb-8 text-sm text-white/35">Hesabın için yeni bir şifre belirle</p>

            {done ? (
              <div className="space-y-4">
                <div className="rounded-2xl bg-emerald-500/10 px-4 py-3 ring-1 ring-emerald-500/20">
                  <p className="text-sm text-emerald-400">Şifren güncellendi. Giriş yapabilirsin.</p>
                </div>
                <Link
                  href="/login"
                  className="flex w-full items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-purple-600 to-emerald-600 py-3.5 text-sm font-bold text-white"
                >
                  Giriş yap
                  <ArrowRight className="h-4 w-4" />
                </Link>
              </div>
            ) : (
              <form onSubmit={handleSubmit} className="space-y-5">
                {error && (
                  <div className="rounded-2xl bg-red-500/10 px-4 py-3 ring-1 ring-red-500/20">
                    <p className="text-sm text-red-400">{error}</p>
                  </div>
                )}
                <div>
                  <label className="mb-2 block text-xs font-medium uppercase tracking-wider text-white/30">
                    Yeni şifre
                  </label>
                  <div className="group relative">
                    <Lock className="absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-white/20" />
                    <input
                      type={show ? "text" : "password"}
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder="En az 6 karakter"
                      required
                      minLength={6}
                      disabled={!token}
                      className="w-full rounded-xl border-0 bg-white/[0.04] py-3.5 pl-11 pr-12 text-sm text-white ring-1 ring-white/[0.08] focus:outline-none focus:ring-purple-500/50 disabled:opacity-50"
                    />
                    <button
                      type="button"
                      onClick={() => setShow(!show)}
                      className="absolute right-4 top-1/2 -translate-y-1/2 text-white/20 hover:text-white/60"
                    >
                      {show ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    </button>
                  </div>
                </div>
                <div>
                  <label className="mb-2 block text-xs font-medium uppercase tracking-wider text-white/30">
                    Şifre tekrar
                  </label>
                  <input
                    type={show ? "text" : "password"}
                    value={password2}
                    onChange={(e) => setPassword2(e.target.value)}
                    required
                    minLength={6}
                    disabled={!token}
                    className="w-full rounded-xl border-0 bg-white/[0.04] py-3.5 px-4 text-sm text-white ring-1 ring-white/[0.08] focus:outline-none focus:ring-purple-500/50 disabled:opacity-50"
                  />
                </div>
                <button
                  type="submit"
                  disabled={loading || !token}
                  className="flex w-full items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-purple-600 to-emerald-600 py-3.5 text-sm font-bold text-white disabled:opacity-50"
                >
                  {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : "Şifreyi kaydet"}
                </button>
              </form>
            )}

            <Link href="/login" className="mt-6 block text-center text-sm text-purple-400 hover:text-purple-300">
              Girişe dön
            </Link>
          </div>
        </div>
    </motion.div>
  );
}

export default function ResetPasswordPage() {
  return (
    <Suspense
      fallback={
        <div className="flex justify-center py-16">
          <Loader2 className="h-6 w-6 animate-spin text-purple-400/50" />
        </div>
      }
    >
      <ResetForm />
    </Suspense>
  );
}
