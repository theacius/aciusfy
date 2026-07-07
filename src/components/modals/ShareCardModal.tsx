"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import { Download, Share2 } from "lucide-react";
import { useTranslation } from "@/hooks/useTranslation";
import { proxiedImageUrl } from "@/lib/media-proxy-url";
import { AnimatedModal } from "@/components/ui/animated-modal";

interface ShareCardModalProps {
  isOpen: boolean;
  onClose: () => void;
  song: {
    title: string;
    coverImage?: string | null;
    artist?: { name: string } | null;
  } | null;
}

export function ShareCardModal({ isOpen, onClose, song }: ShareCardModalProps) {
  const { t } = useTranslation();
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [rendered, setRendered] = useState(false);

  const drawCard = useCallback(async () => {
    if (!song || !canvasRef.current) return;
    const canvas = canvasRef.current;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const W = 600;
    const H = 600;
    canvas.width = W;
    canvas.height = H;

    const grad = ctx.createLinearGradient(0, 0, W, H);
    grad.addColorStop(0, "#09090b");
    grad.addColorStop(0.5, "#18181b");
    grad.addColorStop(1, "#09090b");
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, W, H);

    const coverSize = 300;
    const coverX = (W - coverSize) / 2;
    const coverY = 80;

    if (song.coverImage) {
      try {
        const img = new window.Image();
        img.crossOrigin = "anonymous";
        await new Promise<void>((resolve, reject) => {
          img.onload = () => resolve();
          img.onerror = () => reject();
          img.src = proxiedImageUrl(song.coverImage!) || "";
        });

        ctx.save();
        const radius = 20;
        ctx.beginPath();
        ctx.moveTo(coverX + radius, coverY);
        ctx.lineTo(coverX + coverSize - radius, coverY);
        ctx.quadraticCurveTo(coverX + coverSize, coverY, coverX + coverSize, coverY + radius);
        ctx.lineTo(coverX + coverSize, coverY + coverSize - radius);
        ctx.quadraticCurveTo(coverX + coverSize, coverY + coverSize, coverX + coverSize - radius, coverY + coverSize);
        ctx.lineTo(coverX + radius, coverY + coverSize);
        ctx.quadraticCurveTo(coverX, coverY + coverSize, coverX, coverY + coverSize - radius);
        ctx.lineTo(coverX, coverY + radius);
        ctx.quadraticCurveTo(coverX, coverY, coverX + radius, coverY);
        ctx.closePath();
        ctx.clip();
        ctx.drawImage(img, coverX, coverY, coverSize, coverSize);
        ctx.restore();

        ctx.save();
        ctx.shadowColor = "rgba(255, 255, 255, 0.15)";
        ctx.shadowBlur = 40;
        ctx.strokeStyle = "rgba(255, 255, 255, 0.12)";
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.roundRect(coverX, coverY, coverSize, coverSize, radius);
        ctx.stroke();
        ctx.restore();
      } catch {
        ctx.fillStyle = "rgba(255, 255, 255, 0.08)";
        ctx.beginPath();
        ctx.roundRect(coverX, coverY, coverSize, coverSize, 20);
        ctx.fill();
      }
    } else {
      ctx.fillStyle = "rgba(255, 255, 255, 0.08)";
      ctx.beginPath();
      ctx.roundRect(coverX, coverY, coverSize, coverSize, 20);
      ctx.fill();
    }

    ctx.fillStyle = "#ffffff";
    ctx.font = "bold 24px system-ui, -apple-system, sans-serif";
    ctx.textAlign = "center";
    const title = song.title.length > 35 ? song.title.slice(0, 35) + "…" : song.title;
    ctx.fillText(title, W / 2, coverY + coverSize + 50);

    if (song.artist?.name) {
      ctx.fillStyle = "rgba(255, 255, 255, 0.5)";
      ctx.font = "500 16px system-ui, -apple-system, sans-serif";
      ctx.fillText(song.artist.name, W / 2, coverY + coverSize + 80);
    }

    ctx.fillStyle = "rgba(255, 255, 255, 0.7)";
    ctx.font = "bold 14px system-ui, -apple-system, sans-serif";
    ctx.textAlign = "center";
    ctx.fillText("ACIUSFY", W / 2, H - 35);

    ctx.fillStyle = "rgba(255, 255, 255, 0.15)";
    ctx.font = "11px system-ui, -apple-system, sans-serif";
    ctx.fillText("♫ Müziği Hisset, Anlamı Keşfet", W / 2, H - 15);

    setRendered(true);
  }, [song]);

  useEffect(() => {
    if (isOpen && song) {
      setRendered(false);
      const timer = setTimeout(drawCard, 100);
      return () => clearTimeout(timer);
    }
  }, [isOpen, song, drawCard]);

  const handleDownload = () => {
    if (!canvasRef.current) return;
    const link = document.createElement("a");
    link.download = `aciusfy-${song?.title?.replace(/[^a-zA-Z0-9]/g, "_") || "share"}.png`;
    link.href = canvasRef.current.toDataURL("image/png");
    link.click();
  };

  const handleShare = async () => {
    if (!canvasRef.current) return;
    try {
      const blob = await new Promise<Blob | null>((resolve) =>
        canvasRef.current!.toBlob(resolve, "image/png")
      );
      if (blob && navigator.share) {
        const file = new File([blob], "aciusfy-share.png", { type: "image/png" });
        await navigator.share({
          title: `${song?.title} - ${song?.artist?.name}`,
          text: `${song?.title} - ${song?.artist?.name} | Aciusfy'da dinle`,
          files: [file],
        });
      }
    } catch {
      handleDownload();
    }
  };

  if (!song) return null;

  return (
    <AnimatedModal
      isOpen={isOpen}
      onClose={onClose}
      title={t("shareSongCard")}
      className="max-w-[380px]"
    >
      <div className="p-6">
        <div className="mb-4 flex justify-center">
          <canvas
            ref={canvasRef}
            className="w-full max-w-[300px] rounded-2xl"
            style={{ aspectRatio: "1/1" }}
          />
        </div>

        <div className="flex gap-3">
          <button
            onClick={handleDownload}
            disabled={!rendered}
            className="flex flex-1 items-center justify-center gap-2 rounded-full bg-white py-3 text-sm font-semibold text-[#09090b] transition hover:opacity-90 disabled:opacity-40"
          >
            <Download className="h-4 w-4" />
            {t("downloadCard")}
          </button>
          {typeof navigator !== "undefined" && typeof navigator.share === "function" && (
            <button
              onClick={handleShare}
              disabled={!rendered}
              className="flex items-center justify-center gap-2 rounded-full border border-white/[0.08] bg-white/[0.06] px-4 py-3 text-sm font-semibold text-white transition hover:bg-white/[0.1] disabled:opacity-40"
            >
              <Share2 className="h-4 w-4" />
            </button>
          )}
        </div>
      </div>
    </AnimatedModal>
  );
}
