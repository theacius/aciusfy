"use client";

import React from "react";
import { SparklesCore } from "./sparkles";

interface SparklesPreviewProps {
  children?: React.ReactNode;
  className?: string;
  particleColor?: string;
}

export function SparklesPreview({
  children,
  className = "",
  particleColor = "#f5ebe0",
}: SparklesPreviewProps) {
  return (
    <div
      className={`relative flex flex-col items-center justify-center overflow-hidden rounded-md ${className}`}
    >
      {children}
      <div className="relative h-40 w-full">
        
        <div className="absolute inset-x-20 top-0 h-px w-3/4 bg-gradient-to-r from-transparent via-indigo-500/50 to-transparent blur-sm" />
        <div className="absolute inset-x-20 top-0 h-px w-3/4 bg-gradient-to-r from-transparent via-indigo-500/30 to-transparent" />
        <div className="absolute inset-x-60 top-0 h-[5px] w-1/4 bg-gradient-to-r from-transparent via-sky-500/50 to-transparent blur-sm" />
        <div className="absolute inset-x-60 top-0 h-px w-1/4 bg-gradient-to-r from-transparent via-sky-500/30 to-transparent" />

        
        <SparklesCore
          background="transparent"
          minSize={0.4}
          maxSize={1}
          particleDensity={1200}
          className="absolute inset-0 w-full h-full"
          particleColor={particleColor}
        />

        
        <div className="absolute inset-0 w-full h-full bg-black [mask-image:radial-gradient(350px_200px_at_top,transparent_20%,white)]" />
      </div>
    </div>
  );
}
