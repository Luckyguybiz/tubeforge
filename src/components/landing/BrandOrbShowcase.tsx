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
const MAX_LOOK_X = 0.55; // rad, vertical look limit (~31 deg)
const MAX_LOOK_Y = 0.7; // rad, horizontal look limit (~40 deg)
const TRACK_LERP = 0.18; // smoothing factor — higher = snappier eye

function EyeOrb() {
  const eye = useRef<THREE.Group>(null!);
  const targetWorld = useRef(new THREE.Vector3(0, 0, 5));
  const smoothedTarget = useRef(new THREE.Vector3(0, 0, 5));
  const tmpQuat = useRef(new THREE.Quaternion());
  const tmpEuler = useRef(new THREE.Euler());

  useEffect(() => {
    const onPointer = (e: PointerEvent) => {
      // Normalise the cursor position to clip-space (-1..1) over the
      // whole viewport, then project onto a plane in front of the eye.
      // Using a real world point (not just an Euler magnitude) means the
      // iris actually points AT the cursor instead of approximating with
      // independent X/Y rotations.
      const ndcX = (e.clientX / window.innerWidth) * 2 - 1;
      const ndcY = -((e.clientY / window.innerHeight) * 2 - 1);
      // Wide horizontal/vertical span (12 x 7 world units at z = 5)
      // gives the eye plenty of "reach" before the lookAt clamp kicks in.
      targetWorld.current.set(ndcX * 12, ndcY * 7, 5);
    };
    window.addEventListener('pointermove', onPointer);
    return () => window.removeEventListener('pointermove', onPointer);
  }, []);

  useFrame(() => {
    if (!eye.current) return;
    // Smoothly chase the world-space target (lerp on the target, not the
    // rotation, so we maintain proper 3D angles end-to-end).
    smoothedTarget.current.lerp(targetWorld.current, TRACK_LERP);
    // Build a lookAt rotation from the eye centre toward the smoothed
    // target, then clamp via Euler decomposition so the iris never rolls
    // past anatomical limits.
    eye.current.lookAt(smoothedTarget.current);
    tmpQuat.current.copy(eye.current.quaternion);
    tmpEuler.current.setFromQuaternion(tmpQuat.current, 'YXZ');
    tmpEuler.current.x = THREE.MathUtils.clamp(tmpEuler.current.x, -MAX_LOOK_X, MAX_LOOK_X);
    tmpEuler.current.y = THREE.MathUtils.clamp(tmpEuler.current.y, -MAX_LOOK_Y, MAX_LOOK_Y);
    tmpEuler.current.z = 0; // never roll the eye
    eye.current.quaternion.setFromEuler(tmpEuler.current);
  });

  return (
    <group ref={eye}>
      {/* Eyeball — pearl-iridescent surface. We dropped the outer
          transmission shell from v1 because it hid the iris and pupil
          behind milky glass. Iridescence applied directly to the
          eyeball gives the same rainbow shimmer while keeping the
          interior fully readable. */}
      <mesh>
        <sphereGeometry args={[1.0, 128, 128]} />
        <meshPhysicalMaterial
          color="#f5f5fb"
          metalness={0.2}
          roughness={0.12}
          clearcoat={1}
          clearcoatRoughness={0.04}
          iridescence={1}
          iridescenceIOR={1.45}
          iridescenceThicknessRange={[160, 760]}
          envMapIntensity={2.4}
          reflectivity={0.55}
          sheen={0.4}
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
        minHeight: 200,
      }}
    >
      <Canvas
        camera={{ position: [0, 0, 6.2], fov: 26 }}
        shadows
        gl={{ alpha: true, antialias: true }}
        dpr={[1, 2]}
        style={{ background: 'transparent' }}
      >
        <ambientLight intensity={0.2} />
        <EyeOrb />
        {/* Violet floor contact shadow — anchors the orb visually */}
        <ContactShadows
          opacity={0.5}
          scale={3.4}
          blur={2.5}
          far={2.5}
          position={[0, -1.25, 0]}
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
