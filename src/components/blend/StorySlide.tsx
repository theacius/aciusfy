"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { motion } from "framer-motion";
import Image from "next/image";
import { proxiedImageUrl } from "@/lib/media-proxy-url";

const fadeUp = {
  hidden: { opacity: 0, y: 20, scale: 0.95 },
  visible: { opacity: 1, y: 0, scale: 1 },
  exit: { opacity: 0, y: -20, scale: 0.95 },
};

const stagger = {
  visible: { transition: { staggerChildren: 0.15 } },
};

const letterVariants = {
  hidden: { opacity: 0, y: 10 },
  visible: { opacity: 1, y: 0 },
};

function AnimatedText({ text, className }: { text: string; className?: string }) {
  return (
    <motion.div className={className} variants={stagger} initial="hidden" animate="visible">
      {text.split("").map((char, i) => (
        <motion.span key={i} variants={letterVariants} transition={{ duration: 0.04, delay: i * 0.03 }}>
          {char === " " ? "\u00A0" : char}
        </motion.span>
      ))}
    </motion.div>
  );
}

interface ArtistInfo {
  id: string;
  name: string;
  profileImage: string | null;
}

export function MatchSlide(
  { user1, user2, matchPct }: { user1: string; user2: string; matchPct: number }
) {
  return (
    <motion.div
      variants={fadeUp}
      initial="hidden"
      animate="visible"
      exit="exit"
      transition={{ duration: 0.8, ease: [0.22, 1, 0.36, 1] }}
      className="flex flex-col items-center justify-center gap-6 text-center"
    >
      <AnimatedText
        text="Müzik Ruhunuz Bir"
        className="text-5xl font-black tracking-tight text-white drop-shadow-[0_0_40px_rgba(139,92,246,0.5)] md:text-7xl"
      />
      <motion.p
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.6, duration: 0.5 }}
        className="text-lg font-medium text-white/60 md:text-xl"
      >
        {user1} + {user2}
      </motion.p>
      <motion.div
        initial={{ scale: 0, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ delay: 0.8, type: "spring", stiffness: 200, damping: 15 }}
        className="flex h-32 w-32 items-center justify-center rounded-full bg-white/10 ring-2 ring-white/20 backdrop-blur-sm md:h-40 md:w-40"
      >
        <span className="text-4xl font-black text-white drop-shadow-[0_0_20px_rgba(255,255,255,0.4)] md:text-5xl">
          %{matchPct}
        </span>
      </motion.div>
    </motion.div>
  );
}

export function CompatibilitySlide({ label, matchPct }: { label: string; matchPct: number }) {
  return (
    <motion.div
      variants={fadeUp}
      initial="hidden"
      animate="visible"
      exit="exit"
      transition={{ duration: 0.8, ease: [0.22, 1, 0.36, 1] }}
      className="flex flex-col items-center justify-center gap-6 text-center"
    >
      <AnimatedText
        text={label}
        className="text-3xl font-bold text-white/80 md:text-4xl"
      />
      <CountUp target={matchPct} />
    </motion.div>
  );
}

function CountUp({ target }: { target: number }) {
  return (
    <motion.div className="relative">
      <motion.span
        className="text-8xl font-black text-white drop-shadow-[0_0_60px_rgba(34,197,94,0.5)] md:text-9xl"
        initial={{ opacity: 0, scale: 0.5 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.6, type: "spring", stiffness: 150 }}
      >
        <CountUpNumber target={target} />
      </motion.span>
      <motion.span
        className="absolute -right-8 top-2 text-3xl font-bold text-green-400 md:-right-10 md:text-4xl"
        initial={{ opacity: 0, x: -10 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ delay: 1.5, duration: 0.4 }}
      >
        %
      </motion.span>
    </motion.div>
  );
}

function CountUpNumber({ target }: { target: number }) {
  const [value, setValue] = useState(0);

  useEffect(() => {
    let frame: number;
    const duration = 1500;
    const start = performance.now();

    const animate = (now: number) => {
      const elapsed = now - start;
      const progress = Math.min(elapsed / duration, 1);
      const eased = 1 - Math.pow(1 - progress, 3);
      setValue(Math.round(eased * target));
      if (progress < 1) frame = requestAnimationFrame(animate);
    };

    frame = requestAnimationFrame(animate);
    return () => cancelAnimationFrame(frame);
  }, [target]);

  return <>{value}</>;
}

export function SharedArtistsSlide({ label, artists }: { label: string; artists: ArtistInfo[] }) {
  return (
    <motion.div
      variants={fadeUp}
      initial="hidden"
      animate="visible"
      exit="exit"
      transition={{ duration: 0.8, ease: [0.22, 1, 0.36, 1] }}
      className="flex flex-col items-center justify-center gap-8 text-center"
    >
      <AnimatedText
        text={label}
        className="text-3xl font-bold text-white/80 md:text-4xl"
      />
      <motion.div className="flex flex-col items-center gap-4" variants={stagger} initial="hidden" animate="visible">
        {artists.slice(0, 3).map((artist, i) => (
          <motion.div
            key={artist.id}
            variants={{ hidden: { opacity: 0, x: -30 }, visible: { opacity: 1, x: 0 } }}
            transition={{ delay: 0.3 + i * 0.2, duration: 0.5, ease: "easeOut" }}
            className="flex items-center gap-4 rounded-2xl bg-white/10 px-6 py-3 backdrop-blur-sm"
          >
            <div className="relative h-12 w-12 overflow-hidden rounded-full ring-2 ring-white/20">
              <Image
                src={proxiedImageUrl(artist.profileImage) || "/images/placeholder-song.svg"}
                alt={artist.name}
                fill
                sizes="48px"
                className="object-cover"
              />
            </div>
            <span className="text-lg font-semibold text-white">{artist.name}</span>
          </motion.div>
        ))}
      </motion.div>
    </motion.div>
  );
}

export function UserStyleSlide({ label, artists }: { label: string; artists: ArtistInfo[] }) {
  return (
    <motion.div
      variants={fadeUp}
      initial="hidden"
      animate="visible"
      exit="exit"
      transition={{ duration: 0.8, ease: [0.22, 1, 0.36, 1] }}
      className="flex flex-col items-center justify-center gap-8 text-center"
    >
      <AnimatedText
        text={label}
        className="text-3xl font-bold text-white/80 md:text-4xl"
      />
      <motion.div className="flex flex-wrap justify-center gap-3" variants={stagger} initial="hidden" animate="visible">
        {artists.slice(0, 5).map((artist, i) => (
          <motion.div
            key={artist.id}
            variants={{ hidden: { opacity: 0, scale: 0.8 }, visible: { opacity: 1, scale: 1 } }}
            transition={{ delay: 0.3 + i * 0.15, type: "spring", stiffness: 200, damping: 15 }}
            className="flex flex-col items-center gap-2"
          >
            <div className="relative h-16 w-16 overflow-hidden rounded-full ring-2 ring-white/20 md:h-20 md:w-20">
              <Image
                src={proxiedImageUrl(artist.profileImage) || "/images/placeholder-song.svg"}
                alt={artist.name}
                fill
                sizes="80px"
                className="object-cover"
              />
            </div>
            <span className="max-w-[80px] truncate text-xs font-medium text-white/70 md:max-w-[100px] md:text-sm">{artist.name}</span>
          </motion.div>
        ))}
      </motion.div>
    </motion.div>
  );
}

interface FavSongInfo {
  title: string;
  coverImage: string | null;
  artistName: string | null;
}

export function FavoriteSongSlide({ song }: { song: FavSongInfo }) {
  return (
    <motion.div
      variants={fadeUp}
      initial="hidden"
      animate="visible"
      exit="exit"
      transition={{ duration: 0.8, ease: [0.22, 1, 0.36, 1] }}
      className="flex flex-col items-center justify-center gap-6 text-center"
    >
      <AnimatedText
        text="En Sevdiğiniz Şarkı"
        className="text-3xl font-bold text-white/80 md:text-4xl"
      />
      <motion.div
        initial={{ scale: 0.5, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ delay: 0.3, type: "spring", stiffness: 150, damping: 15 }}
        className="relative"
      >
        <div className="relative h-48 w-48 overflow-hidden rounded-2xl shadow-[0_0_60px_rgba(139,92,246,0.3)] ring-2 ring-white/20 md:h-56 md:w-56">
          <Image
            src={proxiedImageUrl(song.coverImage) || "/images/placeholder-song.svg"}
            alt={song.title}
            fill
            sizes="224px"
            className="object-cover"
          />
        </div>
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.6 }}
          className="absolute -bottom-2 -right-2 flex h-10 w-10 items-center justify-center rounded-full bg-green-500 shadow-lg"
        >
          <svg className="h-5 w-5 text-black" fill="currentColor" viewBox="0 0 24 24"><path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z"/></svg>
        </motion.div>
      </motion.div>
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.7, duration: 0.4 }}
        className="space-y-1"
      >
        <p className="text-xl font-black text-white drop-shadow-[0_0_20px_rgba(255,255,255,0.3)] md:text-2xl">
          {song.title}
        </p>
        {song.artistName && (
          <p className="text-base font-medium text-white/50">{song.artistName}</p>
        )}
      </motion.div>
    </motion.div>
  );
}

interface Particle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  radius: number;
  color: string;
  opacity: number;
  opacityDir: number;
}

function ParticlesCanvas({
  colors = ["#22c55e", "#a855f7", "#3b82f6", "#f59e0b", "#ef4444", "#ec4899", "#06b6d4"],
  count = 60,
}: {
  colors?: string[];
  count?: number;
}) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const particlesRef = useRef<Particle[]>([]);
  const rafRef = useRef<number>(0);

  const initParticles = useCallback(
    (w: number, h: number): Particle[] =>
      Array.from({ length: count }, () => ({
        x: Math.random() * w,
        y: Math.random() * h,
        vx: (Math.random() - 0.5) * 1.2,
        vy: (Math.random() - 0.5) * 1.2,
        radius: 2 + Math.random() * 4,
        color: colors[Math.floor(Math.random() * colors.length)],
        opacity: 0.4 + Math.random() * 0.6,
        opacityDir: (Math.random() > 0.5 ? 1 : -1) * (0.003 + Math.random() * 0.005),
      })),
    [colors, count]
  );

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const resize = () => {
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
      if (particlesRef.current.length === 0) {
        particlesRef.current = initParticles(canvas.width, canvas.height);
      }
    };
    resize();
    window.addEventListener("resize", resize);

    const draw = () => {
      const { width: w, height: h } = canvas;
      ctx.clearRect(0, 0, w, h);

      for (const p of particlesRef.current) {
        p.x += p.vx;
        p.y += p.vy;

        if (p.x < -10) p.x = w + 10;
        else if (p.x > w + 10) p.x = -10;
        if (p.y < -10) p.y = h + 10;
        else if (p.y > h + 10) p.y = -10;

        p.opacity += p.opacityDir;
        if (p.opacity >= 1) { p.opacity = 1; p.opacityDir = -Math.abs(p.opacityDir); }
        else if (p.opacity <= 0.2) { p.opacity = 0.2; p.opacityDir = Math.abs(p.opacityDir); }

        ctx.save();
        ctx.globalAlpha = p.opacity;
        ctx.shadowColor = p.color;
        ctx.shadowBlur = 15;
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.radius, 0, Math.PI * 2);
        ctx.fillStyle = p.color;
        ctx.fill();
        ctx.restore();
      }

      rafRef.current = requestAnimationFrame(draw);
    };

    rafRef.current = requestAnimationFrame(draw);

    return () => {
      cancelAnimationFrame(rafRef.current);
      window.removeEventListener("resize", resize);
    };
  }, [initParticles]);

  return (
    <canvas
      ref={canvasRef}
      className="pointer-events-none fixed inset-0 z-0"
      style={{ width: "100%", height: "100%" }}
    />
  );
}

export function BlendReadySlide(
  { label, buttonLabel, onGo }: { label: string; buttonLabel: string; onGo: () => void }
) {
  return (
    <motion.div
      variants={fadeUp}
      initial="hidden"
      animate="visible"
      exit="exit"
      transition={{ duration: 0.8, ease: [0.22, 1, 0.36, 1] }}
      className="relative flex flex-col items-center justify-center gap-8 text-center"
    >
      <ParticlesCanvas />

      <div className="relative z-10 flex flex-col items-center gap-8">
        <AnimatedText
          text={label}
          className="text-4xl font-black text-white drop-shadow-[0_0_40px_rgba(34,197,94,0.5)] md:text-5xl"
        />
        <motion.button
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.8, duration: 0.5 }}
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          onClick={onGo}
          className="rounded-full bg-green-500 px-8 py-3 text-lg font-bold text-black shadow-[0_0_30px_rgba(34,197,94,0.4)] transition-shadow hover:shadow-[0_0_50px_rgba(34,197,94,0.6)]"
        >
          {buttonLabel}
        </motion.button>
      </div>
    </motion.div>
  );
}
