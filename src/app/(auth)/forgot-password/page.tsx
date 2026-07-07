"use client";

import { Suspense, useState } from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import { Mail, ArrowLeft, Loader2 } from "lucide-react";
import { AciusfyLandingWordmark } from "@/components/branding/AciusfyLandingWordmark";

function ForgotForm() {
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");
    setMessage("");
    try {
      const res = await fetch("/api/auth/forgot-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: email.trim() }),
      });
      const data = await res.json().catch(() => ({}));
      if (typeof data?.message === "string") {
        setMessage(data.message);
      } else if (typeof data?.error === "string") {
        setError(data.error);
      } else {
        setMessage("İsteğin alındı.");
      }
    } catch {
      setError("İstek gönderilemedi");
    } finally {
      setLoading(false);
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="w-full"
    >
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.1 }}
          className="mb-10 flex flex-col items-center gap-3"
        >
          <Link
            href="/"
            className="group rounded-md outline-offset-4 focus-visible:outline focus-visible:outline-2 focus-visible:outline-white/35"
            aria-label="Aciusfy"
          >
            <AciusfyLandingWordmark variant="auth" />
          </Link>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="premium-glass-card overflow-hidden rounded-3xl p-8 sm:p-10"
        >
          <div>
            <h1 className="mb-1 text-2xl font-bold text-white">Şifremi unuttum</h1>
            <p className="mb-6 text-sm text-white/35">
              Kayıtlı e-postana sıfırlama bağlantısı göndeririz (sunucuda e-posta ayarı varsa).
            </p>

            {message && (
              <div className="mb-5 rounded-2xl bg-emerald-500/10 px-4 py-3 ring-1 ring-emerald-500/20">
                <p className="text-sm text-emerald-400">{message}</p>
              </div>
            )}
            {error && (
              <div className="mb-5 rounded-2xl bg-red-500/10 px-4 py-3 ring-1 ring-red-500/20">
                <p className="text-sm text-red-400">{error}</p>
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-5">
              <div>
                <label className="mb-2 block text-xs font-medium uppercase tracking-wider text-white/30">
                  E-posta
                </label>
                <div className="group relative">
                  <Mail className="absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-white/20 transition-colors group-focus-within:text-purple-400" />
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="ornek@email.com"
                    required
                    className="w-full rounded-xl border-0 bg-white/[0.04] py-3.5 pl-11 pr-4 text-sm text-white ring-1 ring-white/[0.08] transition-all placeholder:text-white/20 focus:bg-white/[0.06] focus:outline-none focus:ring-purple-500/50"
                  />
                </div>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="flex w-full items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-purple-600 to-emerald-600 py-3.5 text-sm font-bold text-white shadow-[0_0_20px_rgba(168,85,247,0.25)] transition-shadow hover:shadow-[0_0_30px_rgba(168,85,247,0.4)] disabled:opacity-50"
              >
                {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : "Bağlantı gönder"}
              </button>
            </form>

            <p className="mt-5 text-center text-xs text-white/25">
              E-posta gelmezse yöneticiden yeni şifre isteyebilirsin.
            </p>

            <Link
              href="/login"
              className="mt-6 flex items-center justify-center gap-2 text-sm text-purple-400 transition-colors hover:text-purple-300"
            >
              <ArrowLeft className="h-4 w-4" />
              Girişe dön
            </Link>
          </div>
        </motion.div>
    </motion.div>
  );
}

export default function ForgotPasswordPage() {
  return (
    <Suspense
      fallback={
        <div className="flex justify-center py-16">
          <Loader2 className="h-6 w-6 animate-spin text-purple-400/50" />
        </div>
      }
    >
      <ForgotForm />
    </Suspense>
  );
}
