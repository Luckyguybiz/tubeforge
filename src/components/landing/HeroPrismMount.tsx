'use client';

/**
 * Lazy mount for HeroPrism. Same pattern as the previous orb mount —
 * dynamic-imports the 3D bundle (~70 kB of three.js + drei) so the H1
 * LCP element is not blocked behind the WebGL context init.
 */
import dynamic from 'next/dynamic';

const HeroPrism = dynamic(() => import('./HeroPrism'), {
  ssr: false,
  loading: () => (
    <div
      aria-hidden="true"
      style={{
        width: '100%',
        height: '100%',
        // Subtle indigo glow placeholder so the column does not feel
        // empty during the ~300ms 3D bundle load
        background:
          'radial-gradient(ellipse at center, rgba(139,92,246,0.18) 0%, rgba(99,102,241,0.06) 45%, transparent 70%)',
        filter: 'blur(8px)',
      }}
    />
  ),
});

export default function HeroPrismMount() {
  return <HeroPrism />;
}
