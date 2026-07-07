"use client";

import { useState, useCallback, useRef } from "react";
import Image from "next/image";
import { motion, AnimatePresence, useInView } from "framer-motion";
import { formatPlayCount } from "@/lib/utils";
import { proxiedImageUrl } from "@/lib/media-proxy-url";
import { SparklesCore } from "@/components/ui/sparkles";
import type { ArtistType, AlbumType, SongType } from "@/types";

interface SlideItem {
  id: string;
  label: string;
  value: string;
  image: string | null;
}

interface ArtistInfoSliderProps {
  artist: ArtistType;
  albums?: (AlbumType & { _count?: { songs: number } })[];
  songs?: SongType[];
  headerText?: string;
  footerText?: string;
}

export function ArtistInfoSlider(
  {
    artist,
    albums = [],
    songs = [],
    headerText,
    footerText,
  }: ArtistInfoSliderProps
) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [direction, setDirection] = useState<"down" | "up">("down");
  const [isAnimating, setIsAnimating] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const isInView = useInView(containerRef);

  const defaultImg = artist.bannerImage || artist.profileImage || "/images/placeholder-song.svg";

  const slides: SlideItem[] = [
    {
      id: "bio",
      label: "Hakkında",
      value: artist.bio || `${artist.name} – Müzik dünyasında keşfedilmeyi bekliyor.`,
      image: defaultImg,
    },
    {
      id: "listeners",
      label: "Aylık Dinleyici",
      value: formatPlayCount(artist.monthlyListeners),
      image: defaultImg,
    },
    ...(songs[0]
      ? [
          {
            id: "popular",
            label: "En Popüler",
            value: songs[0].title,
            image: proxiedImageUrl(songs[0].coverImage) || defaultImg,
          } as SlideItem,
        ]
      : []),
    ...(albums[0]
      ? [
          {
            id: "album",
            label: "Öne Çıkan Albüm",
            value: albums[0].title,
            image: proxiedImageUrl(albums[0].coverImage) || defaultImg,
          } as SlideItem,
        ]
      : []),
  ].filter(Boolean);

  const navigateTo = useCallback(
    (index: number) => {
      if (index === currentIndex || isAnimating || index < 0 || index >= slides.length) return;
      setDirection(index > currentIndex ? "down" : "up");
      setIsAnimating(true);
      setCurrentIndex(index);
      setTimeout(() => setIsAnimating(false), 640);
    },
    [currentIndex, isAnimating, slides.length]
  );

  const currentSlide = slides[currentIndex];
  const progressWidth = slides.length <= 1 ? 0 : (currentIndex / (slides.length - 1)) * 100;

  const textVariants = {
    enter: (d: "down" | "up") => ({
      y: d === "down" ? "100%" : "-100%",
      opacity: 0,
    }),
    center: { y: 0, opacity: 1 },
    exit: (d: "down" | "up") => ({
      y: d === "down" ? "-100%" : "100%",
      opacity: 0,
    }),
  };

  const imageVariants = {
    enter: (d: "down" | "up") => ({
      clipPath: d === "down" ? "inset(100% 0 0 0)" : "inset(0 0 100% 0)",
      opacity: 1,
    }),
    center: { clipPath: "inset(0% 0 0% 0)", opacity: 1 },
    exit: (d: "down" | "up") => ({
      y: d === "down" ? "5%" : "-5%",
      opacity: 0,
    }),
  };

  if (slides.length === 0) return null;

  return (
    <div
      ref={containerRef}
      className="relative -mx-6 -mt-4 min-h-[calc(100dvh-var(--navbar-height)-var(--player-height)+1rem)] overflow-hidden rounded-b-xl bg-black"
    >
      
      <div className="absolute inset-0 z-[1]">
        {currentSlide?.image ? (
          <AnimatePresence initial={false} custom={direction} mode="wait">
            <motion.div
              key={currentIndex}
              custom={direction}
              variants={imageVariants}
              initial="enter"
              animate="center"
              exit="exit"
              transition={{ duration: 0.64, ease: [0.86, 0, 0.07, 1] }}
              className="absolute -top-[10%] left-0 h-[120%] w-full"
            >
              <Image
                src={proxiedImageUrl(currentSlide.image) || currentSlide.image}
                alt={artist.name}
                fill
                sizes="100vw"
                className="object-cover brightness-[0.8]"
              />
            </motion.div>
          </AnimatePresence>
        ) : (
          <div className="absolute inset-0 bg-gradient-to-br from-[#2d4a7a] to-[#0d1520]" />
        )}
      </div>

      
      <div className="absolute inset-0 z-[2] bg-gradient-to-b from-black/60 via-transparent to-black/80" />

      
      <div className="absolute inset-0 z-[3] flex flex-col p-6 md:p-8">
        <div className="flex shrink-0 flex-col items-center justify-center gap-0 text-center">
          <h2
            className="relative z-20 text-5xl font-semibold tracking-tight text-slider-cream md:text-6xl [text-shadow:0_0_20px_rgba(245,235,224,0.2)]"
            style={{ fontFamily: "var(--font-playfair), serif" }}
          >
            {headerText || artist.name.toUpperCase()}
          </h2>
          <div className="relative h-32 w-full max-w-2xl">
            <div className="absolute inset-x-20 top-0 h-px w-3/4 bg-gradient-to-r from-transparent via-indigo-500/50 to-transparent blur-sm" />
            <div className="absolute inset-x-20 top-0 h-px w-3/4 bg-gradient-to-r from-transparent via-indigo-500/30 to-transparent" />
            <div className="absolute inset-x-60 top-0 h-[5px] w-1/4 bg-gradient-to-r from-transparent via-sky-500/50 to-transparent blur-sm" />
            <div className="absolute inset-x-60 top-0 h-px w-1/4 bg-gradient-to-r from-transparent via-sky-500/30 to-transparent" />
            <SparklesCore
              id="artist-slider-sparkles"
              background="transparent"
              minSize={0.4}
              maxSize={1}
              particleDensity={1200}
              className="absolute inset-0 h-full w-full"
              particleColor="#f5ebe0"
            />
          </div>
        </div>

        <div className="flex flex-1 items-center justify-between gap-4 md:gap-8">
          
          <div className="flex w-2/5 flex-col gap-2">
            {slides.map((slide, i) => (
              <button
                key={slide.id}
                type="button"
                onClick={() => navigateTo(i)}
                className={`group flex items-center gap-2 text-left transition-all duration-300 ${
                  i === currentIndex ? "translate-x-2 opacity-100" : "opacity-40 hover:opacity-70"
                }`}
              >
                {i === currentIndex && (
                  <span className="h-1 w-1 shrink-0 rounded-full bg-slider-cream" />
                )}
                <span className="text-sm font-medium text-slider-cream md:text-base">
                  {slide.label}
                </span>
              </button>
            ))}
          </div>

          
          <div className="flex min-h-[80px] w-1/5 items-center justify-center overflow-hidden text-center">
            <AnimatePresence initial={false} custom={direction} mode="wait">
              {isInView && currentSlide && (
                <motion.div
                  key={currentIndex}
                  custom={direction}
                  variants={textVariants}
                  initial="enter"
                  animate="center"
                  exit="exit"
                  transition={{ duration: 0.64, ease: [0.86, 0, 0.07, 1] }}
                  className={`absolute font-medium text-slider-cream [text-shadow:0_0_20px_rgba(245,235,224,0.2)] ${
                    currentSlide.id === "popular" || currentSlide.id === "listeners"
                      ? "text-xl md:text-3xl"
                      : "text-lg md:text-xl"
                  }`}
                  style={{ fontFamily: "var(--font-playfair), serif" }}
                >
                  {currentSlide.value.length > 40
                    ? `${currentSlide.value.slice(0, 40)}...`
                    : currentSlide.value}
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          
          <div className="flex w-2/5 flex-col items-end gap-2">
            {slides.map((slide, i) => (
              <button
                key={slide.id}
                type="button"
                onClick={() => navigateTo(i)}
                className={`group flex items-center gap-2 text-right transition-all duration-300 ${
                  i === currentIndex ? "-translate-x-2 opacity-100" : "opacity-40 hover:opacity-70"
                }`}
              >
                <span className="text-sm font-medium text-slider-cream md:text-base">
                  {slide.label}
                </span>
                {i === currentIndex && (
                  <span className="h-1 w-1 shrink-0 rounded-full bg-slider-cream" />
                )}
              </button>
            ))}
          </div>
        </div>

        
        <div className="shrink-0 text-center">
          {footerText ? (
            <p
              className="text-3xl font-semibold tracking-tight text-slider-cream md:text-4xl [text-shadow:0_0_20px_rgba(245,235,224,0.2)]"
              style={{ fontFamily: "var(--font-playfair), serif" }}
            >
              {footerText}
            </p>
          ) : null}
          <div
            className={`flex items-center justify-center gap-3 ${footerText ? "mt-4" : ""}`}
          >
            <span className="text-sm text-slider-cream">
              {String(currentIndex + 1).padStart(2, "0")}
            </span>
            <div className="h-px w-40 overflow-hidden rounded-full bg-slider-cream/30">
              <motion.div
                className="h-full rounded-full bg-slider-cream"
                initial={{ width: 0 }}
                animate={{ width: `${progressWidth}%` }}
                transition={{ duration: 0.6, ease: [0.25, 0.1, 0.25, 1] }}
              />
            </div>
            <span className="text-sm text-slider-cream">
              {String(slides.length).padStart(2, "0")}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}
