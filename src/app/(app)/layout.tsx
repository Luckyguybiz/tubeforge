'use client';

import { useEffect, useCallback } from 'react';
import { usePathname } from 'next/navigation';
import dynamic from 'next/dynamic';
import { Sidebar } from '@/components/layout/Sidebar';
import { TopBar } from '@/components/layout/TopBar';
import { ToastProvider } from '@/components/ui/ToastProvider';
import { CookieConsent } from '@/components/ui/CookieConsent';
import { ErrorBoundary } from '@/components/ui/ErrorBoundary';
import { useThemeStore } from '@/stores/useThemeStore';
import { useLocaleStore } from '@/stores/useLocaleStore';
import { useMobileMenuStore } from '@/stores/useMobileMenuStore';
import { trpc } from '@/lib/trpc';

// Lazy-load onboarding tour — only shown once per new user, no SSR needed
const OnboardingTour = dynamic(
  () => import('@/components/onboarding/OnboardingTour').then((m) => ({ default: m.OnboardingTour })),
  { ssr: false },
);

export default function AppLayout({ children }: { children: React.ReactNode }) {
  const C = useThemeStore((s) => s.theme);
  const t = useLocaleStore((s) => s.t);
  const pathname = usePathname();
  const isEditor = pathname === '/editor';

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
          .tf-dash-heading{font-size:20px!important}
          .tf-dash-stat-grid{grid-template-columns:repeat(2,1fr)!important;gap:8px!important}
          .tf-dash-project-grid{grid-template-columns:1fr!important}
          .tf-dash-toolbar{padding:12px 12px 10px!important}
          .tf-dash-toolbar-right{flex-direction:column!important;align-items:stretch!important}
          .tf-dash-search-input{width:100%!important}
          .tf-dash-content{padding:12px 12px 16px!important}
          .tf-dash-create-btn{padding:10px 16px!important;font-size:13px!important}
          .tf-dash-filter-pills{overflow-x:auto;-webkit-overflow-scrolling:touch;flex-wrap:nowrap!important}
          .tf-billing-inner{padding:16px 12px 32px!important}
          .tf-billing-heading{font-size:22px!important}
          .tf-billing-cols{flex-direction:column!important}
          .tf-billing-right{flex:1 1 auto!important;position:static!important;width:100%!important}
          .tf-billing-plan-grid{grid-template-columns:1fr!important}
          .tf-tools-hero{padding:24px 0 16px!important}
          .tf-tools-hero-title{font-size:24px!important}
          .tf-tools-grid{grid-template-columns:1fr!important;gap:12px!important}
          .tf-tools-cats{justify-content:flex-start!important;overflow-x:auto;-webkit-overflow-scrolling:touch;flex-wrap:nowrap!important;padding-bottom:8px!important}
          .tf-editor-scene-panel{display:none!important}
          .tf-editor-topbar>*{flex-shrink:0}
          .tf-shorts-table-wrap{overflow-x:auto;-webkit-overflow-scrolling:touch}
          .tf-topbar-breadcrumb{font-size:12px!important}
          .tf-topbar-breadcrumb span{max-width:120px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;display:inline-block;vertical-align:middle}
        }
        @media(max-width:480px){
          .tf-main-content{padding:6px!important}
          .tf-dash-heading{font-size:18px!important}
          .tf-dash-stat-grid{grid-template-columns:1fr 1fr!important;gap:6px!important}
          .tf-stat-card{padding:12px 14px!important}
          .tf-dash-stat-value{font-size:18px!important}
          .tf-billing-inner{padding:10px 8px 24px!important}
          .tf-billing-heading{font-size:20px!important}
        }
        @media(max-width:320px){
          .tf-main-content{padding:4px!important}
          .tf-dash-stat-grid{grid-template-columns:1fr!important}
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
      <a href="#main-content" className="skip-to-content">{t('a11y.skipToContent')}</a>
      <div style={{ width: '100%', height: '100dvh', background: C.bg, fontFamily: 'var(--font-sans),sans-serif', color: C.text, display: 'flex', overflow: 'hidden' }}>
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
    </>
  );
}
