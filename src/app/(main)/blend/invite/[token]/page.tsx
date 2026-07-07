"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import { motion } from "framer-motion";
import Image from "next/image";
import { useTranslation } from "@/hooks/useTranslation";
import { useUserProfile } from "@/components/providers/UserProfileProvider";
import { proxiedImageUrl } from "@/lib/media-proxy-url";
import { Loader2, Music2, Sparkles, AlertCircle } from "lucide-react";
import Link from "next/link";

interface Inviter {
  id: string;
  name: string | null;
  avatar: string | null;
  username: string | null;
}

export default function BlendInviteLinkPage() {
  const { t } = useTranslation();
  const { token } = useParams<{ token: string }>();
  const { data: session, status: authStatus } = useSession();
  const router = useRouter();
  const profile = useUserProfile();

  const [inviter, setInviter] = useState<Inviter | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [accepting, setAccepting] = useState(false);

  const myAvatar = profile?.avatar || session?.user?.image || null;
  const myName = profile?.name || session?.user?.name || "User";

  useEffect(() => {
    if (!token) return;
    fetch(`/api/blend/invite/${token}`)
      .then((r) => r.json())
      .then((d) => {
        if (d.inviter) setInviter(d.inviter);
        else setError(d.error || "Invalid link");
      })
      .catch(() => setError("Connection error"))
      .finally(() => setLoading(false));
  }, [token]);

  const isSelf = inviter?.id === session?.user?.id;

  const handleAccept = async () => {
    if (!session?.user?.id) {
      router.push(`/login?callbackUrl=/blend/invite/${token}`);
      return;
    }
    setAccepting(true);
    try {
      const res = await fetch(`/api/blend/invite/${token}`, { method: "POST" });
      const data = await res.json();
      if (data.blendId) {
        router.push(`/blend/${data.blendId}`);
      } else {
        setError(data.error || "Error");
      }
    } catch {
      setError("Connection error");
    }
    setAccepting(false);
  };

  if (loading) {
    return (
      <div className="flex min-h-[60vh] flex-col items-center justify-center gap-4">
        <motion.div
          animate={{ rotate: 360 }}
          transition={{ duration: 1.2, repeat: Infinity, ease: "linear" }}
          className="h-10 w-10 rounded-full border-[3px] border-white/5 border-t-purple-500"
        />
        <p className="text-sm text-white/20">Yükleniyor</p>
      </div>
    );
  }

  if (error || !inviter) {
    return (
      <div className="flex min-h-[60vh] flex-col items-center justify-center gap-5 px-4">
        <div className="flex h-16 w-16 items-center justify-center rounded-full bg-red-500/10 ring-1 ring-red-500/20">
          <AlertCircle className="h-8 w-8 text-red-400/60" />
        </div>
        <div className="text-center">
          <p className="text-base font-semibold text-white/60">{error || "Geçersiz davet bağlantısı"}</p>
          <p className="mt-1 text-sm text-white/25">Bu davet linki geçerli değil veya süresi dolmuş olabilir</p>
        </div>
        <Link
          href="/blend"
          className="rounded-full bg-white/5 px-6 py-2.5 text-sm font-medium text-white/60 ring-1 ring-white/10 transition-all hover:bg-white/10"
        >
          Blend sayfasına dön
        </Link>
      </div>
    );
  }

  return (
    <div className="-mx-3 -my-3 flex min-h-[calc(100dvh-var(--navbar-height)-var(--main-content-bottom-padding))] flex-col items-center justify-center overflow-hidden bg-gradient-to-b from-[#1a0533] via-[#121212] to-[#121212] sm:-mx-6 sm:-my-4">
      
      <div className="pointer-events-none absolute inset-0 overflow-hidden">
        <motion.div
          animate={{ x: [0, 40, -30, 0], y: [0, -50, 25, 0], scale: [1, 1.3, 0.8, 1] }}
          transition={{ duration: 18, repeat: Infinity, ease: "easeInOut" }}
          className="absolute -left-24 top-1/4 h-80 w-80 rounded-full bg-purple-600/20 blur-[120px]"
        />
        <motion.div
          animate={{ x: [0, -35, 25, 0], y: [0, 40, -35, 0], scale: [1, 0.85, 1.15, 1] }}
          transition={{ duration: 22, repeat: Infinity, ease: "easeInOut" }}
          className="absolute -right-24 top-1/3 h-72 w-72 rounded-full bg-emerald-500/15 blur-[120px]"
        />
      </div>

      
      <motion.div
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
        className="relative z-10 mb-8 inline-flex items-center gap-2 rounded-full bg-white/5 px-4 py-1.5 text-xs font-medium text-purple-300 ring-1 ring-white/10 backdrop-blur-sm"
      >
        <Sparkles className="h-3.5 w-3.5" />
        Blend Daveti
      </motion.div>

      
      <motion.div
        initial={{ opacity: 0, scale: 0.8 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
        className="relative z-10 mb-10 flex items-center"
      >
        
        <div className="group relative">
          <div className="absolute -inset-1.5 rounded-full bg-gradient-to-r from-emerald-500 to-teal-500 opacity-50 blur-md transition-opacity group-hover:opacity-80" />
          <div className="relative h-28 w-28 overflow-hidden rounded-full ring-4 ring-[#121212] md:h-36 md:w-36">
            {inviter.avatar ? (
              <Image
                src={proxiedImageUrl(inviter.avatar) || "/images/placeholder-song.svg"}
                alt={inviter.name || "User"}
                fill
                sizes="144px"
                className="object-cover"
                priority
              />
            ) : (
              <div className="flex h-full w-full items-center justify-center bg-gradient-to-br from-emerald-600 to-teal-500 text-4xl font-black text-white">
                {(inviter.name || "U")[0]?.toUpperCase()}
              </div>
            )}
          </div>
        </div>

        
        <motion.div
          animate={{ rotate: [0, 360] }}
          transition={{ duration: 8, repeat: Infinity, ease: "linear" }}
          className="z-10 -mx-4 flex h-12 w-12 items-center justify-center rounded-full bg-card ring-2 ring-border"
        >
          <Sparkles className="h-5 w-5 text-purple-400" />
        </motion.div>

        
        <div className="group relative">
          <div className="absolute -inset-1.5 rounded-full bg-gradient-to-r from-purple-500 to-pink-500 opacity-50 blur-md transition-opacity group-hover:opacity-80" />
          <div className="relative h-28 w-28 overflow-hidden rounded-full ring-4 ring-[#121212] md:h-36 md:w-36">
            {session?.user && myAvatar ? (
              <Image
                src={proxiedImageUrl(myAvatar) || "/images/placeholder-song.svg"}
                alt={myName}
                fill
                sizes="144px"
                className="object-cover"
              />
            ) : session?.user ? (
              <div className="flex h-full w-full items-center justify-center bg-gradient-to-br from-purple-600 to-pink-500 text-4xl font-black text-white">
                {myName[0]?.toUpperCase()}
              </div>
            ) : (
              <div className="flex h-full w-full items-center justify-center border-2 border-dashed border-white/20 bg-white/5 text-4xl font-black text-white/20">
                ?
              </div>
            )}
          </div>
        </div>
      </motion.div>

      
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2, duration: 0.5 }}
        className="relative z-10 mb-10 text-center"
      >
        <h1 className="mb-2 text-2xl font-extrabold tracking-tight text-white md:text-3xl">
          {inviter.name || "User"} {t("blendInvitedYou")}
        </h1>
        <p className="mx-auto max-w-sm text-sm leading-relaxed text-white/35 md:text-base">
          {t("blendInviteLinkDesc")}
        </p>
      </motion.div>

      
      <motion.div
        initial={{ opacity: 0, y: 15 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.35, duration: 0.4 }}
        className="relative z-10"
      >
        {isSelf ? (
          <div className="flex flex-col items-center gap-3 rounded-2xl bg-yellow-500/10 px-8 py-5 ring-1 ring-yellow-500/15">
            <p className="text-sm font-medium text-yellow-400">{t("blendCannotSelf")}</p>
          </div>
        ) : authStatus === "unauthenticated" ? (
          <Link
            href={`/login?callbackUrl=/blend/invite/${token}`}
            className="inline-flex items-center gap-2 rounded-full bg-white px-8 py-3.5 text-sm font-bold text-black transition-all hover:bg-white/90 hover:shadow-[0_0_30px_rgba(255,255,255,0.2)]"
          >
            {t("blendLoginToAccept")}
          </Link>
        ) : (
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={handleAccept}
            disabled={accepting}
            className="inline-flex items-center gap-2 rounded-full bg-gradient-to-r from-emerald-500 to-green-500 px-10 py-4 text-sm font-bold text-white shadow-[0_0_30px_rgba(16,185,129,0.3)] transition-shadow hover:shadow-[0_0_50px_rgba(16,185,129,0.5)] disabled:opacity-50"
          >
            {accepting ? (
              <Loader2 className="h-5 w-5 animate-spin" />
            ) : (
              <>
                <Sparkles className="h-4 w-4" />
                {t("blendAcceptInvite")}
              </>
            )}
          </motion.button>
        )}
      </motion.div>
    </div>
  );
}
