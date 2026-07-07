"use client";

import { Suspense, useMemo, useRef } from "react";
import { Canvas, useFrame } from "@react-three/fiber";
import { Stars } from "@react-three/drei";
import * as THREE from "three";
import { cn } from "@/lib/utils";

export type SpaceBackgroundIntensity = "landing" | "subtle" | "intro";

function DriftingStarfield({ count = 1200 }: { count?: number }) {
  const ref = useRef<THREE.Points>(null);
  const positions = useMemo(() => {
    const arr = new Float32Array(count * 3);
    for (let i = 0; i < count; i++) {
      arr[i * 3] = (Math.random() - 0.5) * 40;
      arr[i * 3 + 1] = (Math.random() - 0.5) * 28;
      arr[i * 3 + 2] = (Math.random() - 0.5) * 30 - 4;
    }
    return arr;
  }, [count]);

  useFrame((state) => {
    if (!ref.current) return;
    ref.current.rotation.y = state.clock.elapsedTime * 0.012;
    ref.current.rotation.x = Math.sin(state.clock.elapsedTime * 0.05) * 0.03;
  });

  return (
    <points ref={ref}>
      <bufferGeometry>
        <bufferAttribute attach="attributes-position" args={[positions, 3]} />
      </bufferGeometry>
      <pointsMaterial
        size={0.045}
        color="#e8f4ff"
        transparent
        opacity={0.75}
        sizeAttenuation
        depthWrite={false}
        blending={THREE.AdditiveBlending}
      />
    </points>
  );
}

function SpaceScene({ intensity }: { intensity: SpaceBackgroundIntensity }) {
  const starCount = intensity === "subtle" ? 8000 : 14000;
  const starFactor = intensity === "subtle" ? 2.8 : 4.2;

  return (
    <>
      <color attach="background" args={["#030510"]} />
      <fog attach="fog" args={["#030510", 18, 48]} />
      <ambientLight intensity={0.18} />
      <directionalLight position={[6, 3, 5]} intensity={0.6} color="#fff5e6" />
      <pointLight position={[-8, -2, -6]} intensity={0.35} color="#6366f1" />
      <Stars
        radius={100}
        depth={70}
        count={starCount}
        factor={starFactor}
        saturation={0.25}
        fade
        speed={0.55}
      />
      <DriftingStarfield count={intensity === "subtle" ? 600 : 1400} />
    </>
  );
}

type SpaceBackgroundProps = {
  className?: string;
  intensity?: SpaceBackgroundIntensity;
};

export function SpaceBackground({ className, intensity = "landing" }: SpaceBackgroundProps) {
  const cameraZ = intensity === "intro" ? 5.5 : intensity === "subtle" ? 8 : 6.8;
  const fov = intensity === "intro" ? 50 : 44;
  const vignetteOpacity = intensity === "subtle" ? 0.65 : 0.45;

  return (
    <div className={cn("pointer-events-none fixed inset-0 z-[1]", className)} aria-hidden>
      <div
        className="absolute inset-0 z-0"
        style={{
          background: `
            radial-gradient(ellipse 100% 80% at 70% 20%, rgba(59,130,246,0.28) 0%, transparent 50%),
            radial-gradient(ellipse 80% 60% at 20% 80%, rgba(124,58,237,0.22) 0%, transparent 45%),
            radial-gradient(ellipse 60% 50% at 50% 50%, rgba(14,165,233,0.08) 0%, transparent 60%),
            linear-gradient(180deg, #030510 0%, #020617 50%, #010208 100%)
          `,
        }}
      />
      <Canvas
        camera={{ position: [0, 0, cameraZ], fov, near: 0.1, far: 120 }}
        dpr={[1, 1.75]}
        gl={{ antialias: true, alpha: true, powerPreference: "high-performance" }}
        events={undefined as never}
      >
        <Suspense fallback={null}>
          <SpaceScene intensity={intensity} />
        </Suspense>
      </Canvas>
      <div
        className="absolute inset-0 z-[2]"
        style={{
          background: `radial-gradient(ellipse 95% 75% at 50% 45%, transparent 32%, rgba(3,5,16,${vignetteOpacity}) 100%)`,
        }}
      />
    </div>
  );
}
