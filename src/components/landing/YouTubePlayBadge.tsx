'use client';

/**
 * Stationary 3D YouTube play badge — sits centred in the canvas, idle-spins
 * around its vertical axis, and accepts drag-to-rotate input from the
 * pointer. On release, angular velocity is preserved and damps back to
 * the idle spin rate.
 *
 * Materials use MeshPhysicalMaterial with clearcoat + iridescence for a
 * premium plastic-on-glass look. Lighting is a custom Environment built
 * from Lightformers tuned to pick out the bevels on both the card body
 * and the raised play triangle.
 */
import * as THREE from 'three';
import { Canvas, useFrame, type ThreeEvent } from '@react-three/fiber';
import { Environment, Lightformer, ContactShadows } from '@react-three/drei';
import { useEffect, useMemo, useRef, useState } from 'react';

// ----- Geometry helpers ---------------------------------------------------

/** Rounded rectangle outline used for the badge body (extruded for depth). */
function makeRoundedRectShape(width: number, height: number, radius: number) {
  const w = width / 2;
  const h = height / 2;
  const r = radius;
  const shape = new THREE.Shape();
  shape.moveTo(-w + r, -h);
  shape.lineTo(w - r, -h);
  shape.quadraticCurveTo(w, -h, w, -h + r);
  shape.lineTo(w, h - r);
  shape.quadraticCurveTo(w, h, w - r, h);
  shape.lineTo(-w + r, h);
  shape.quadraticCurveTo(-w, h, -w, h - r);
  shape.lineTo(-w, -h + r);
  shape.quadraticCurveTo(-w, -h, -w + r, -h);
  shape.closePath();
  return shape;
}

/** Equilateral-ish play triangle pointing right. */
function makePlayTriangleShape(size: number) {
  const shape = new THREE.Shape();
  shape.moveTo(-size * 0.55, -size * 0.7);
  shape.lineTo(-size * 0.55, size * 0.7);
  shape.lineTo(size * 0.85, 0);
  shape.closePath();
  return shape;
}

// ----- Mesh ---------------------------------------------------------------

function PlayBadgeMesh() {
  const cardShape = useMemo(() => makeRoundedRectShape(3.2, 2.2, 0.42), []);
  const triangleShape = useMemo(() => makePlayTriangleShape(0.8), []);

  // High curve/bevel segment counts — the badge silhouette is the most
  // visible part of the brand, low-poly curves look cheap. Cost is small
  // since the geometry is built once and never re-tessellated.
  const cardExtrude = useMemo(
    () => ({
      depth: 0.42,
      bevelEnabled: true,
      bevelThickness: 0.09,
      bevelSize: 0.09,
      bevelSegments: 10,
      curveSegments: 64,
    }),
    [],
  );

  const triangleExtrude = useMemo(
    () => ({
      depth: 0.06,
      bevelEnabled: true,
      bevelThickness: 0.02,
      bevelSize: 0.02,
      bevelSegments: 6,
      curveSegments: 32,
    }),
    [],
  );

  return (
    <group>
      {/* Indigo card body — TubeForge primary brand colour (#6366f1, same
          as Start Free and the logo tile). Iterated through red and
          indigo with Nikita; he settled on indigo for stronger brand
          identity. Play triangle stays white so the silhouette still
          reads instantly as "video". */}
      <mesh castShadow receiveShadow position={[0, 0, -0.21]}>
        <extrudeGeometry args={[cardShape, cardExtrude]} />
        <meshPhysicalMaterial
          color="#6366f1"
          metalness={0.5}
          roughness={0.2}
          clearcoat={1}
          clearcoatRoughness={0.06}
          envMapIntensity={2.0}
          reflectivity={0.65}
          ior={1.5}
          sheen={0.4}
          sheenColor="#a5b4fc"
        />
      </mesh>
      {/* White play triangle, raised slightly above the front face */}
      <mesh castShadow position={[0, 0, 0.26]}>
        <extrudeGeometry args={[triangleShape, triangleExtrude]} />
        <meshPhysicalMaterial
          color="#ffffff"
          metalness={0.18}
          roughness={0.12}
          clearcoat={1}
          clearcoatRoughness={0.04}
          envMapIntensity={2.2}
          reflectivity={0.75}
        />
      </mesh>
    </group>
  );
}

// ----- Spinning, draggable group -----------------------------------------

// Idle motion is a slow sine-wave wobble around the Y-axis, never going
// past ±~40° so the play triangle is always at least partially visible.
// Full 360° rotation made the card disappear edge-on for a chunk of every
// revolution, which read as "broken" rather than "premium".
const IDLE_AMPLITUDE = 0.7; // ≈ ±40° on Y
const IDLE_FREQUENCY = 0.45; // rad/s — full sway every ~14s
const IDLE_BLEND_RATE = 1.5; // how fast we lerp back to the idle pattern after release
const POINTER_SENSITIVITY = 0.0085; // rad per pixel
const MOMENTUM_DAMPING = 0.93; // post-release angular-velocity decay (per frame at 60fps)

function SpinningBadge() {
  const group = useRef<THREE.Group>(null!);
  const time = useRef(0);
  const [hovered, setHovered] = useState(false);
  const [dragging, setDragging] = useState(false);

  // Post-release momentum — applied on top of the idle wobble so a flick
  // feels alive rather than snapping straight back.
  const angularVelY = useRef(0);
  const angularVelX = useRef(0);
  const lastPointer = useRef<{ x: number; y: number } | null>(null);

  // Cursor feedback
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
      // Decaying drag momentum
      angularVelY.current *= MOMENTUM_DAMPING;
      angularVelX.current *= MOMENTUM_DAMPING;
      // Idle target: gentle sine wobble on Y, X resting at neutral
      const targetY = Math.sin(time.current * IDLE_FREQUENCY) * IDLE_AMPLITUDE
        + angularVelY.current;
      const targetX = angularVelX.current * 0.5;
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
    // While dragging we freeze the wobble timer so release blends back smoothly
    angularVelY.current = 0;
    angularVelX.current = 0;
  };

  const onPointerMove = (e: ThreeEvent<PointerEvent>) => {
    if (!dragging || !lastPointer.current || !group.current) return;
    const dx = e.clientX - lastPointer.current.x;
    const dy = e.clientY - lastPointer.current.y;
    group.current.rotation.y += dx * POINTER_SENSITIVITY;
    group.current.rotation.x += dy * POINTER_SENSITIVITY;
    // Re-sync the idle phase to match where we just stopped — feels more
    // continuous than snapping to wherever the sine happens to be.
    time.current = Math.asin(
      Math.max(-1, Math.min(1, group.current.rotation.y / IDLE_AMPLITUDE)),
    ) / IDLE_FREQUENCY;
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
      <PlayBadgeMesh />
    </group>
  );
}

// ----- Public component ---------------------------------------------------

interface YouTubePlayBadgeProps {
  className?: string;
  style?: React.CSSProperties;
}

export default function YouTubePlayBadge({
  className,
  style,
}: YouTubePlayBadgeProps) {
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
        camera={{ position: [0, 0, 6.5], fov: 32 }}
        shadows
        gl={{ alpha: true, antialias: true, preserveDrawingBuffer: false }}
        dpr={[1, 2]}
        style={{ background: 'transparent' }}
      >
        <ambientLight intensity={0.25} />
        {/* Soft contact shadow underneath the badge — anchors it visually
            without committing to a fully lit ground plane */}
        <ContactShadows
          opacity={0.4}
          scale={6}
          blur={2.5}
          far={4}
          position={[0, -1.6, 0]}
          color="#000000"
        />
        <SpinningBadge />
        {/* Custom Environment built entirely from area lights — gives clean,
            controllable reflections rather than the noise of an HDRI photo. */}
        <Environment resolution={512} background={false}>
          {/* Top key — broad rectangle for soft top-down highlight */}
          <Lightformer
            intensity={3}
            color="#ffffff"
            position={[0, 5, 2]}
            rotation={[-Math.PI / 2, 0, 0]}
            scale={[10, 10, 1]}
          />
          {/* Front-left rim — pure white to keep the triangle pristine */}
          <Lightformer
            intensity={2.4}
            color="#ffffff"
            position={[-3, 1, 4]}
            rotation={[0, Math.PI / 4, 0]}
            scale={[6, 4, 1]}
          />
          {/* Front-right rim — slight cool tint to complement the indigo body */}
          <Lightformer
            intensity={2.0}
            color="#e0e7ff"
            position={[3, 1, 4]}
            rotation={[0, -Math.PI / 4, 0]}
            scale={[6, 4, 1]}
          />
          {/* Brand under-glow — bounces violet into the card's bottom edge */}
          <Lightformer
            intensity={1.8}
            color="#8b5cf6"
            position={[0, -2.5, 3]}
            rotation={[Math.PI / 4, 0, 0]}
            scale={[8, 2, 1]}
          />
          {/* Deep-indigo back accent — gives the rear bevel a hint of brand */}
          <Lightformer
            intensity={1.4}
            color="#4f46e5"
            position={[0, 0, -4]}
            scale={[6, 4, 1]}
          />
        </Environment>
      </Canvas>
    </div>
  );
}
