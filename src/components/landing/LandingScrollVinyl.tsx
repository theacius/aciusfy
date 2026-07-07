import { Suspense, useMemo, useRef } from "react";
import { Canvas, useFrame } from "@react-three/fiber";
import { Float, MeshDistortMaterial } from "@react-three/drei";
import * as THREE from "three";
import { useLandingScroll } from "@/components/landing/LandingScrollContext";

function VinylDisc() {
  const group = useRef<THREE.Group>(null);
  const label = useRef<THREE.Mesh>(null);
  const { progress } = useLandingScroll();

  useFrame((state) => {
    if (!group.current) return;
    const p = progress;
    const t = state.clock.elapsedTime;

    group.current.position.z = THREE.MathUtils.lerp(-8.5, 2.2, p);
    group.current.position.x = THREE.MathUtils.lerp(4.2, 0.2, p);
    group.current.position.y = THREE.MathUtils.lerp(-0.8, 0.15, Math.min(p * 1.15, 1));
    group.current.rotation.x = THREE.MathUtils.lerp(0.55, 0.25, p);
    group.current.rotation.y = t * (0.65 + p * 1.4);
    group.current.rotation.z = THREE.MathUtils.lerp(0.08, 0, p);

    const scale = THREE.MathUtils.lerp(0.45, 1.55, p);
    group.current.scale.setScalar(scale);

    if (label.current) {
      const mat = label.current.material as THREE.MeshStandardMaterial;
      mat.emissiveIntensity = 0.12 + p * 0.35 + Math.sin(t * 2) * 0.04;
    }
  });

  return (
    <Float speed={1.1} rotationIntensity={0.08} floatIntensity={0.12}>
      <group ref={group} position={[4, -0.5, -8]}>
        <mesh castShadow receiveShadow>
          <cylinderGeometry args={[1.65, 1.65, 0.055, 96]} />
          <meshStandardMaterial color="#050505" metalness={0.72} roughness={0.28} />
        </mesh>
        <mesh position={[0, 0.032, 0]}>
          <cylinderGeometry args={[1.58, 1.58, 0.008, 96]} />
          <meshStandardMaterial color="#111111" metalness={0.5} roughness={0.5} />
        </mesh>
        {[0.35, 0.55, 0.75, 0.95, 1.15, 1.35].map((r) => (
          <mesh key={r} rotation={[Math.PI / 2, 0, 0]} position={[0, 0.028, 0]}>
            <torusGeometry args={[r, 0.0015, 8, 96]} />
            <meshBasicMaterial color="#1a1a1a" transparent opacity={0.55} />
          </mesh>
        ))}
        <mesh ref={label} position={[0, 0.04, 0]}>
          <cylinderGeometry args={[0.62, 0.62, 0.018, 48]} />
          <meshStandardMaterial color="#1d4ed8" emissive="#3b82f6" emissiveIntensity={0.2} metalness={0.3} roughness={0.4} />
        </mesh>
        <mesh position={[0, 0.05, 0]}>
          <cylinderGeometry args={[0.12, 0.12, 0.025, 24]} />
          <meshStandardMaterial color="#030303" metalness={0.9} roughness={0.15} />
        </mesh>
      </group>
    </Float>
  );
}

function OrbitParticles() {
  const ref = useRef<THREE.Points>(null);
  const { progress } = useLandingScroll();
  const positions = useMemo(() => {
    const arr = new Float32Array(240 * 3);
    for (let i = 0; i < 240; i++) {
      const a = Math.random() * Math.PI * 2;
      const r = 2 + Math.random() * 4;
      arr[i * 3] = Math.cos(a) * r;
      arr[i * 3 + 1] = (Math.random() - 0.5) * 3;
      arr[i * 3 + 2] = Math.sin(a) * r - 3;
    }
    return arr;
  }, []);

  useFrame((state) => {
    if (!ref.current) return;
    ref.current.rotation.y = state.clock.elapsedTime * 0.04;
    const mat = ref.current.material as THREE.PointsMaterial;
    mat.opacity = 0.15 + progress * 0.35;
  });

  return (
    <points ref={ref}>
      <bufferGeometry>
        <bufferAttribute attach="attributes-position" args={[positions, 3]} />
      </bufferGeometry>
      <pointsMaterial size={0.025} color="#93c5fd" transparent opacity={0.25} sizeAttenuation blending={THREE.AdditiveBlending} depthWrite={false} />
    </points>
  );
}

function GlowOrb() {
  const ref = useRef<THREE.Mesh>(null);
  const { progress } = useLandingScroll();

  useFrame((state) => {
    if (!ref.current) return;
    const p = progress;
    ref.current.position.z = THREE.MathUtils.lerp(-6, 0, p);
    ref.current.position.x = THREE.MathUtils.lerp(3, 0.5, p);
    ref.current.scale.setScalar(THREE.MathUtils.lerp(0.6, 1.8, p));
    const mat = ref.current.material as THREE.MeshBasicMaterial;
    mat.opacity = 0.06 + p * 0.14 + Math.sin(state.clock.elapsedTime * 0.8) * 0.02;
  });

  return (
    <mesh ref={ref} position={[3, 0, -6]}>
      <sphereGeometry args={[1.2, 32, 32]} />
      <MeshDistortMaterial color="#3b82f6" transparent opacity={0.1} distort={0.35} speed={1.5} />
    </mesh>
  );
}

function Scene() {
  return (
    <>
      <ambientLight intensity={0.45} />
      <directionalLight position={[4, 6, 8]} intensity={1.2} color="#dbeafe" />
      <pointLight position={[-3, 2, 4]} intensity={0.6} color="#8b5cf6" />
      <VinylDisc />
      <GlowOrb />
      <OrbitParticles />
    </>
  );
}

/** Scroll ile yaklaşan sabit vinyl sahnesi */
export function LandingScrollVinyl() {
  const { progress } = useLandingScroll();

  return (
    <div
      className="pointer-events-none fixed inset-0 z-[3] transition-opacity duration-300"
      style={{ opacity: 0.35 + progress * 0.65 }}
      aria-hidden
    >
      <Canvas
        camera={{ position: [0, 0, 6], fov: 42 }}
        dpr={[1, 1.5]}
        gl={{ antialias: true, alpha: true, powerPreference: "low-power" }}
        events={undefined as never}
        className="!h-full !w-full"
      >
        <Suspense fallback={null}>
          <Scene />
        </Suspense>
      </Canvas>
    </div>
  );
}
