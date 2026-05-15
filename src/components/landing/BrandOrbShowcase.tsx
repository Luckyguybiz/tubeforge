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
    <group ref={eye} position={[0, 0, 0]}>
      {/* ===== Eyeball ===== */}
      {/* Sclera-equivalent: indigo-tinted iridescent dome. Higher poly
          (256x256) for a perfectly smooth silhouette at this small
          render size — at 96px any faceting along the rim is visible.
          Iridescence is dialled into a tight thickness range so the
          colour shift stays inside the brand palette (indigo → violet →
          pearl) instead of wandering into greens/yellows. */}
      <mesh>
        <sphereGeometry args={[1.0, 256, 256]} />
        <meshPhysicalMaterial
          color="#d6dcff"
          metalness={0.18}
          roughness={0.08}
          clearcoat={1}
          clearcoatRoughness={0.02}
          iridescence={0.75}
          iridescenceIOR={1.4}
          iridescenceThicknessRange={[260, 540]}
          envMapIntensity={2.4}
          reflectivity={0.6}
          sheen={0.55}
          sheenColor="#a5b4fc"
          transmission={0.05}
          thickness={0.4}
          ior={1.42}
        />
      </mesh>

      {/* ===== Limbal ring ===== */}
      {/* Anatomical detail: a subtle dark ring at the iris perimeter,
          about 1px wide on a real eye, that defines where iris meets
          sclera. Gives the iris a "punched in" look instead of looking
          like a printed sticker. */}
      <mesh position={[0, 0, IRIS_DEPTH - 0.05]}>
        <ringGeometry args={[0.44, 0.5, 96]} />
        <meshPhysicalMaterial
          color="#1e1b4b"
          metalness={0.6}
          roughness={0.4}
          envMapIntensity={1.2}
        />
      </mesh>

      {/* ===== Iris base ===== */}
      {/* Indigo iris disc — slightly recessed (z behind limbal ring's
          z) gives anatomical depth. Higher metalness so the iris
          glints under the key Lightformer. */}
      <mesh position={[0, 0, IRIS_DEPTH - 0.045]}>
        <circleGeometry args={[0.44, 96]} />
        <meshPhysicalMaterial
          color="#312e81"
          metalness={0.75}
          roughness={0.18}
          clearcoat={1}
          clearcoatRoughness={0.05}
          envMapIntensity={2}
        />
      </mesh>

      {/* ===== Iris striation rings ===== */}
      {/* Three concentric rings of varying brightness and opacity
          fake the radial fibres of a real iris. Cheap geometry,
          big visual win. */}
      <mesh position={[0, 0, IRIS_DEPTH - 0.034]}>
        <ringGeometry args={[0.36, 0.42, 96]} />
        <meshPhysicalMaterial
          color="#6366f1"
          metalness={0.6}
          roughness={0.32}
          transparent
          opacity={0.55}
          envMapIntensity={1.6}
        />
      </mesh>
      <mesh position={[0, 0, IRIS_DEPTH - 0.028]}>
        <ringGeometry args={[0.28, 0.34, 96]} />
        <meshPhysicalMaterial
          color="#818cf8"
          metalness={0.5}
          roughness={0.35}
          transparent
          opacity={0.5}
          envMapIntensity={1.5}
        />
      </mesh>
      <mesh position={[0, 0, IRIS_DEPTH - 0.022]}>
        <ringGeometry args={[0.2, 0.26, 96]} />
        <meshPhysicalMaterial
          color="#c7d2fe"
          metalness={0.4}
          roughness={0.4}
          transparent
          opacity={0.4}
          envMapIntensity={1.4}
        />
      </mesh>

      {/* ===== Pupil ===== */}
      {/* Pupil sits ON the iris surface — slightly inset for depth.
          Pure black clearcoat material picks up the catch-light cleanly
          so the iris always reads as "alive". */}
      <mesh position={[0, 0, IRIS_DEPTH - 0.012]}>
        <circleGeometry args={[0.18, 64]} />
        <meshPhysicalMaterial
          color="#02020a"
          metalness={0.6}
          roughness={0.05}
          clearcoat={1}
          clearcoatRoughness={0.02}
          envMapIntensity={1.2}
        />
      </mesh>

      {/* ===== Catch-lights ===== */}
      {/* Primary catch-light, offset up-left to mimic a top-front key
          light. Slight glow halo behind it via a larger faint disc
          gives a subsurface-scattered sparkle without needing SSS. */}
      <mesh position={[-0.13, 0.14, IRIS_DEPTH + 0.005]}>
        <circleGeometry args={[0.1, 48]} />
        <meshBasicMaterial color="#ffffff" transparent opacity={0.18} />
      </mesh>
      <mesh position={[-0.13, 0.14, IRIS_DEPTH + 0.008]}>
        <circleGeometry args={[0.07, 48]} />
        <meshBasicMaterial color="#ffffff" />
      </mesh>
      {/* Hot-spot inside the primary catch-light — even brighter pixel
          centre for that "pricked light" point. */}
      <mesh position={[-0.13, 0.14, IRIS_DEPTH + 0.011]}>
        <circleGeometry args={[0.022, 24]} />
        <meshBasicMaterial color="#ffffff" />
      </mesh>
      {/* Secondary catch-light — smaller, opposite quadrant, gives the
          eye dimensional believability instead of looking like a sticker. */}
      <mesh position={[0.1, -0.11, IRIS_DEPTH + 0.003]}>
        <circleGeometry args={[0.03, 24]} />
        <meshBasicMaterial color="#ffffff" transparent opacity={0.85} />
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
        camera={{ position: [0, 0, 5.4], fov: 24 }}
        shadows
        gl={{ alpha: true, antialias: true, powerPreference: 'high-performance' }}
        dpr={[1, 2]}
        style={{ background: 'transparent' }}
      >
        <ambientLight intensity={0.15} />
        <EyeOrb />
        {/* Floor contact shadow — small, soft, brand-violet. Tucked
            close under the sphere so it doesn't bleed into copy. */}
        <ContactShadows
          opacity={0.32}
          scale={1.8}
          blur={2.8}
          far={1.2}
          position={[0, -1.02, 0]}
          color="#7c3aed"
        />
        {/* ===== Studio lighting tuned for iridescence =====
            Eight area lights wrap the sphere with a calibrated colour
            ramp. The trick with iridescence is that the rainbow shift
            comes from the *angle between view, normal, and incident
            light* — so multiple medium-intensity sources at different
            angles produce a richer ramp than one bright key. */}
        <Environment resolution={1024} background={false}>
          {/* Primary top key — broad and white, defines the main shape */}
          <Lightformer
            intensity={3}
            color="#ffffff"
            position={[0, 5, 3]}
            rotation={[-Math.PI / 2, 0, 0]}
            scale={[7, 7, 1]}
          />
          {/* Upper-left brand violet wrap */}
          <Lightformer
            intensity={2.4}
            color="#a78bfa"
            position={[-3, 2, 3]}
            rotation={[0, Math.PI / 4, 0]}
            scale={[4, 5, 1]}
          />
          {/* Upper-right brand indigo wrap */}
          <Lightformer
            intensity={2.4}
            color="#6366f1"
            position={[3, 2, 3]}
            rotation={[0, -Math.PI / 4, 0]}
            scale={[4, 5, 1]}
          />
          {/* Cool cyan grazing light — adds a turquoise micro-band to
              the iridescent ramp at certain viewing angles */}
          <Lightformer
            intensity={1.5}
            color="#67e8f9"
            position={[-4, -0.5, 2]}
            rotation={[0, Math.PI / 2, 0]}
            scale={[3, 3, 1]}
          />
          {/* Warm magenta opposite — closes the colour wheel for full
              iridescence range */}
          <Lightformer
            intensity={1.5}
            color="#f0abfc"
            position={[4, -0.5, 2]}
            rotation={[0, -Math.PI / 2, 0]}
            scale={[3, 3, 1]}
          />
          {/* Bottom violet bounce — gives the sphere weight so it
              doesn't read as floating */}
          <Lightformer
            intensity={1.4}
            color="#8b5cf6"
            position={[0, -2.5, 2]}
            rotation={[Math.PI / 4, 0, 0]}
            scale={[5, 1.5, 1]}
          />
          {/* Back-rim accent — a thin violet crescent on the dark side */}
          <Lightformer
            intensity={1.4}
            color="#c4b5fd"
            position={[0, 0, -3.5]}
            scale={[4, 4, 1]}
          />
          {/* Subtle ground bounce — flat panel below adds a soft
              violet up-light into the underside of the iris */}
          <Lightformer
            intensity={0.8}
            color="#4c1d95"
            position={[0, -1.8, 0]}
            rotation={[Math.PI / 2, 0, 0]}
            scale={[4, 4, 1]}
          />
        </Environment>
      </Canvas>
    </div>
  );
}
