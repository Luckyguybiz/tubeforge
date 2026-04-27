'use client';

/**
 * Animated 3D brand orb in an iOS-icon-style frame, used as the visual
 * anchor above the "Trusted by creators worldwide" social-proof block.
 * Inspired by Resend's marketing icons; geometry and palette rebuilt
 * around TubeForge's indigo/violet brand colours.
 *
 * Composition:
 *   - Rounded dark "tile" backdrop (extruded rounded square)
 *   - Glossy dark orb floating in front, slowly rotating around Y
 *   - Floor contact shadow tinted violet (matches the bottom-glow lights)
 *   - Five Lightformers wrap brand-purple highlights around the orb
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
  const shape = useMemo(() => makeRoundedSquareShape(4.4, 1.05), []);
  return (
    <mesh receiveShadow position={[0, 0, -1.5]}>
      <extrudeGeometry
        args={[
          shape,
          {
            depth: 0.45,
            bevelEnabled: true,
            bevelThickness: 0.12,
            bevelSize: 0.12,
            bevelSegments: 8,
            curveSegments: 48,
          },
        ]}
      />
      <meshPhysicalMaterial
        color="#181826"
        metalness={0.45}
        roughness={0.55}
        clearcoat={0.5}
        clearcoatRoughness={0.3}
        envMapIntensity={0.8}
      />
    </mesh>
  );
}

function Orb() {
  const ref = useRef<THREE.Mesh>(null!);

  // Idle continuous Y-rotation. Sphere has no obvious "front" so a full
  // 360° spin reads as a smooth shimmer rather than the back-side
  // disappearance that plagued the YouTube badge.
  useFrame((_, dt) => {
    if (ref.current) {
      ref.current.rotation.y += 0.35 * dt;
      // Tiny axial wobble to make the highlights feel alive
      ref.current.rotation.x = Math.sin(performance.now() * 0.0003) * 0.06;
    }
  });

  return (
    <mesh ref={ref} castShadow position={[0, 0.1, 0]}>
      <sphereGeometry args={[1.05, 96, 96]} />
      <meshPhysicalMaterial
        color="#0c0c14"
        metalness={0.95}
        roughness={0.12}
        clearcoat={1}
        clearcoatRoughness={0.04}
        envMapIntensity={2.6}
        reflectivity={0.85}
      />
    </mesh>
  );
}

export default function BrandOrbShowcase() {
  return (
    <div
      style={{
        width: '100%',
        height: '100%',
        minHeight: 200,
      }}
    >
      <Canvas
        camera={{ position: [0, 0, 5.6], fov: 30 }}
        shadows
        gl={{ alpha: true, antialias: true }}
        dpr={[1, 2]}
        style={{ background: 'transparent' }}
      >
        <ambientLight intensity={0.18} />
        <FrameTile />
        <Orb />
        {/* Violet floor contact shadow — gives the orb a real "weight"
            and pushes brand colour into the bottom of the tile */}
        <ContactShadows
          opacity={0.7}
          scale={4.5}
          blur={2.3}
          far={3}
          position={[0, -1.35, 0]}
          color="#7c3aed"
        />
        <Environment resolution={512} background={false}>
          {/* Top key — broad white highlight along the orb's upper meridian */}
          <Lightformer
            intensity={2.6}
            color="#ffffff"
            position={[0, 5, 3]}
            rotation={[-Math.PI / 2, 0, 0]}
            scale={[8, 8, 1]}
          />
          {/* Left brand wrap — violet streak that travels along the equator */}
          <Lightformer
            intensity={2.4}
            color="#a78bfa"
            position={[-3.5, 0.5, 3.5]}
            rotation={[0, Math.PI / 4, 0]}
            scale={[5, 6, 1]}
          />
          {/* Right brand wrap — indigo on the opposite side for symmetry */}
          <Lightformer
            intensity={2.2}
            color="#6366f1"
            position={[3.5, 0.5, 3.5]}
            rotation={[0, -Math.PI / 4, 0]}
            scale={[5, 6, 1]}
          />
          {/* Bottom glow — deep violet bouncing up under the orb */}
          <Lightformer
            intensity={1.6}
            color="#8b5cf6"
            position={[0, -2.5, 2]}
            rotation={[Math.PI / 4, 0, 0]}
            scale={[6, 1.6, 1]}
          />
          {/* Back rim — gives the orb a thin bright crescent on the dark side */}
          <Lightformer
            intensity={1.5}
            color="#c4b5fd"
            position={[0, 0, -3.5]}
            scale={[5, 5, 1]}
          />
        </Environment>
      </Canvas>
    </div>
  );
}
