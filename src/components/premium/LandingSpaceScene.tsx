"use client";

import { Suspense, useRef } from "react";
import { Canvas, useFrame } from "@react-three/fiber";
import { Stars, useTexture } from "@react-three/drei";
import * as THREE from "three";
import { cn } from "@/lib/utils";

const EARTH_MAP =
  "https://raw.githubusercontent.com/mrdoob/three.js/r174/examples/textures/planets/earth_atmos_2048.jpg";
const EARTH_BUMP =
  "https://raw.githubusercontent.com/mrdoob/three.js/r174/examples/textures/planets/earth_specular_2048.jpg";
const MOON_MAP =
  "https://raw.githubusercontent.com/mrdoob/three.js/r174/examples/textures/planets/moon_1024.jpg";
const MARS_MAP =
  "https://raw.githubusercontent.com/mrdoob/three.js/r174/examples/textures/planets/mars_1k_color.jpg";

function Sun() {
  return (
    <group position={[14, 6, -18]}>
      <mesh>
        <sphereGeometry args={[2.2, 32, 32]} />
        <meshBasicMaterial color="#fff4d6" />
      </mesh>
      <pointLight intensity={4} color="#fff0cc" distance={80} decay={1.2} />
      <mesh scale={3.5}>
        <sphereGeometry args={[1, 24, 24]} />
        <meshBasicMaterial color="#ffb347" transparent opacity={0.12} depthWrite={false} />
      </mesh>
    </group>
  );
}

function Atmosphere({
  scale = 1.018,
  color = "#6eb5ff",
  opacity = 0.18,
}: {
  scale?: number;
  color?: string;
  opacity?: number;
}) {
  return (
    <mesh scale={scale}>
      <sphereGeometry args={[1, 48, 48]} />
      <meshBasicMaterial color={color} transparent opacity={opacity} side={THREE.BackSide} depthWrite={false} />
    </mesh>
  );
}

function Earth({ position, scale }: { position: [number, number, number]; scale: number }) {
  const ref = useRef<THREE.Group>(null);
  const [map, bump] = useTexture([EARTH_MAP, EARTH_BUMP]);

  useFrame((_, delta) => {
    if (ref.current) ref.current.rotation.y += delta * 0.035;
  });

  return (
    <group ref={ref} position={position} scale={scale}>
      <mesh>
        <sphereGeometry args={[1, 64, 64]} />
        <meshStandardMaterial map={map} bumpMap={bump} bumpScale={0.035} roughness={0.85} metalness={0.05} />
      </mesh>
      <Atmosphere scale={1.02} />
    </group>
  );
}

function Moon({ position, scale }: { position: [number, number, number]; scale: number }) {
  const ref = useRef<THREE.Mesh>(null);
  const map = useTexture(MOON_MAP);

  useFrame((_, delta) => {
    if (ref.current) ref.current.rotation.y += delta * 0.02;
  });

  return (
    <mesh ref={ref} position={position} scale={scale}>
      <sphereGeometry args={[1, 32, 32]} />
      <meshStandardMaterial map={map} roughness={1} metalness={0} />
    </mesh>
  );
}

function MarsPlanet() {
  const ref = useRef<THREE.Mesh>(null);
  const map = useTexture(MARS_MAP);

  useFrame((_, delta) => {
    if (ref.current) ref.current.rotation.y += delta * 0.015;
  });

  return (
    <group position={[-5.5, 1.2, -9]} scale={0.85}>
      <mesh ref={ref}>
        <sphereGeometry args={[1, 48, 48]} />
        <meshStandardMaterial map={map} roughness={0.95} metalness={0.02} />
      </mesh>
      <Atmosphere scale={1.04} color="#ff6b35" opacity={0.08} />
    </group>
  );
}

function Saturn() {
  const ref = useRef<THREE.Group>(null);

  useFrame((_, delta) => {
    if (ref.current) ref.current.rotation.y += delta * 0.012;
  });

  return (
    <group ref={ref} position={[-3.8, -1.6, -11]} scale={1.1}>
      <mesh>
        <sphereGeometry args={[1, 48, 48]} />
        <meshStandardMaterial color="#c9b896" roughness={0.7} metalness={0.08} />
      </mesh>
      <mesh rotation={[Math.PI / 2.2, 0.2, 0]}>
        <ringGeometry args={[1.35, 2.05, 64]} />
        <meshStandardMaterial
          color="#a89070"
          transparent
          opacity={0.55}
          side={THREE.DoubleSide}
          roughness={0.9}
          metalness={0.1}
        />
      </mesh>
    </group>
  );
}

function SpaceScene() {
  const rig = useRef<THREE.Group>(null);

  useFrame((state) => {
    if (!rig.current) return;
    const t = state.clock.elapsedTime;
    rig.current.rotation.y = Math.sin(t * 0.04) * 0.04;
    rig.current.position.y = Math.sin(t * 0.08) * 0.06;
  });

  return (
    <>
      <color attach="background" args={["#020208"]} />
      <fog attach="fog" args={["#020208", 14, 38]} />
      <ambientLight intensity={0.08} />
      <Sun />
      <directionalLight position={[8, 4, 6]} intensity={1.4} color="#fff5e6" />
      <Stars radius={80} depth={60} count={6000} factor={3.5} saturation={0.15} fade speed={0.35} />
      <group ref={rig}>
        <Earth position={[4.2, -0.15, -5.5]} scale={1.65} />
        <Moon position={[6.2, 0.55, -4.2]} scale={0.22} />
        <MarsPlanet />
        <Saturn />
      </group>
    </>
  );
}

type LandingSpaceSceneProps = {
  className?: string;
  variant?: "landing" | "intro";
};

export function LandingSpaceScene({ className, variant = "landing" }: LandingSpaceSceneProps) {
  const cameraZ = variant === "intro" ? 5.8 : 7.2;
  const fov = variant === "intro" ? 48 : 42;

  return (
    <div className={cn("pointer-events-none fixed inset-0 z-[1]", className)} aria-hidden>
      <Canvas
        camera={{ position: [0, 0.2, cameraZ], fov, near: 0.1, far: 100 }}
        dpr={[1, 1.5]}
        gl={{ antialias: true, alpha: true, powerPreference: "high-performance" }}
        events={undefined as never}
      >
        <Suspense fallback={null}>
          <SpaceScene />
        </Suspense>
      </Canvas>
      <div
        className="absolute inset-0"
        style={{
          background: "radial-gradient(ellipse 90% 70% at 50% 50%, transparent 35%, rgba(2,2,8,0.75) 100%)",
        }}
      />
    </div>
  );
}
