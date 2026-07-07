"use client";

import { Suspense, useRef } from "react";
import { Canvas, useFrame } from "@react-three/fiber";
import { useTexture } from "@react-three/drei";
import * as THREE from "three";

const EARTH_MAP =
  "https://raw.githubusercontent.com/mrdoob/three.js/r174/examples/textures/planets/earth_atmos_2048.jpg";

function IntroEarth({ exiting }: { exiting: boolean }) {
  const group = useRef<THREE.Group>(null);
  const map = useTexture(EARTH_MAP);
  const exitT = useRef(0);

  useFrame((state, delta) => {
    if (!group.current) return;
    if (exiting) exitT.current = Math.min(1, exitT.current + delta * 0.75);
    const e = exitT.current;
    group.current.rotation.y += delta * (0.5 + e * 1.5);
    group.current.scale.setScalar(THREE.MathUtils.lerp(1, 2.8, e));
    group.current.position.z = THREE.MathUtils.lerp(0, 4, e);
  });

  return (
    <group ref={group}>
      <mesh>
        <sphereGeometry args={[1.2, 64, 64]} />
        <meshStandardMaterial map={map} roughness={0.85} metalness={0.05} />
      </mesh>
      <mesh scale={1.03}>
        <sphereGeometry args={[1.2, 48, 48]} />
        <meshBasicMaterial color="#6eb5ff" transparent opacity={0.2} side={THREE.BackSide} />
      </mesh>
    </group>
  );
}

function Scene({ exiting }: { exiting: boolean }) {
  return (
    <>
      <ambientLight intensity={0.2} />
      <directionalLight position={[5, 3, 5]} intensity={2} color="#fff8ee" />
      <IntroEarth exiting={exiting} />
    </>
  );
}

export function IntroThreeCanvas({ exiting = false, className }: { exiting?: boolean; className?: string }) {
  return (
    <div className={className} aria-hidden>
      <Canvas
        camera={{ position: [0, 0, 4.5], fov: 45 }}
        dpr={[1, 1.5]}
        gl={{ antialias: true, alpha: true }}
        className="!h-full !w-full"
        events={undefined as never}
      >
        <Suspense fallback={null}>
          <Scene exiting={exiting} />
        </Suspense>
      </Canvas>
    </div>
  );
}
