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
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
      }}
    >
      <div
        style={{
          width: '75%',
          height: '75%',
          borderRadius: '20%',
          background:
            'radial-gradient(ellipse at center, rgba(124,58,237,0.18) 0%, rgba(124,58,237,0) 70%)',
          filter: 'blur(14px)',
        }}
      />
    </div>
  ),
});

export default function PlatformGlobeIconMount() {
  return <PlatformGlobeIcon />;
}
