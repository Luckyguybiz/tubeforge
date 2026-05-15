'use client';

/**
 * Lazy mount for the iridescent camera orb used in the social-proof
 * strip. Dynamic-import keeps the 3D bundle off the H1 LCP path.
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
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
      }}
    >
      <div
        style={{
          width: '70%',
          height: '70%',
          borderRadius: '50%',
          background:
            'radial-gradient(ellipse at center, rgba(139,92,246,0.18) 0%, rgba(139,92,246,0) 70%)',
          filter: 'blur(14px)',
        }}
      />
    </div>
  ),
});

export default function BrandOrbShowcaseMount() {
  return <BrandOrbShowcase />;
}
