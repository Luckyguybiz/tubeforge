'use client';

import { usePathname } from 'next/navigation';
import dynamic from 'next/dynamic';
import { Sidebar } from '@/components/layout/Sidebar';
import { TopBar } from '@/components/layout/TopBar';
import { ToastProvider } from '@/components/ui/ToastProvider';
import { useThemeStore } from '@/stores/useThemeStore';

// Lazy-load onboarding tour — only shown once per new user, no SSR needed
const OnboardingTour = dynamic(
  () => import('@/components/onboarding/OnboardingTour').then((m) => ({ default: m.OnboardingTour })),
  { ssr: false },
);

export default function AppLayout({ children }: { children: React.ReactNode }) {
  const C = useThemeStore((s) => s.theme);
  const pathname = usePathname();
  const isEditor = pathname === '/editor';

  return (
    <>
      <style>{`
        ::-webkit-scrollbar-thumb{background:${C.border}}
        .sc-row{transition:all .12s}.sc-row:hover{background:${C.cardHover}!important}
        .gen-shimmer{background-image:linear-gradient(90deg,${C.card},${C.borderActive},${C.card});background-size:200% 100%;animation:shimmer 1.8s linear infinite}
        textarea:focus,input:focus{border-color:${C.borderActive}!important}
        .tf-stat-card:hover{box-shadow:0 4px 16px rgba(0,0,0,.15);transform:translateY(-1px)}
        .tf-project-row:hover{background:${C.surface}}
        @media(max-width:768px){
          .tf-sidebar{display:none!important}
          .tf-main-content{padding:14px!important}
        }
      `}</style>
      <a href="#main-content" className="skip-to-content">Перейти к содержимому</a>
      <div style={{ width: '100%', height: '100vh', background: C.bg, fontFamily: 'var(--font-sans),sans-serif', color: C.text, display: 'flex', overflow: 'hidden' }}>
        {!isEditor && <div className="tf-sidebar"><Sidebar /></div>}
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
          <TopBar />
          {isEditor ? (
            <main id="main-content" style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>{children}</main>
          ) : (
            <main id="main-content" className="tf-main-content" style={{ flex: 1, overflow: 'auto', padding: 28 }}>{children}</main>
          )}
        </div>
      </div>
      <ToastProvider />
      <OnboardingTour />
    </>
  );
}
