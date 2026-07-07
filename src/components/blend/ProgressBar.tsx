"use client";

import { motion } from "framer-motion";

interface ProgressBarProps {
  totalSlides: number;
  currentSlide: number;
  progress: number
  isPaused: boolean;
}

export function StoryProgressBar({ totalSlides, currentSlide, progress, isPaused }: ProgressBarProps) {
  return (
    <div className="flex w-full gap-1 px-4 pt-4">
      {Array.from({ length: totalSlides }).map((_, i) => (
        <div key={i} className="relative h-[3px] flex-1 overflow-hidden rounded-full bg-white/20">
          {i < currentSlide ? (
            <div className="absolute inset-0 rounded-full bg-white" />
          ) : i === currentSlide ? (
            <motion.div
              className="absolute inset-y-0 left-0 rounded-full bg-white"
              style={{ width: `${progress * 100}%` }}
              transition={{ duration: 0.1, ease: "linear" }}
            />
          ) : null}
        </div>
      ))}
    </div>
  );
}
