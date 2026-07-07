"use client";

import { useEffect, useRef, useCallback } from "react";

interface ElectricBorderProps {
  color: string;
  size: number;
  borderRadius?: number;
  speed?: number;
  chaos?: number;
}

export function ElectricBorder({
  color,
  size,
  borderRadius = 12,
  speed = 1,
  chaos = 0.12,
}: ElectricBorderProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const animationRef = useRef<number>(0);
  const timeRef = useRef(0);
  const lastFrameRef = useRef(0);

  const random = useCallback((x: number) => {
    return (Math.sin(x * 12.9898) * 43758.5453) % 1;
  }, []);

  const noise2D = useCallback(
    (x: number, y: number) => {
      const i = Math.floor(x);
      const j = Math.floor(y);
      const fx = x - i;
      const fy = y - j;
      const a = random(i + j * 57);
      const b = random(i + 1 + j * 57);
      const c = random(i + (j + 1) * 57);
      const d = random(i + 1 + (j + 1) * 57);
      const ux = fx * fx * (3.0 - 2.0 * fx);
      const uy = fy * fy * (3.0 - 2.0 * fy);
      return a * (1 - ux) * (1 - uy) + b * ux * (1 - uy) + c * (1 - ux) * uy + d * ux * uy;
    },
    [random],
  );

  const octavedNoise = useCallback(
    (x: number, octaves: number, lac: number, gain: number, amp: number, freq: number, time: number, seed: number, flat: number) => {
      let y = 0;
      let amplitude = amp;
      let frequency = freq;
      for (let i = 0; i < octaves; i++) {
        const oa = i === 0 ? amplitude * flat : amplitude;
        y += oa * noise2D(frequency * x + seed * 100, time * frequency * 0.3);
        frequency *= lac;
        amplitude *= gain;
      }
      return y;
    },
    [noise2D],
  );

  const getCornerPoint = useCallback((cx: number, cy: number, r: number, start: number, arc: number, p: number) => {
    const angle = start + p * arc;
    return { x: cx + r * Math.cos(angle), y: cy + r * Math.sin(angle) };
  }, []);

  const getRoundedRectPoint = useCallback(
    (t: number, left: number, top: number, w: number, h: number, r: number) => {
      const sw = w - 2 * r;
      const sh = h - 2 * r;
      const ca = (Math.PI * r) / 2;
      const total = 2 * sw + 2 * sh + 4 * ca;
      const d = t * total;
      let acc = 0;

      if (d <= acc + sw) { const p = (d - acc) / sw; return { x: left + r + p * sw, y: top }; }
      acc += sw;
      if (d <= acc + ca) { const p = (d - acc) / ca; return getCornerPoint(left + w - r, top + r, r, -Math.PI / 2, Math.PI / 2, p); }
      acc += ca;
      if (d <= acc + sh) { const p = (d - acc) / sh; return { x: left + w, y: top + r + p * sh }; }
      acc += sh;
      if (d <= acc + ca) { const p = (d - acc) / ca; return getCornerPoint(left + w - r, top + h - r, r, 0, Math.PI / 2, p); }
      acc += ca;
      if (d <= acc + sw) { const p = (d - acc) / sw; return { x: left + w - r - p * sw, y: top + h }; }
      acc += sw;
      if (d <= acc + ca) { const p = (d - acc) / ca; return getCornerPoint(left + r, top + h - r, r, Math.PI / 2, Math.PI / 2, p); }
      acc += ca;
      if (d <= acc + sh) { const p = (d - acc) / sh; return { x: left, y: top + h - r - p * sh }; }
      acc += sh;
      const p = (d - acc) / ca;
      return getCornerPoint(left + r, top + r, r, Math.PI, Math.PI / 2, p);
    },
    [getCornerPoint],
  );

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const offset = 6;
    const canvasSize = size + offset * 2;
    const dpr = Math.min(window.devicePixelRatio || 1, 2);

    canvas.width = canvasSize * dpr;
    canvas.height = canvasSize * dpr;
    canvas.style.width = `${canvasSize}px`;
    canvas.style.height = `${canvasSize}px`;

    const octaves = 10;
    const lacunarity = 1.6;
    const gain = 0.7;
    const amplitude = chaos;
    const frequency = 10;
    const baseFlatness = 0;
    const displacement = 6;

    const draw = (time: number) => {
      const dt = (time - lastFrameRef.current) / 1000;
      timeRef.current += dt * speed;
      lastFrameRef.current = time;

      ctx.setTransform(1, 0, 0, 1, 0, 0);
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      ctx.scale(dpr, dpr);

      ctx.strokeStyle = color;
      ctx.lineWidth = 1;
      ctx.lineCap = "round";
      ctx.lineJoin = "round";

      const maxR = Math.min(size, size) / 2;
      const r = Math.min(borderRadius, maxR);
      const approxPerimeter = 2 * (size + size) + 2 * Math.PI * r;
      const samples = Math.floor(approxPerimeter / 2);

      ctx.beginPath();
      for (let i = 0; i <= samples; i++) {
        const progress = i / samples;
        const pt = getRoundedRectPoint(progress, offset, offset, size, size, r);
        const xN = octavedNoise(progress * 8, octaves, lacunarity, gain, amplitude, frequency, timeRef.current, 0, baseFlatness);
        const yN = octavedNoise(progress * 8, octaves, lacunarity, gain, amplitude, frequency, timeRef.current, 1, baseFlatness);
        const dx = pt.x + xN * displacement;
        const dy = pt.y + yN * displacement;
        if (i === 0) ctx.moveTo(dx, dy); else ctx.lineTo(dx, dy);
      }
      ctx.closePath();
      ctx.stroke();

      animationRef.current = requestAnimationFrame(draw);
    };

    animationRef.current = requestAnimationFrame(draw);
    return () => { if (animationRef.current) cancelAnimationFrame(animationRef.current); };
  }, [color, size, borderRadius, speed, chaos, octavedNoise, getRoundedRectPoint]);

  const offset = 6;
  const canvasSize = size + offset * 2;

  return (
    <>
      
      <canvas
        ref={canvasRef}
        className="pointer-events-none absolute"
        style={{
          top: `-${offset}px`,
          left: `-${offset}px`,
          width: `${canvasSize}px`,
          height: `${canvasSize}px`,
          zIndex: 2,
        }}
      />
      
      <div
        className="pointer-events-none absolute inset-0 rounded-xl"
        style={{ border: `2px solid ${color}`, filter: "blur(1px)", opacity: 0.6 }}
      />
      <div
        className="pointer-events-none absolute inset-0 rounded-xl"
        style={{ border: `2px solid ${color}`, filter: "blur(4px)", opacity: 0.4 }}
      />
      
      <div
        className="pointer-events-none absolute inset-0 rounded-xl"
        style={{
          background: `linear-gradient(-30deg, ${color}, transparent, ${color})`,
          filter: "blur(20px)",
          opacity: 0.3,
          transform: "scale(1.1)",
          zIndex: -1,
        }}
      />
    </>
  );
}
