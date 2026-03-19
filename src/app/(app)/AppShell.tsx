'use client';

import { useEffect, useCallback } from 'react';
import { usePathname } from 'next/navigation';
import dynamic from 'next/dynamic';
import { Sidebar } from '@/components/layout/Sidebar';
import { TopBar } from '@/components/layout/TopBar';
import { ToastProvider } from '@/components/ui/ToastProvider';
import { CookieConsent } from '@/components/ui/CookieConsent';
import { ShortcutsModal } from '@/components/ui/ShortcutsModal';
import { ErrorBoundary } from '@/components/ui/ErrorBoundary';
import { useThemeStore } from '@/stores/useThemeStore';
import { useMobileMenuStore } from '@/stores/useMobileMenuStore';
import { useGlobalShortcuts } from '@/hooks/useKeyboardShortcuts';
import { trpc } from '@/lib/trpc';

// Lazy-load onboarding tour — only shown once per new user, no SSR needed
const OnboardingTour = dynamic(
  () => import('@/components/onboarding/OnboardingTour').then((m) => ({ default: m.OnboardingTour })),
  { ssr: false },
);

export function AppShell({ children }: { children: React.ReactNode }) {
  const C = useThemeStore((s) => s.theme);
  const isDark = useThemeStore((s) => s.isDark);
  const pathname = usePathname();
  const isEditor = pathname === '/editor';

  // Register global keyboard shortcuts (navigation, search, shortcuts modal)
  useGlobalShortcuts();

  // Enable smooth theme transitions after initial paint (prevents flash)
  useEffect(() => {
    const raf = requestAnimationFrame(() => {
      document.documentElement.classList.add('tf-theme-ready');
    });
    return () => cancelAnimationFrame(raf);
  }, []);

  // Sync data-theme attribute and colorScheme on html element
  useEffect(() => {
    document.documentElement.setAttribute('data-theme', isDark ? 'dark' : 'light');
    document.documentElement.style.colorScheme = isDark ? 'dark' : 'light';
  }, [isDark]);

  const mobileMenuOpen = useMobileMenuStore((s) => s.open);
  const closeMobileMenu = useMobileMenuStore((s) => s.close);

  // Close mobile menu on route change
  useEffect(() => {
    closeMobileMenu();
  }, [pathname, closeMobileMenu]);

  // Close mobile menu on Escape
  useEffect(() => {
    if (!mobileMenuOpen) return;
    const handler = (e: KeyboardEvent) => {
      if (e.key === 'Escape') closeMobileMenu();
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [mobileMenuOpen, closeMobileMenu]);

  const handleBackdropClick = useCallback(() => {
    closeMobileMenu();
  }, [closeMobileMenu]);

  // Claim referral code from localStorage after login (runs once)
  const claimReferral = trpc.referral.claimReferral.useMutation();
  useEffect(() => {
    try {
      const refCode = localStorage.getItem('tf-ref');
      if (refCode) {
        claimReferral.mutate({ code: refCode }, {
          onSettled: () => localStorage.removeItem('tf-ref'),
          onError: (err) => console.error('[referral] claim failed:', err.message),
        });
      }
    } catch { /* localStorage unavailable */ }
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

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
          .tf-main-content{padding:10px!important}
          .tf-hamburger{display:flex!important}
          .tf-topbar-referral{display:none!important}
          .tf-topbar-shortcuts{display:none!important}
        }
        @media(max-width:480px){
          .tf-main-content{padding:6px!important}
        }
        .tf-mobile-backdrop{
          position:fixed;inset:0;background:rgba(0,0,0,.5);z-index:9998;
          opacity:0;transition:opacity .25s ease;pointer-events:none;
        }
        .tf-mobile-backdrop.open{opacity:1;pointer-events:auto}
        .tf-mobile-drawer{
          position:fixed;top:0;left:0;bottom:0;width:260px;z-index:9999;
          transform:translateX(-100%);transition:transform .3s cubic-bezier(.4,0,.2,1);
          overflow-y:auto;
        }
        .tf-mobile-drawer.open{transform:translateX(0)}
      `}</style>
      <a href="#main-content" className="skip-to-content">Перейти к содержимому</a>
      <div style={{ width: '100%', height: '100vh', background: C.bg, fontFamily: 'var(--font-sans),sans-serif', color: C.text, display: 'flex', overflow: 'hidden' }}>
        {!isEditor && <div className="tf-sidebar"><Sidebar /></div>}
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
          <TopBar />
          {isEditor ? (
            <main id="main-content" tabIndex={-1} style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>{children}</main>
          ) : (
            <main id="main-content" tabIndex={-1} className="tf-main-content" style={{ flex: 1, overflow: 'auto', padding: 28, minHeight: 0 }}>{children}</main>
          )}
        </div>
      </div>

      {/* Mobile sidebar drawer */}
      {!isEditor && (
        <>
          <div
            className={`tf-mobile-backdrop${mobileMenuOpen ? ' open' : ''}`}
            onClick={handleBackdropClick}
            aria-hidden="true"
          />
          <div className={`tf-mobile-drawer${mobileMenuOpen ? ' open' : ''}`}>
            <Sidebar />
          </div>
        </>
      )}

      <ToastProvider />
      <ErrorBoundary>
        <OnboardingTour />
      </ErrorBoundary>
      <ErrorBoundary>
        <CookieConsent />
      </ErrorBoundary>
      <ShortcutsModal />
    </>
  );
}
