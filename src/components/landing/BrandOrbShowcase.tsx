'use client';

/**
 * Iridescent eye-camera orb — a glossy sphere that tracks the visitor's
 * cursor across the page. Replaces the previous "play badge inside a
 * tile" composition with a more evocative metaphor: the platform sees
 * what creators see (camera ↔ eye double-meaning).
 *
 * Composition:
 *   - Outer glass shell with `iridescence` for soap-bubble colour shift
 *   - Inner "eyeball" sphere — uniform iridium-pearl material (rotates
 *     as the eye looks but reads as a static surface, so the only thing
 *     visibly moving is the iris)
 *   - Iris (deep indigo, metallic) + pupil (black) + catch-light dot
 *   - Cursor tracking via document-level pointermove → smooth lerp
 */
import * as THREE from 'three';
import { Canvas, useFrame } from '@react-three/fiber';
import { ContactShadows, Environment, Lightformer } from '@react-three/drei';
import { useEffect, useRef } from 'react';

const IRIS_DEPTH = 0.96; // distance from eye centre — sits on front surface
const MAX_LOOK_X = 0.5; // rad, vertical look limit (~28 deg)
const MAX_LOOK_Y = 0.65; // rad, horizontal look limit (~37 deg)
const TRACK_LERP = 0.22; // smoothing factor — higher = snappier eye

function EyeOrb() {
  const eye = useRef<THREE.Group>(null!);
  const target = useRef({ x: 0, y: 0 });

  useEffect(() => {
    const onPointer = (e: PointerEvent) => {
      // Direct NDC → angle mapping. Tested with lookAt() math first but
      // it produced mismatched look directions because the math depended
      // on camera-z and target-z which the user reads as "wrong". A
      // straight linear map from cursor position to look angle gives the
      // expected behaviour: cursor at viewport corner ↔ eye at look
      // limit; cursor at centre ↔ eye facing forward.
      const ndcX = (e.clientX / window.innerWidth) * 2 - 1;
      const ndcY = -((e.clientY / window.innerHeight) * 2 - 1);
      target.current.x = THREE.MathUtils.clamp(-ndcY * MAX_LOOK_X, -MAX_LOOK_X, MAX_LOOK_X);
      target.current.y = THREE.MathUtils.clamp(ndcX * MAX_LOOK_Y, -MAX_LOOK_Y, MAX_LOOK_Y);
    };
    window.addEventListener('pointermove', onPointer);
    return () => window.removeEventListener('pointermove', onPointer);
  }, []);

  useFrame(() => {
    if (!eye.current) return;
    eye.current.rotation.x = THREE.MathUtils.lerp(
      eye.current.rotation.x,
      target.current.x,
      TRACK_LERP,
    );
    eye.current.rotation.y = THREE.MathUtils.lerp(
      eye.current.rotation.y,
      target.current.y,
      TRACK_LERP,
    );
  });

  return (
    <group ref={eye} position={[0, 0.15, 0]}>
      {/* Eyeball — indigo-tinted iridescent surface. Body colour set to
          a pale indigo so the iridescence ramps through the brand
          family (indigo → violet → soft pink) instead of the full
          rainbow. This locks the eye to the same colour story as the
          hero play badge. */}
      <mesh>
        <sphereGeometry args={[1.0, 128, 128]} />
        <meshPhysicalMaterial
          color="#c7d2fe"
          metalness={0.3}
          roughness={0.15}
          clearcoat={1}
          clearcoatRoughness={0.05}
          iridescence={0.85}
          iridescenceIOR={1.42}
          iridescenceThicknessRange={[200, 620]}
          envMapIntensity={2.2}
          reflectivity={0.55}
          sheen={0.5}
          sheenColor="#a5b4fc"
        />
      </mesh>
      {/* Iris — deep brand indigo, slightly recessed gives it an
          anatomical "lens" look rather than a flat decal. Larger than
          v1 so it dominates the front face the way a real iris does. */}
      <mesh position={[0, 0, IRIS_DEPTH - 0.04]}>
        <circleGeometry args={[0.46, 64]} />
        <meshPhysicalMaterial
          color="#3730a3"
          metalness={0.7}
          roughness={0.2}
          clearcoat={1}
          clearcoatRoughness={0.06}
          envMapIntensity={1.8}
        />
      </mesh>
      {/* Iris ring detail — lighter indigo for the iris striations */}
      <mesh position={[0, 0, IRIS_DEPTH - 0.02]}>
        <ringGeometry args={[0.28, 0.44, 64]} />
        <meshPhysicalMaterial
          color="#818cf8"
          metalness={0.5}
          roughness={0.3}
          transparent
          opacity={0.45}
          envMapIntensity={1.4}
        />
      </mesh>
      {/* Pupil — pure black with clearcoat so it still picks up the
          catch-light from the key Lightformer */}
      <mesh position={[0, 0, IRIS_DEPTH]}>
        <circleGeometry args={[0.18, 64]} />
        <meshPhysicalMaterial
          color="#04040a"
          metalness={0.4}
          roughness={0.15}
          clearcoat={1}
          clearcoatRoughness={0.04}
        />
      </mesh>
      {/* Catch-light — primary white dot offset up-left, the "alive"
          sparkle every cartoon eye has */}
      <mesh position={[-0.12, 0.13, IRIS_DEPTH + 0.005]}>
        <circleGeometry args={[0.07, 32]} />
        <meshBasicMaterial color="#ffffff" />
      </mesh>
      {/* Secondary catch-light — smaller, lower-right for extra dimension */}
      <mesh position={[0.08, -0.1, IRIS_DEPTH + 0.003]}>
        <circleGeometry args={[0.028, 24]} />
        <meshBasicMaterial color="#ffffff" />
      </mesh>
    </group>
  );
}

export default function BrandOrbShowcase() {
  return (
    <div
      style={{
        width: '100%',
        height: '100%',
      }}
    >
      <Canvas
        camera={{ position: [0, 0, 6.2], fov: 22 }}
        shadows
        gl={{ alpha: true, antialias: true }}
        dpr={[1, 2]}
        style={{ background: 'transparent' }}
      >
        <ambientLight intensity={0.2} />
        <EyeOrb />
        {/* Tighter floor shadow — kept close under the sphere with a
            small footprint so the violet glow doesn't extend past the
            canvas edges or leak into surrounding text. */}
        <ContactShadows
          opacity={0.3}
          scale={1.9}
          blur={2.6}
          far={1.2}
          position={[0, -0.95, 0]}
          color="#7c3aed"
        />
        {/* Lighting tuned for iridescence — many small angled lights
            give the shell more chromatic shift than a single big key. */}
        <Environment resolution={512} background={false}>
          {/* Top key */}
          <Lightformer
            intensity={2.4}
            color="#ffffff"
            position={[0, 5, 3]}
            rotation={[-Math.PI / 2, 0, 0]}
            scale={[6, 6, 1]}
          />
          {/* Upper-left violet wrap */}
          <Lightformer
            intensity={2.6}
            color="#a78bfa"
            position={[-3, 2.5, 3]}
            rotation={[0, Math.PI / 4, 0]}
            scale={[4, 5, 1]}
          />
          {/* Upper-right indigo wrap */}
          <Lightformer
            intensity={2.4}
            color="#6366f1"
            position={[3, 2.5, 3]}
            rotation={[0, -Math.PI / 4, 0]}
            scale={[4, 5, 1]}
          />
          {/* Cyan grazing light from the side — adds a turquoise edge
              to the iridescence ramp */}
          <Lightformer
            intensity={1.6}
            color="#67e8f9"
            position={[-4, -0.5, 1]}
            rotation={[0, Math.PI / 2, 0]}
            scale={[3, 3, 1]}
          />
          {/* Magenta accent on the opposite side */}
          <Lightformer
            intensity={1.6}
            color="#f0abfc"
            position={[4, -0.5, 1]}
            rotation={[0, -Math.PI / 2, 0]}
            scale={[3, 3, 1]}
          />
          {/* Bottom violet bounce */}
          <Lightformer
            intensity={1.6}
            color="#8b5cf6"
            position={[0, -3, 2]}
            rotation={[Math.PI / 4, 0, 0]}
            scale={[5, 1.5, 1]}
          />
          {/* Back rim — keeps the dark side from going completely flat */}
          <Lightformer
            intensity={1.4}
            color="#c4b5fd"
            position={[0, 0, -3.5]}
            scale={[4, 4, 1]}
          />
        </Environment>
      </Canvas>
    </div>
  );
}
