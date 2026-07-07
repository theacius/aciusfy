"use client";

import { Suspense, useMemo, useRef } from "react";
import { Canvas, useFrame } from "@react-three/fiber";
import { Float } from "@react-three/drei";
import * as THREE from "three";
import { cn } from "@/lib/utils";

function ParticleField({
  count,
  spread,
  size,
  opacity,
  color,
  speed,
}: {
  count: number;
  spread: [number, number, number];
  size: number;
  opacity: number;
  color: string;
  speed: number;
}) {
  const ref = useRef<THREE.Points>(null);
  const positions = useMemo(() => {
    const arr = new Float32Array(count * 3);
    for (let i = 0; i < count; i++) {
      arr[i * 3] = (Math.random() - 0.5) * spread[0];
      arr[i * 3 + 1] = (Math.random() - 0.5) * spread[1];
      arr[i * 3 + 2] = (Math.random() - 0.5) * spread[2] - 3;
    }
    return arr;
  }, [count, spread]);

  useFrame((state) => {
    if (!ref.current) return;
    ref.current.rotation.y = state.clock.elapsedTime * speed;
    ref.current.rotation.x = Math.sin(state.clock.elapsedTime * speed * 2.5) * 0.06;
  });

  return (
    <points ref={ref}>
      <bufferGeometry>
        <bufferAttribute attach="attributes-position" args={[positions, 3]} />
      </bufferGeometry>
      <pointsMaterial
        size={size}
        color={color}
        transparent
        opacity={opacity}
        sizeAttenuation
        depthWrite={false}
        blending={THREE.AdditiveBlending}
      />
    </points>
  );
}

function FloatingRings() {
  const ring1 = useRef<THREE.Mesh>(null);
  const ring2 = useRef<THREE.Mesh>(null);

  useFrame((state) => {
    const t = state.clock.elapsedTime;
    if (ring1.current) {
      ring1.current.rotation.x = t * 0.12;
      ring1.current.rotation.z = t * 0.08;
    }
    if (ring2.current) {
      ring2.current.rotation.y = t * 0.15;
      ring2.current.rotation.x = Math.PI / 3 + Math.sin(t * 0.2) * 0.1;
    }
  });

  return (
    <Float speed={1.2} rotationIntensity={0.15} floatIntensity={0.35}>
      <group position={[2.8, 0.2, -2]}>
        <mesh ref={ring1}>
          <torusGeometry args={[2.2, 0.012, 12, 96]} />
          <meshBasicMaterial color="#60a5fa" transparent opacity={0.35} />
        </mesh>
        <mesh ref={ring2} rotation={[Math.PI / 3, 0, 0]}>
          <torusGeometry args={[1.6, 0.01, 12, 80]} />
          <meshBasicMaterial color="#a78bfa" transparent opacity={0.28} />
        </mesh>
      </group>
    </Float>
  );
}

function Scene({ variant }: { variant: "landing" | "app" }) {
  const isLanding = variant === "landing";
  return (
    <>
      <ambientLight intensity={0.5} />
      <ParticleField
        count={isLanding ? 1400 : 600}
        spread={isLanding ? [28, 18, 14] : [24, 16, 12]}
        size={isLanding ? 0.042 : 0.028}
        opacity={isLanding ? 0.55 : 0.28}
        color="#e4e4e7"
        speed={isLanding ? 0.022 : 0.015}
      />
      {isLanding ? (
        <ParticleField
          count={500}
          spread={[22, 14, 10]}
          size={0.055}
          opacity={0.22}
          color="#60a5fa"
          speed={-0.012}
        />
      ) : null}
      {isLanding ? <FloatingRings /> : null}
    </>
  );
}

export function PremiumThreeField({
  className,
  intensity = "normal",
  variant = "app",
}: {
  className?: string;
  intensity?: "subtle" | "normal" | "landing";
  variant?: "landing" | "app";
}) {
  const resolvedVariant = intensity === "landing" || variant === "landing" ? "landing" : "app";
  const opacity =
    intensity === "subtle" ? "opacity-50" : resolvedVariant === "landing" ? "opacity-100" : "opacity-70";

  return (
    <div className={cn("pointer-events-none fixed inset-0 z-[1]", opacity, className)} aria-hidden>
      <Canvas
        camera={{ position: [0, 0, 7], fov: 55 }}
        dpr={[1, 1.5]}
        gl={{ antialias: false, alpha: true, powerPreference: "low-power" }}
        events={undefined as never}
      >
        <Suspense fallback={null}>
          <Scene variant={resolvedVariant} />
        </Suspense>
      </Canvas>
    </div>
  );
}
