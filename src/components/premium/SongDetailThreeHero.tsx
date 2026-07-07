"use client";

import { Suspense, useRef } from "react";
import { Canvas, useFrame } from "@react-three/fiber";
import { useTexture } from "@react-three/drei";
import * as THREE from "three";

function CoverDisc({ coverUrl }: { coverUrl: string }) {
  const group = useRef<THREE.Group>(null);
  const texture = useTexture(coverUrl);

  useFrame((state) => {
    if (!group.current) return;
    group.current.rotation.y = state.clock.elapsedTime * 0.35;
    group.current.position.y = Math.sin(state.clock.elapsedTime * 0.9) * 0.08;
  });

  return (
    <group ref={group}>
      <mesh rotation={[0.35, 0.4, 0]}>
        <cylinderGeometry args={[1.35, 1.35, 0.06, 64]} />
        <meshStandardMaterial map={texture} metalness={0.15} roughness={0.45} />
      </mesh>
      <mesh rotation={[0.35, 0.4, 0]} position={[0, 0, 0.04]}>
        <cylinderGeometry args={[0.18, 0.18, 0.08, 32]} />
        <meshStandardMaterial color="#0a0a0a" metalness={0.8} roughness={0.2} />
      </mesh>
    </group>
  );
}

export function SongDetailThreeHero({ coverUrl }: { coverUrl: string }) {
  return (
    <div className="pointer-events-none absolute inset-0" aria-hidden>
      <Canvas
        camera={{ position: [0, 0, 4.2], fov: 42 }}
        dpr={[1, 1.5]}
        gl={{ antialias: true, alpha: true }}
        className="!h-full !w-full"
      >
        <ambientLight intensity={0.55} />
        <directionalLight position={[3, 4, 5]} intensity={1.1} />
        <Suspense fallback={null}>
          <CoverDisc coverUrl={coverUrl} />
        </Suspense>
      </Canvas>
    </div>
  );
}
