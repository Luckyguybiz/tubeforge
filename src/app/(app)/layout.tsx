'use client';

import { useEffect, useCallback } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import dynamic from 'next/dynamic';
import { Sidebar } from '@/components/layout/Sidebar';
import { TopBar } from '@/components/layout/TopBar';
import { ToastProvider } from '@/components/ui/ToastProvider';
import { CookieConsent } from '@/components/ui/CookieConsent';
import { ErrorBoundary } from '@/components/ui/ErrorBoundary';
import { FeedbackWidget } from '@/components/ui/FeedbackWidget';
import { ServiceWorkerRegistration } from '@/components/ServiceWorkerRegistration';
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
  const isOnboarding = pathname === '/onboarding';

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
        .tf-sidebar-nav::-webkit-scrollbar{width:6px}
        .tf-sidebar-nav::-webkit-scrollbar-track{background:transparent}
        .tf-sidebar-nav::-webkit-scrollbar-thumb{background:rgba(128,128,128,.18);border-radius:3px}
        .tf-sidebar-nav::-webkit-scrollbar-thumb:hover{background:rgba(128,128,128,.32)}
        .tf-sidebar-nav{scrollbar-gutter:stable}
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
          .tf-tools-grid{grid-template-columns:repeat(2,1fr)!important;gap:12px!important}
          .tf-tools-cats{justify-content:flex-start!important;overflow-x:auto;-webkit-overflow-scrolling:touch;flex-wrap:nowrap!important;padding-bottom:8px!important}
          .tf-editor-scene-panel{display:none!important}
          .tf-editor-topbar>*{flex-shrink:0}
          .tf-shorts-table-wrap{overflow-x:auto;-webkit-overflow-scrolling:touch}
          .tf-topbar-breadcrumb{font-size:12px!important}
          .tf-topbar-breadcrumb span{max-width:120px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;display:inline-block;vertical-align:middle}
        }
        @media(max-width:480px){
          .tf-tools-grid{grid-template-columns:1fr!important}
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
        .tf-bottom-tabs{display:none}
        @media(max-width:768px){
          .tf-bottom-tabs{
            display:flex !important;
            position:fixed !important;bottom:0 !important;left:0 !important;right:0 !important;z-index:9990 !important;
            height:56px;
            background:${C.surface};
            border-top:1px solid ${C.border};
            align-items:stretch;
            justify-content:space-around;
            padding:0;
            padding-bottom:env(safe-area-inset-bottom,0);
          }
          .tf-bottom-tab{
            flex:1;display:flex;flex-direction:column;align-items:center;justify-content:center;
            gap:2px;border:none;background:transparent;cursor:pointer;
            color:${C.dim};font-size:10px;font-weight:600;font-family:inherit;
            padding:4px 0;transition:color .15s;
            -webkit-tap-highlight-color:transparent;
            min-height:44px;
          }
          .tf-bottom-tab.active{color:${C.accent}}
          .tf-bottom-tab svg{transition:color .15s;display:block;vertical-align:middle}
          .tf-main-content{padding-bottom:80px!important}
        }
      `}</style>
      {/* Onboarding quiz: render fullscreen without sidebar/topbar */}
      {isOnboarding ? (
        <>{children}</>
      ) : (
        <>
          <a href="#main-content" className="skip-to-content">{t('a11y.skipToContent')}</a>
          <div style={{ width: '100%', height: '100dvh', background: C.bg, fontFamily: 'var(--font-sans),sans-serif', color: C.text, display: 'flex', overflow: 'hidden' }}>
            {!isEditor && <div className="tf-sidebar"><Sidebar /></div>}
            <div style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
              <TopBar />
              {isEditor ? (
                <main id="main-content" tabIndex={-1} style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>{children}</main>
              ) : (
                <main id="main-content" tabIndex={-1} className="tf-main-content" style={{ flex: 1, overflow: 'auto', padding: 28, minHeight: 0, transition: 'padding 0.2s ease', scrollbarWidth: 'thin', scrollbarColor: 'rgba(0,0,0,0.15) transparent' }}>{children}</main>
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
                {/* Close button */}
                <button
                  aria-label="Close menu"
                  onClick={closeMobileMenu}
                  style={{
                    position: 'absolute',
                    top: 12,
                    right: 12,
                    width: 32,
                    height: 32,
                    borderRadius: '50%',
                    border: 'none',
                    background: 'rgba(255,255,255,0.1)',
                    color: '#fff',
                    fontSize: 18,
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    zIndex: 10,
                  }}
                >
                  &times;
                </button>
                <Sidebar />
              </div>
            </>
          )}

          {/* Mobile bottom tab bar */}
          {!isEditor && <MobileBottomTabs pathname={pathname} C={C} t={t} />}
        </>
      )}

      <ServiceWorkerRegistration />
      <FeedbackWidget />
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

/* ── Mobile Bottom Tab Bar ──────────────────────────── */

interface TabDef {
  id: string;
  href: string;
  labelKey: string;
  icon: React.ReactNode;
}

const TABS: TabDef[] = [
  {
    id: 'ai-thumbnails',
    href: '/ai-thumbnails',
    labelKey: 'nav.aiThumbnails',
    icon: (
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <rect x="2" y="3" width="20" height="14" rx="3" />
        <path d="M12 8l1.5 3.5L17 12.5l-2.5 2.2l.5 3.8L12 16.5l-3 2l.5-3.8L7 12.5l3.5-1L12 8z" />
      </svg>
    ),
  },
  {
    id: 'dashboard',
    href: '/dashboard',
    labelKey: 'nav.dashboard',
    icon: (
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <rect x="3" y="3" width="7" height="7" /><rect x="14" y="3" width="7" height="7" />
        <rect x="14" y="14" width="7" height="7" /><rect x="3" y="14" width="7" height="7" />
      </svg>
    ),
  },
  {
    id: 'editor',
    href: '/editor',
    labelKey: 'nav.editor',
    icon: (
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <polygon points="5 3 19 12 5 21 5 3" />
      </svg>
    ),
  },
  {
    id: 'tools',
    href: '/tools',
    labelKey: 'nav.tools',
    icon: (
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M14.7 6.3a1 1 0 000 1.4l1.6 1.6a1 1 0 001.4 0l3.77-3.77a6 6 0 01-7.94 7.94l-6.91 6.91a2.12 2.12 0 01-3-3l6.91-6.91a6 6 0 017.94-7.94l-3.76 3.76z" />
      </svg>
    ),
  },
  {
    id: 'settings',
    href: '/settings',
    labelKey: 'nav.settings',
    icon: (
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <circle cx="12" cy="12" r="3" />
        <path d="M19.4 15a1.65 1.65 0 00.33 1.82l.06.06a2 2 0 010 2.83 2 2 0 01-2.83 0l-.06-.06a1.65 1.65 0 00-1.82-.33 1.65 1.65 0 00-1 1.51V21a2 2 0 01-4 0v-.09A1.65 1.65 0 009 19.4a1.65 1.65 0 00-1.82.33l-.06.06a2 2 0 01-2.83-2.83l.06-.06A1.65 1.65 0 004.68 15a1.65 1.65 0 00-1.51-1H3a2 2 0 010-4h.09A1.65 1.65 0 004.6 9a1.65 1.65 0 00-.33-1.82l-.06-.06a2 2 0 012.83-2.83l.06.06A1.65 1.65 0 009 4.68a1.65 1.65 0 001-1.51V3a2 2 0 014 0v.09a1.65 1.65 0 001 1.51 1.65 1.65 0 001.82-.33l.06-.06a2 2 0 012.83 2.83l-.06.06A1.65 1.65 0 0019.4 9a1.65 1.65 0 001.51 1H21a2 2 0 010 4h-.09a1.65 1.65 0 00-1.51 1z" />
      </svg>
    ),
  },
];

function MobileBottomTabs({
  pathname,
  C,
  t,
}: {
  pathname: string;
  C: ReturnType<typeof useThemeStore.getState>['theme'];
  t: (key: string) => string;
}) {
  const router = useRouter();
  const current = pathname.split('/').filter(Boolean)[0] || 'dashboard';

  return (
    <nav className="tf-bottom-tabs" aria-label="Mobile navigation">
      {TABS.map((tab) => {
        const isActive = tab.id === current;
        return (
          <button
            key={tab.id}
            className={`tf-bottom-tab${isActive ? ' active' : ''}`}
            onClick={() => router.push(tab.href)}
            aria-current={isActive ? 'page' : undefined}
          >
            {tab.icon}
            <span>{t(tab.labelKey)}</span>
          </button>
        );
      })}
    </nav>
  );
}
