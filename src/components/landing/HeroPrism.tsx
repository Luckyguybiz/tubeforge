'use client';

/**
 * HeroPrism — a slowly-rotating iridescent crystal/octahedron sitting in
 * the landing hero. Premium "glass-with-rainbow-shift" aesthetic shared
 * with Linear, Resend and Vercel hero compositions. No play-button
 * shape, no eye shape, no YouTube-trademark imagery — purely abstract.
 *
 * Composition:
 *   - Octahedron (8-face crystal) with bevelled edges via boxGeometry +
 *     scaling so the silhouette reads cleanly at any rotation
 *   - MeshPhysicalMaterial with iridescence (soap-bubble colour shift),
 *     clearcoat (wet-glass top layer) and high reflectivity
 *   - Brand glow underneath via violet Lightformer keeps the colour
 *     family consistent with the rest of the landing page
 *
 * Interaction:
 *   - Idle: continuous slow rotation around Y axis + gentle wobble on X
 *   - Pointer drag: user can grab and spin the crystal, momentum decays
 *     back to idle rotation after release
 */
import * as THREE from 'three';
import { Canvas, useFrame, type ThreeEvent } from '@react-three/fiber';
import { Environment, Lightformer, ContactShadows } from '@react-three/drei';
import { useEffect, useMemo, useRef, useState } from 'react';

// ----- Animation constants ------------------------------------------------

const IDLE_SPEED_Y = 0.22; // rad/s — full rotation every ~18s
const IDLE_AMPLITUDE_X = 0.22; // ≈ ±10° wobble on X (depth tilt)
const IDLE_FREQUENCY_X = 0.32; // rad/s — wobble cycle every ~20s
const POINTER_SENSITIVITY = 0.0075;
const MOMENTUM_DAMPING = 0.94;
const IDLE_BLEND_RATE = 1.2;

// ----- Crystal mesh -------------------------------------------------------

function CrystalMesh() {
  // Octahedron is a 6-vertex, 8-face polyhedron. Default radius 1 — we
  // scale slightly tall on Y to elongate the silhouette, which photographs
  // better than a uniform sphere-like shape.
  const geometry = useMemo(() => new THREE.SphereGeometry(1.35, 96, 96), []);

  return (
    <mesh castShadow receiveShadow geometry={geometry}>
      <meshPhysicalMaterial
        color="#a5b4fc"
        metalness={0.35}
        roughness={0.08}
        clearcoat={1}
        clearcoatRoughness={0.05}
        envMapIntensity={2.5}
        reflectivity={0.85}
        ior={1.55}
        iridescence={1}
        iridescenceIOR={1.4}
        iridescenceThicknessRange={[200, 720]}
        sheen={0.6}
        sheenColor="#c4b5fd"
        attenuationColor="#818cf8"
        attenuationDistance={1.4}
      />
    </mesh>
  );
}

// ----- Rotating, draggable group -----------------------------------------

function SpinningCrystal() {
  const group = useRef<THREE.Group>(null!);
  const time = useRef(0);
  const [hovered, setHovered] = useState(false);
  const [dragging, setDragging] = useState(false);

  // Continuous idle rotation accumulator + post-release momentum
  const idleRotY = useRef(0);
  const angularVelY = useRef(0);
  const angularVelX = useRef(0);
  const lastPointer = useRef<{ x: number; y: number } | null>(null);

  useEffect(() => {
    if (!hovered && !dragging) return;
    document.body.style.cursor = dragging ? 'grabbing' : 'grab';
    return () => {
      document.body.style.cursor = 'auto';
    };
  }, [hovered, dragging]);

  useFrame((_, dt) => {
    if (!group.current) return;
    time.current += dt;

    if (!dragging) {
      // Damping for drag-throw momentum
      angularVelY.current *= MOMENTUM_DAMPING;
      angularVelX.current *= MOMENTUM_DAMPING;

      // Idle Y rotation accumulates over time (continuous spin)
      idleRotY.current += IDLE_SPEED_Y * dt;
      const targetY = idleRotY.current + angularVelY.current;
      // Idle X wobble — gentle sine
      const targetX = Math.sin(time.current * IDLE_FREQUENCY_X) * IDLE_AMPLITUDE_X
        + angularVelX.current;

      group.current.rotation.y = THREE.MathUtils.lerp(
        group.current.rotation.y,
        targetY,
        Math.min(1, dt * IDLE_BLEND_RATE),
      );
      group.current.rotation.x = THREE.MathUtils.lerp(
        group.current.rotation.x,
        targetX,
        Math.min(1, dt * IDLE_BLEND_RATE * 1.5),
      );
    }
  });

  const onPointerDown = (e: ThreeEvent<PointerEvent>) => {
    e.stopPropagation();
    (e.target as Element).setPointerCapture?.(e.pointerId);
    setDragging(true);
    lastPointer.current = { x: e.clientX, y: e.clientY };
    angularVelY.current = 0;
    angularVelX.current = 0;
    // Reset idle accumulator to match current orientation so release
    // does not snap back to a different angle
    idleRotY.current = group.current?.rotation.y ?? 0;
  };

  const onPointerMove = (e: ThreeEvent<PointerEvent>) => {
    if (!dragging || !lastPointer.current || !group.current) return;
    const dx = e.clientX - lastPointer.current.x;
    const dy = e.clientY - lastPointer.current.y;
    group.current.rotation.y += dx * POINTER_SENSITIVITY;
    group.current.rotation.x += dy * POINTER_SENSITIVITY;
    idleRotY.current = group.current.rotation.y;
    angularVelY.current = dx * POINTER_SENSITIVITY * 60;
    angularVelX.current = dy * POINTER_SENSITIVITY * 60;
    lastPointer.current = { x: e.clientX, y: e.clientY };
  };

  const onPointerUp = (e: ThreeEvent<PointerEvent>) => {
    (e.target as Element).releasePointerCapture?.(e.pointerId);
    setDragging(false);
    lastPointer.current = null;
  };

  return (
    <group
      ref={group}
      onPointerOver={() => setHovered(true)}
      onPointerOut={() => setHovered(false)}
      onPointerDown={onPointerDown}
      onPointerMove={onPointerMove}
      onPointerUp={onPointerUp}
      onPointerCancel={onPointerUp}
    >
      <CrystalMesh />
    </group>
  );
}

// ----- Public component ---------------------------------------------------

interface HeroPrismProps {
  className?: string;
  style?: React.CSSProperties;
}

export default function HeroPrism({ className, style }: HeroPrismProps) {
  return (
    <div
      className={className}
      style={{
        width: '100%',
        height: '100%',
        ...style,
      }}
    >
      <Canvas
        camera={{ position: [0, 0, 6.4], fov: 32 }}
        shadows
        gl={{ alpha: true, antialias: true, preserveDrawingBuffer: false }}
        dpr={[1, 2]}
        style={{ background: 'transparent' }}
      >
        <ambientLight intensity={0.3} />
        <ContactShadows
          opacity={0.35}
          scale={6}
          blur={2.6}
          far={4}
          position={[0, -2.1, 0]}
          color="#000000"
        />
        <SpinningCrystal />
        {/* Lightformer-based environment for clean, controllable reflections
            rather than HDRI noise. Same brand colour family as the rest of
            the landing page (indigo / violet / fuchsia). */}
        <Environment resolution={512} background={false}>
          {/* Top key — broad rectangle for soft top-down highlight */}
          <Lightformer
            intensity={2.8}
            color="#ffffff"
            position={[0, 5, 2]}
            rotation={[-Math.PI / 2, 0, 0]}
            scale={[10, 10, 1]}
          />
          {/* Front-left rim — pure white to keep the iridescence pristine */}
          <Lightformer
            intensity={2.2}
            color="#ffffff"
            position={[-3.5, 1, 4]}
            rotation={[0, Math.PI / 4, 0]}
            scale={[6, 5, 1]}
          />
          {/* Front-right rim — cool indigo tint for brand cohesion */}
          <Lightformer
            intensity={2.0}
            color="#e0e7ff"
            position={[3.5, 1, 4]}
            rotation={[0, -Math.PI / 4, 0]}
            scale={[6, 5, 1]}
          />
          {/* Under-glow — violet bounce on the bottom face */}
          <Lightformer
            intensity={1.9}
            color="#8b5cf6"
            position={[0, -3, 2.5]}
            rotation={[Math.PI / 4, 0, 0]}
            scale={[8, 2, 1]}
          />
          {/* Back accent — deep fuchsia for rear-edge separation */}
          <Lightformer
            intensity={1.5}
            color="#c026d3"
            position={[0, 0.5, -4]}
            scale={[6, 5, 1]}
          />
        </Environment>
      </Canvas>
    </div>
  );
}
