'use client';

/**
 * Animated 3D globe-style icon for the "One Platform for Everything
 * YouTube" section. Inspired by Resend's iconography but reframed in
 * TubeForge's indigo/violet palette and YouTube semantics:
 *   - Dark rounded-square frame tile = the "platform"
 *   - Glossy dark sphere wrapped in horizontal latitude bands = the
 *     unified surface holding "everything YouTube"
 *   - Bands rotate as a single rigid group — reads like a globe spinning
 *     on its axis without needing a procedural texture
 *
 * Brand glow underneath the sphere is brand-violet rather than Resend's
 * green, which keeps every 3D element on the page (hero badge, eye orb,
 * platform globe) from the same colour family.
 */
import * as THREE from 'three';
import { Canvas, useFrame } from '@react-three/fiber';
import { ContactShadows, Environment, Lightformer } from '@react-three/drei';
import { useMemo, useRef } from 'react';

function makeRoundedSquareShape(size: number, radius: number) {
  const s = size / 2;
  const r = radius;
  const shape = new THREE.Shape();
  shape.moveTo(-s + r, -s);
  shape.lineTo(s - r, -s);
  shape.quadraticCurveTo(s, -s, s, -s + r);
  shape.lineTo(s, s - r);
  shape.quadraticCurveTo(s, s, s - r, s);
  shape.lineTo(-s + r, s);
  shape.quadraticCurveTo(-s, s, -s, s - r);
  shape.lineTo(-s, -s + r);
  shape.quadraticCurveTo(-s, -s, -s + r, -s);
  shape.closePath();
  return shape;
}

function FrameTile() {
  const shape = useMemo(() => makeRoundedSquareShape(3.4, 0.78), []);
  return (
    <mesh receiveShadow position={[0, 0, -1.3]}>
      <extrudeGeometry
        args={[
          shape,
          {
            depth: 0.4,
            bevelEnabled: true,
            bevelThickness: 0.1,
            bevelSize: 0.1,
            bevelSegments: 8,
            curveSegments: 48,
          },
        ]}
      />
      <meshPhysicalMaterial
        color="#1f1f2e"
        metalness={0.5}
        roughness={0.45}
        clearcoat={0.6}
        clearcoatRoughness={0.25}
        envMapIntensity={1.1}
      />
    </mesh>
  );
}

/**
 * Sphere globe with horizontal latitude bands. Bands are individual
 * thin tori scaled so each one matches the sphere's circumference at
 * that latitude — gives a clean engraved-ring look without textures.
 */
function GlobeSphere() {
  const group = useRef<THREE.Group>(null!);

  // Latitudes (in radians, 0 = equator). Symmetric set above and below.
  const bands = useMemo(() => {
    const lats: number[] = [];
    const step = Math.PI / 9; // 20° steps
    for (let i = -4; i <= 4; i++) lats.push(i * step);
    return lats;
  }, []);

  const RADIUS = 0.78;
  const TUBE = 0.012; // band thickness
  const BAND_OFFSET = 0.002; // sit just above the sphere surface

  useFrame((_, dt) => {
    if (!group.current) return;
    // Slow continuous Y-axis rotation — globe spinning on its pole
    group.current.rotation.y += 0.5 * dt;
    // Tiny axial tilt that breathes
    group.current.rotation.x = Math.sin(performance.now() * 0.0003) * 0.05 - 0.12;
  });

  return (
    <group ref={group} position={[0, 0.05, 0]}>
      {/* Dark indigo glossy sphere body — bumped from near-black to a
          visible dark indigo so the silhouette reads against the page
          background even before the bands catch a highlight */}
      <mesh castShadow>
        <sphereGeometry args={[RADIUS, 96, 96]} />
        <meshPhysicalMaterial
          color="#1e1b4b"
          metalness={0.7}
          roughness={0.22}
          clearcoat={1}
          clearcoatRoughness={0.06}
          envMapIntensity={2.0}
          reflectivity={0.7}
        />
      </mesh>
      {/* Latitude bands — each one is a thin torus sized to ride on the
          sphere surface at its latitude */}
      {bands.map((lat, i) => {
        const r = Math.cos(lat) * RADIUS + BAND_OFFSET;
        const y = Math.sin(lat) * RADIUS;
        return (
          <mesh key={i} position={[0, y, 0]} rotation={[Math.PI / 2, 0, 0]}>
            <torusGeometry args={[r, TUBE, 12, 96]} />
            <meshPhysicalMaterial
              color="#a78bfa"
              emissive="#6366f1"
              emissiveIntensity={0.35}
              metalness={0.6}
              roughness={0.25}
              clearcoat={1}
              envMapIntensity={1.5}
            />
          </mesh>
        );
      })}
      {/* Single vertical meridian for "globe-like" silhouette */}
      <mesh rotation={[0, 0, 0]}>
        <torusGeometry args={[RADIUS + BAND_OFFSET, TUBE, 12, 96]} />
        <meshPhysicalMaterial
          color="#c4b5fd"
          emissive="#8b5cf6"
          emissiveIntensity={0.45}
          metalness={0.6}
          roughness={0.25}
          clearcoat={1}
          envMapIntensity={1.6}
        />
      </mesh>
    </group>
  );
}

export default function PlatformGlobeIcon() {
  return (
    <div
      style={{
        width: '100%',
        height: '100%',
      }}
    >
      <Canvas
        camera={{ position: [0, 0, 7.2], fov: 28 }}
        shadows
        gl={{ alpha: true, antialias: true }}
        dpr={[1, 2]}
        style={{ background: 'transparent' }}
      >
        <ambientLight intensity={0.18} />
        <FrameTile />
        <GlobeSphere />
        {/* Violet floor glow — pushed forward so it casts under the
            sphere onto the visible front face of the tile */}
        <ContactShadows
          opacity={0.7}
          scale={3.6}
          blur={2.4}
          far={2.5}
          position={[0, -1.05, 0.1]}
          color="#7c3aed"
        />
        <Environment resolution={512} background={false}>
          {/* Top key */}
          <Lightformer
            intensity={2.5}
            color="#ffffff"
            position={[0, 5, 3]}
            rotation={[-Math.PI / 2, 0, 0]}
            scale={[6, 6, 1]}
          />
          {/* Left brand wrap — picks up the bands going west */}
          <Lightformer
            intensity={2.4}
            color="#a78bfa"
            position={[-3.5, 1, 3]}
            rotation={[0, Math.PI / 4, 0]}
            scale={[5, 5, 1]}
          />
          {/* Right brand wrap — picks up bands going east */}
          <Lightformer
            intensity={2.2}
            color="#6366f1"
            position={[3.5, 1, 3]}
            rotation={[0, -Math.PI / 4, 0]}
            scale={[5, 5, 1]}
          />
          {/* Bottom violet bounce — boosts the floor glow */}
          <Lightformer
            intensity={1.7}
            color="#8b5cf6"
            position={[0, -2.6, 2]}
            rotation={[Math.PI / 4, 0, 0]}
            scale={[5, 1.5, 1]}
          />
          {/* Back rim accent */}
          <Lightformer
            intensity={1.3}
            color="#c4b5fd"
            position={[0, 0, -3.5]}
            scale={[4, 4, 1]}
          />
        </Environment>
      </Canvas>
    </div>
  );
}
