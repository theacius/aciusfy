"use client";

import { Suspense, useMemo, useRef } from "react";
import { Canvas, useFrame } from "@react-three/fiber";
import * as THREE from "three";
import { cn } from "@/lib/utils";
import { useLandingScroll } from "@/components/landing/LandingScrollContext";

const vertexShader = /* glsl */ `
  varying vec2 vUv;
  void main() {
    vUv = uv;
    gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
  }
`;

const fragmentShader = /* glsl */ `
  precision highp float;
  uniform float uTime;
  uniform float uScroll;
  varying vec2 vUv;

  float wave(vec2 p, float t) {
    return sin(p.x * 4.5 + t * 0.35) * 0.5
      + sin(p.y * 3.8 - t * 0.28 + p.x * 1.6) * 0.35
      + sin((p.x + p.y) * 6.0 + t * 0.45) * 0.25;
  }

  void main() {
    vec2 uv = vUv;
    vec2 p = uv * 2.0 - 1.0;
    float t = uTime;

    float n = wave(uv * 3.2, t);
    float n2 = wave(uv * 1.8 + vec2(0.4, 0.2), t * 1.15);
    float mixVal = smoothstep(-0.15, 0.75, n + n2 * 0.55 + 0.08 * sin(t * 0.6) + uScroll * 0.25);

    vec3 deep = vec3(0.012, 0.012, 0.018);
    vec3 blue = vec3(0.12, 0.38, 0.95);
    vec3 violet = vec3(0.52, 0.32, 0.98);
    vec3 cyan = vec3(0.08, 0.72, 0.92);

    vec2 suv = uv + vec2(uScroll * 0.08, -uScroll * 0.12);
    vec3 col = mix(deep, mix(blue, mix(violet, cyan, suv.x + 0.2 * sin(t * 0.25)), suv.y + n * 0.15), mixVal);

    float vignette = 1.0 - smoothstep(0.35, 1.25, length(p * vec2(0.85, 1.0)));
    float alpha = mixVal * vignette * (0.72 + uScroll * 0.35);

    gl_FragColor = vec4(col, alpha);
  }
`;

function AuroraMesh() {
  const matRef = useRef<THREE.ShaderMaterial>(null);
  const { progress } = useLandingScroll();
  const uniforms = useMemo(
    () => ({
      uTime: { value: 0 },
      uScroll: { value: 0 },
    }),
    [],
  );

  useFrame((state) => {
    if (!matRef.current) return;
    matRef.current.uniforms.uTime.value = state.clock.elapsedTime;
    matRef.current.uniforms.uScroll.value = progress;
  });

  return (
    <mesh scale={[22, 14, 1]} position={[0, 0, -3]}>
      <planeGeometry args={[1, 1, 1, 1]} />
      <shaderMaterial
        ref={matRef}
        uniforms={uniforms}
        vertexShader={vertexShader}
        fragmentShader={fragmentShader}
        transparent
        depthWrite={false}
        blending={THREE.AdditiveBlending}
      />
    </mesh>
  );
}

function StarDust() {
  const ref = useRef<THREE.Points>(null);
  const positions = useMemo(() => {
    const count = 900;
    const arr = new Float32Array(count * 3);
    for (let i = 0; i < count; i++) {
      arr[i * 3] = (Math.random() - 0.5) * 26;
      arr[i * 3 + 1] = (Math.random() - 0.5) * 16;
      arr[i * 3 + 2] = (Math.random() - 0.5) * 8 - 2;
    }
    return arr;
  }, []);

  useFrame((state) => {
    if (!ref.current) return;
    ref.current.rotation.y = state.clock.elapsedTime * 0.018;
  });

  return (
    <points ref={ref}>
      <bufferGeometry>
        <bufferAttribute attach="attributes-position" args={[positions, 3]} />
      </bufferGeometry>
      <pointsMaterial
        size={0.035}
        color="#dbeafe"
        transparent
        opacity={0.45}
        sizeAttenuation
        depthWrite={false}
        blending={THREE.AdditiveBlending}
      />
    </points>
  );
}

function Scene() {
  return (
    <>
      <AuroraMesh />
      <StarDust />
    </>
  );
}

/** Akışkan shader aurora — landing arka planı */
export function PremiumAuroraCanvas({ className }: { className?: string }) {
  return (
    <div className={cn("pointer-events-none fixed inset-0 z-[1]", className)} aria-hidden>
      <Canvas
        camera={{ position: [0, 0, 6], fov: 50 }}
        dpr={[1, 1.5]}
        gl={{ antialias: false, alpha: true, powerPreference: "low-power" }}
        events={undefined as never}
      >
        <Suspense fallback={null}>
          <Scene />
        </Suspense>
      </Canvas>
    </div>
  );
}
