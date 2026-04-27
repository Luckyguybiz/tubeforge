'use client';

/**
 * Interactive 3D YouTube "play" badge — hangs from invisible rope in
 * physics space, drag to swing/throw, gravity returns it home.
 * Inspired by Resend's hero card; geometry rebuilt around the iconic
 * red rounded rectangle + white play triangle.
 *
 * Renders inside its own <Canvas>; all physics state stays scoped to
 * this component so it can be lazy-loaded with `ssr: false` and never
 * blocks LCP on the marketing page.
 */
import * as THREE from 'three';
import { Canvas, useFrame, type ThreeEvent } from '@react-three/fiber';
import { Environment, Lightformer } from '@react-three/drei';
import {
  BallCollider,
  CuboidCollider,
  Physics,
  RigidBody,
  useRopeJoint,
  type RapierRigidBody,
} from '@react-three/rapier';
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

  const cardExtrude = useMemo(
    () => ({
      depth: 0.4,
      bevelEnabled: true,
      bevelThickness: 0.08,
      bevelSize: 0.08,
      bevelSegments: 6,
      curveSegments: 32,
    }),
    [],
  );

  const triangleExtrude = useMemo(
    () => ({
      depth: 0.06,
      bevelEnabled: true,
      bevelThickness: 0.025,
      bevelSize: 0.025,
      bevelSegments: 4,
      curveSegments: 16,
    }),
    [],
  );

  return (
    <group>
      {/* Red card body */}
      <mesh castShadow receiveShadow position={[0, 0, -0.2]}>
        <extrudeGeometry args={[cardShape, cardExtrude]} />
        <meshPhysicalMaterial
          color="#FF0033"
          metalness={0.35}
          roughness={0.32}
          clearcoat={0.9}
          clearcoatRoughness={0.18}
          envMapIntensity={1.4}
        />
      </mesh>
      {/* White play triangle, raised slightly above the front face */}
      <mesh castShadow position={[0, 0, 0.24]}>
        <extrudeGeometry args={[triangleShape, triangleExtrude]} />
        <meshPhysicalMaterial
          color="#ffffff"
          metalness={0.05}
          roughness={0.18}
          clearcoat={0.9}
          clearcoatRoughness={0.12}
          envMapIntensity={1.6}
        />
      </mesh>
    </group>
  );
}

// ----- Physics card with rope --------------------------------------------

interface CardProps {
  /** Anchor (top of the rope) in world coordinates. */
  anchor?: [number, number, number];
}

function Card({ anchor = [0, 3.0, 0] }: CardProps) {
  const fixed = useRef<RapierRigidBody>(null!);
  const j1 = useRef<RapierRigidBody>(null!);
  const j2 = useRef<RapierRigidBody>(null!);
  const j3 = useRef<RapierRigidBody>(null!);
  const card = useRef<RapierRigidBody>(null!);

  // Three-segment rope: anchor → j1 → j2 → j3 → card top.
  // Short segments (0.4 each) keep the badge close to the anchor for a tight,
  // controllable swing rather than a long pendulum, and ensure the card
  // settles in the visible viewport rather than falling off-screen.
  useRopeJoint(fixed, j1, [[0, 0, 0], [0, 0, 0], 0.4]);
  useRopeJoint(j1, j2, [[0, 0, 0], [0, 0, 0], 0.4]);
  useRopeJoint(j2, j3, [[0, 0, 0], [0, 0, 0], 0.4]);
  useRopeJoint(j3, card, [[0, 0, 0], [0, 1.1, 0], 0.4]);

  const [hovered, setHovered] = useState(false);
  const [dragging, setDragging] = useState<THREE.Vector3 | false>(false);

  useEffect(() => {
    if (!hovered && !dragging) return;
    document.body.style.cursor = dragging ? 'grabbing' : 'grab';
    return () => {
      document.body.style.cursor = 'auto';
    };
  }, [hovered, dragging]);

  // Working scratch vectors, allocated once.
  const dragTarget = useMemo(() => new THREE.Vector3(), []);
  const cameraDir = useMemo(() => new THREE.Vector3(), []);

  useFrame((state, dt) => {
    if (dragging && card.current) {
      // Project pointer onto the card's z-plane and move card via kinematic
      // translation. We freeze rotation while dragging to avoid spinning.
      dragTarget
        .set(state.pointer.x, state.pointer.y, 0.5)
        .unproject(state.camera);
      cameraDir.copy(dragTarget).sub(state.camera.position).normalize();
      const distance = -state.camera.position.z / cameraDir.z;
      const worldPoint = state.camera.position
        .clone()
        .add(cameraDir.multiplyScalar(distance));
      card.current.setNextKinematicTranslation({
        x: worldPoint.x - dragging.x,
        y: worldPoint.y - dragging.y,
        z: worldPoint.z - dragging.z,
      });
    }
    // Frame-rate-independent damping nudge — keeps idle motion subtle.
    void dt;
  });

  return (
    <>
      {/* Anchor — fixed in world space, holds the top of the rope */}
      <RigidBody ref={fixed} type="fixed" position={anchor} />
      {/* Three intermediate joints to give the rope visible "give" */}
      <RigidBody position={[anchor[0], anchor[1] - 0.6, anchor[2]]} ref={j1}>
        <BallCollider args={[0.1]} />
      </RigidBody>
      <RigidBody position={[anchor[0], anchor[1] - 1.2, anchor[2]]} ref={j2}>
        <BallCollider args={[0.1]} />
      </RigidBody>
      <RigidBody position={[anchor[0], anchor[1] - 1.8, anchor[2]]} ref={j3}>
        <BallCollider args={[0.1]} />
      </RigidBody>
      {/* The badge itself */}
      <RigidBody
        ref={card}
        position={[anchor[0], anchor[1] - 2.0, anchor[2]]}
        angularDamping={3.5}
        linearDamping={3.5}
        type={dragging ? 'kinematicPosition' : 'dynamic'}
      >
        <CuboidCollider args={[1.6, 1.1, 0.22]} />
        <group
          onPointerOver={() => setHovered(true)}
          onPointerOut={() => setHovered(false)}
          onPointerDown={(e: ThreeEvent<PointerEvent>) => {
            e.stopPropagation();
            (e.target as Element).setPointerCapture?.(e.pointerId);
            const t = card.current.translation();
            setDragging(
              new THREE.Vector3().copy(e.point).sub(new THREE.Vector3(t.x, t.y, t.z)),
            );
          }}
          onPointerUp={(e: ThreeEvent<PointerEvent>) => {
            (e.target as Element).releasePointerCapture?.(e.pointerId);
            setDragging(false);
          }}
        >
          <PlayBadgeMesh />
        </group>
      </RigidBody>
    </>
  );
}

// ----- Public component ---------------------------------------------------

interface YouTubePlayBadgeProps {
  /** Optional className applied to the wrapping div for layout sizing. */
  className?: string;
  /** Optional inline style applied to the wrapping div. */
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
        camera={{ position: [0, 0, 11], fov: 30 }}
        shadows
        gl={{ alpha: true, antialias: true }}
        dpr={[1, 2]}
        style={{ background: 'transparent' }}
      >
        <ambientLight intensity={0.35} />
        <Physics interpolate gravity={[0, -20, 0]} timeStep={1 / 60}>
          <Card anchor={[0, 3.0, 0]} />
        </Physics>
        <Environment blur={0.75} background={false}>
          {/* Cool key light from upper left */}
          <Lightformer
            intensity={2.2}
            color="#ffffff"
            position={[-3, 4, 6]}
            rotation={[0, 0, Math.PI / 3]}
            scale={[10, 0.4, 1]}
          />
          {/* Warm rim light from below — picks out the play triangle bevel */}
          <Lightformer
            intensity={1.6}
            color="#ff7777"
            position={[0, -3, 4]}
            rotation={[0, 0, Math.PI / 3]}
            scale={[10, 0.3, 1]}
          />
          {/* Brand purple accent from the right */}
          <Lightformer
            intensity={1.2}
            color="#8b5cf6"
            position={[5, 0, 5]}
            rotation={[0, Math.PI / 3, 0]}
            scale={[6, 1, 1]}
          />
          {/* Soft fill from front */}
          <Lightformer
            intensity={0.6}
            color="#ffeeee"
            position={[0, 0, 8]}
            scale={[10, 10, 1]}
          />
        </Environment>
      </Canvas>
    </div>
  );
}
