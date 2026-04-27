'use client';

/**
 * Lazy mount for the brand orb. Same pattern as YouTubePlayBadgeMount —
 * the 3D bundle is already loaded for the hero badge, so this second
 * Canvas mounts cheaply (Three / Fiber / Drei are de-duped).
 */
import dynamic from 'next/dynamic';

const BrandOrbShowcase = dynamic(() => import('./BrandOrbShowcase'), {
  ssr: false,
  loading: () => (
    <div
      aria-hidden
      style={{
        width: '100%',
        height: '100%',
        minHeight: 200,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
      }}
    >
      <div
        style={{
          width: 140,
          height: 140,
          borderRadius: 28,
          background:
            'radial-gradient(ellipse at center, rgba(139,92,246,0.18) 0%, rgba(139,92,246,0) 70%)',
          filter: 'blur(18px)',
        }}
      />
    </div>
  ),
});

export default function BrandOrbShowcaseMount() {
  return <BrandOrbShowcase />;
}
