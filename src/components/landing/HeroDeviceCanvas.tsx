"use client";

import { Suspense, useLayoutEffect, useMemo, useRef } from "react";
import { Canvas, useFrame, useThree } from "@react-three/fiber";
import { Bounds, OrbitControls, RoundedBox, useGLTF } from "@react-three/drei";
import * as THREE from "three";
import type { HeroDeviceLayout, HeroDeviceSideLayout } from "@/lib/hero-device-layout";

function DeviceSubtree({
  clone,
  side,
}: {
  clone: THREE.Object3D;
  side: HeroDeviceSideLayout;
}) {
  const inner = <primitive object={clone} />;
  return (
    <group
      position={[...side.position] as [number, number, number]}
      rotation={[...side.rotation] as [number, number, number]}
      scale={side.scale}
    >
      {side.useBounds ? (
        (<Bounds fit={false} observe={false} margin={side.boundsMargin}>
          {inner}
        </Bounds>)
      ) : (
        inner
      )}
    </group>
  );
}

function HeroCameraSync(
  {
    layout,
    orbitPreview,
  }: {
    layout: HeroDeviceLayout;
    orbitPreview?: boolean;
  }
) {
  const { camera, invalidate } = useThree();
  const [x, y, z] = layout.camera.position;
  const { fov } = layout.camera;

  useLayoutEffect(() => {
    if (orbitPreview) return;
    camera.position.set(x, y, z);
    if (camera instanceof THREE.PerspectiveCamera) {
      camera.fov = fov;
      camera.updateProjectionMatrix();
    }
    invalidate();
  }, [camera, invalidate, x, y, z, fov, orbitPreview]);

  return null;
}

function DevicePair({
  phonePath,
  laptopPath,
  reduceMotion,
  layout,
}: {
  phonePath: string;
  laptopPath: string;
  reduceMotion: boolean;
  layout: HeroDeviceLayout;
}) {
  const phoneGltf = useGLTF(phonePath);
  const laptopGltf = useGLTF(laptopPath);
  const phoneClone = useMemo(() => phoneGltf.scene.clone(true), [phoneGltf.scene]);
  const laptopClone = useMemo(() => laptopGltf.scene.clone(true), [laptopGltf.scene]);
  const rootRef = useRef<THREE.Group>(null);
  const t = useRef(0);

  useLayoutEffect(() => {
    for (const obj of [phoneClone, laptopClone]) {
      obj.traverse((child) => {
        if (child instanceof THREE.Mesh) {
          child.castShadow = true;
          child.receiveShadow = true;
        }
      });
    }
  }, [phoneClone, laptopClone]);

  useFrame((_, delta) => {
    if (reduceMotion || !rootRef.current) return;
    t.current += delta;
    rootRef.current.rotation.y = Math.sin(t.current * 0.22) * 0.04;
  });

  return (
    <group ref={rootRef}>
      <DeviceSubtree clone={phoneClone} side={layout.phone} />
      <DeviceSubtree clone={laptopClone} side={layout.laptop} />
    </group>
  );
}

function DevicePairPlaceholders({
  reduceMotion,
  layout,
}: {
  reduceMotion: boolean;
  layout: HeroDeviceLayout;
}) {
  const rootRef = useRef<THREE.Group>(null);
  const t = useRef(0);

  useFrame((_, delta) => {
    if (reduceMotion || !rootRef.current) return;
    t.current += delta;
    rootRef.current.rotation.y = Math.sin(t.current * 0.22) * 0.04;
  });

  const { phone, laptop } = layout;

  return (
    <group ref={rootRef}>
      <group
        position={[...phone.position] as [number, number, number]}
        rotation={[...phone.rotation] as [number, number, number]}
        scale={phone.scale}
      >
        <RoundedBox args={[0.38, 0.84, 0.14]} radius={0.04} smoothness={4}>
          <meshStandardMaterial color="#2a2d38" metalness={0.35} roughness={0.45} />
        </RoundedBox>
        <mesh position={[0, 0, 0.075]}>
          <planeGeometry args={[0.3, 0.68]} />
          <meshBasicMaterial color="#0f121c" />
        </mesh>
      </group>
      <group
        position={[...laptop.position] as [number, number, number]}
        rotation={[...laptop.rotation] as [number, number, number]}
        scale={laptop.scale}
      >
        <RoundedBox args={[1.15, 0.08, 0.78]} radius={0.02} smoothness={3} position={[0, -0.28, 0]}>
          <meshStandardMaterial color="#343848" metalness={0.25} roughness={0.5} />
        </RoundedBox>
        <RoundedBox args={[1.12, 0.72, 0.08]} radius={0.03} smoothness={4} position={[0, 0.08, -0.34]}>
          <meshStandardMaterial color="#343848" metalness={0.25} roughness={0.5} />
        </RoundedBox>
        <mesh position={[0, 0.08, -0.3]} rotation={[-0.2, 0, 0]}>
          <planeGeometry args={[1.02, 0.58]} />
          <meshStandardMaterial
            color="#1c2030"
            metalness={0.15}
            roughness={0.35}
            emissive="#1a2240"
            emissiveIntensity={0.35}
          />
        </mesh>
      </group>
    </group>
  );
}

type HeroDeviceCanvasBase = {
  reduceMotion: boolean;
  layout: HeroDeviceLayout;
  orbitPreview?: boolean
};

export type HeroDeviceCanvasProps =
  | (HeroDeviceCanvasBase & { placeholders: true })
  | (HeroDeviceCanvasBase & { phonePath: string; laptopPath: string });

type HeroDeviceGltfProps = Extract<HeroDeviceCanvasProps, { phonePath: string }>;

export default function HeroDeviceCanvas(props: HeroDeviceCanvasProps) {
  const usePlaceholders = "placeholders" in props && props.placeholders;
  const { layout, orbitPreview } = props;
  const cam = layout.camera;

  return (
    <Canvas
      className="h-full min-h-[min(280px,45vh)] w-full touch-none"
      dpr={[1, 2]}
      gl={{
        alpha: true,
        antialias: true,
        powerPreference: "high-performance",
      }}
      onCreated={({ gl }) => {
        gl.setClearColor(0x000000, 0);
        gl.outputColorSpace = THREE.SRGBColorSpace;
        gl.toneMapping = THREE.ACESFilmicToneMapping;
        gl.toneMappingExposure = 1.14;
      }}
      camera={{
        position: [...cam.position] as [number, number, number],
        fov: cam.fov,
        near: 0.05,
        far: 120,
      }}
    >
      <ambientLight intensity={0.65} />
      <hemisphereLight args={["#e8eef8", "#1a1a22", 0.45]} />
      <directionalLight position={[6, 8, 6]} intensity={1.05} color="#ffffff" />
      <directionalLight position={[-5, 3, 3]} intensity={0.45} color="#a5c4ff" />
      <directionalLight position={[0, -3, 5]} intensity={0.2} color="#404558" />
      <HeroCameraSync layout={layout} orbitPreview={orbitPreview} />
      {orbitPreview ? <OrbitControls enableDamping dampingFactor={0.08} /> : null}
      {usePlaceholders ? (
        <DevicePairPlaceholders reduceMotion={props.reduceMotion} layout={layout} />
      ) : (
        <Suspense fallback={null}>
          <DevicePair {...(props as HeroDeviceGltfProps)} />
        </Suspense>
      )}
    </Canvas>
  );
}
