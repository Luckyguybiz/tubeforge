'use client';

import dynamic from 'next/dynamic';

const PlatformGlobeIcon = dynamic(() => import('./PlatformGlobeIcon'), {
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
          width: 130,
          height: 130,
          borderRadius: 28,
          background:
            'radial-gradient(ellipse at center, rgba(124,58,237,0.18) 0%, rgba(124,58,237,0) 70%)',
          filter: 'blur(18px)',
        }}
      />
    </div>
  ),
});

export default function PlatformGlobeIconMount() {
  return <PlatformGlobeIcon />;
}
