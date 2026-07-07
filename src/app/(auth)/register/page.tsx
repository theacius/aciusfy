"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { motion } from "framer-motion";
import { Mail, Lock, User, Eye, EyeOff, ArrowRight, Loader2 } from "lucide-react";
import { AciusfyLandingWordmark } from "@/components/branding/AciusfyLandingWordmark";

export default function RegisterPage() {
  const router = useRouter();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    try {
      const res = await fetch("/api/auth/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, email, password }),
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.error || "Bir hata oluştu");
        return;
      }

      router.push("/login?registered=true");
    } catch {
      setError("Bir hata oluştu");
    } finally {
      setLoading(false);
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
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
            <h1 className="mb-1 text-2xl font-bold text-white">Hesap oluştur</h1>
            <p className="mb-8 text-sm text-white/35">Müzik dünyasına katıl, keşfetmeye başla</p>

            {error && (
              <motion.div
                initial={{ opacity: 0, y: -5 }}
                animate={{ opacity: 1, y: 0 }}
                className="mb-5 rounded-2xl bg-red-500/10 px-4 py-3 ring-1 ring-red-500/20"
              >
                <p className="text-sm text-red-400">{error}</p>
              </motion.div>
            )}

            <form onSubmit={handleSubmit} className="space-y-5">
              <div>
                <label className="mb-2 block text-xs font-medium uppercase tracking-wider text-white/30">
                  İsim
                </label>
                <div className="group relative">
                  <User className="absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-white/20 transition-colors group-focus-within:text-white/50" />
                  <input
                    type="text"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="Adınız"
                    required
                    className="w-full rounded-xl border-0 bg-white/[0.04] py-3.5 pl-11 pr-4 text-sm text-white ring-1 ring-white/[0.08] transition-all placeholder:text-white/20 focus:bg-white/[0.06] focus:outline-none focus:ring-white/20"
                  />
                </div>
              </div>

              <div>
                <label className="mb-2 block text-xs font-medium uppercase tracking-wider text-white/30">
                  Email
                </label>
                <div className="group relative">
                  <Mail className="absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-white/20 transition-colors group-focus-within:text-white/50" />
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="ornek@email.com"
                    required
                    className="w-full rounded-xl border-0 bg-white/[0.04] py-3.5 pl-11 pr-4 text-sm text-white ring-1 ring-white/[0.08] transition-all placeholder:text-white/20 focus:bg-white/[0.06] focus:outline-none focus:ring-white/20"
                  />
                </div>
              </div>

              <div>
                <label className="mb-2 block text-xs font-medium uppercase tracking-wider text-white/30">
                  Şifre
                </label>
                <div className="group relative">
                  <Lock className="absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-white/20 transition-colors group-focus-within:text-white/50" />
                  <input
                    type={showPassword ? "text" : "password"}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="En az 6 karakter"
                    required
                    minLength={6}
                    className="w-full rounded-xl border-0 bg-white/[0.04] py-3.5 pl-11 pr-12 text-sm text-white ring-1 ring-white/[0.08] transition-all placeholder:text-white/20 focus:bg-white/[0.06] focus:outline-none focus:ring-white/20"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-4 top-1/2 -translate-y-1/2 text-white/20 transition-colors hover:text-white/60"
                  >
                    {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>
              </div>

              <motion.button
                whileHover={{ scale: 1.01 }}
                whileTap={{ scale: 0.98 }}
                type="submit"
                disabled={loading}
                className="group flex w-full items-center justify-center gap-2 rounded-full bg-white py-3.5 text-sm font-semibold text-[#09090b] transition-opacity hover:opacity-90 disabled:opacity-50"
              >
                {loading ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <>
                    Kayıt Ol
                    <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5" />
                  </>
                )}
              </motion.button>
            </form>

            <div className="mt-8 flex items-center gap-3">
              <div className="h-px flex-1 bg-white/[0.06]" />
              <span className="text-xs text-white/20">veya</span>
              <div className="h-px flex-1 bg-white/[0.06]" />
            </div>

            <p className="mt-6 text-center text-sm text-white/30">
              Zaten hesabın var mı?{" "}
              <Link href="/login" className="font-semibold text-white/70 transition-colors hover:text-white">
                Giriş Yap
              </Link>
            </p>
          </div>
        </motion.div>

        
        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.4 }}
          className="mt-8 text-center text-[11px] text-white/15"
        >
          Kayıt olarak Kullanım Koşullarını kabul etmiş olursun.
        </motion.p>
    </motion.div>
  );
}
