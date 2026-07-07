"use client";

import React, { useCallback, useEffect, useId, useState } from "react";
import { Particles, initParticlesEngine } from "@tsparticles/react";
import type { Container, ISourceOptions } from "@tsparticles/engine";
import { loadSlim } from "@tsparticles/slim";

interface SparklesCoreProps {
  id?: string;
  className?: string;
  background?: string;
  minSize?: number;
  maxSize?: number;
  speed?: number;
  particleColor?: string;
  particleDensity?: number;
}

export function SparklesCore({
  id: idProp,
  className = "",
  background = "transparent",
  minSize = 0.4,
  maxSize = 1,
  speed = 1,
  particleColor = "#FFFFFF",
  particleDensity = 1200,
}: SparklesCoreProps) {
  const generatedId = useId().replace(/:/g, "");
  const id = idProp ?? `sparkles-${generatedId}`;
  const [init, setInit] = useState(false);

  useEffect(() => {
    initParticlesEngine(async (engine) => {
      await loadSlim(engine);
    }).then(() => {
      setInit(true);
    });
  }, []);

  const options: ISourceOptions = {
    background: { color: { value: background } },
    fullScreen: { enable: false },
    particles: {
      color: { value: particleColor },
      move: {
        enable: true,
        speed,
        direction: "none",
        random: true,
        straight: false,
        outModes: { default: "out" },
      },
      number: {
        density: {
          enable: true,
          width: 1000,
          height: 1000,
        },
        value: Math.min(particleDensity / 10, 100),
      },
      opacity: {
        value: { min: 0.1, max: 0.5 },
        animation: {
          enable: true,
          speed: 1,
          sync: false,
          startValue: "random",
          destroy: "none",
        },
      },
      shape: { type: "circle" },
      size: {
        value: { min: minSize, max: maxSize },
      },
    },
    detectRetina: true,
  };

  const particlesLoaded = useCallback(async (_container?: Container) => {}, []);

  if (!init) return null;

  return (
    <div className={className}>
      <Particles id={id} particlesLoaded={particlesLoaded} options={options} />
    </div>
  );
}
