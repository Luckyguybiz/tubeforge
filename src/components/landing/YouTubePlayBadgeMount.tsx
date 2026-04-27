'use client';

/**
 * Client-side mount point for the 3D play badge. We dynamic-import the
 * heavy 3D bundle (three, fiber, drei, rapier) only after hydration so
 * the server-rendered hero <h1> stays the LCP element.
 */
import dynamic from 'next/dynamic';

const YouTubePlayBadge = dynamic(() => import('./YouTubePlayBadge'), {
  ssr: false,
  loading: () => (
    <div
      aria-hidden
      style={{
        width: '100%',
        height: '100%',
        minHeight: 360,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
      }}
    >
      {/* Subtle red glow placeholder while bundle hydrates */}
      <div
        style={{
          width: 220,
          height: 150,
          borderRadius: 32,
          background:
            'radial-gradient(ellipse at center, rgba(255,0,51,0.18) 0%, rgba(255,0,51,0) 70%)',
          filter: 'blur(20px)',
        }}
      />
    </div>
  ),
});

export default function YouTubePlayBadgeMount() {
  return <YouTubePlayBadge />;
}
