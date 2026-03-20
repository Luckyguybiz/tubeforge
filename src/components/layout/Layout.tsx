'use client';
import { usePathname } from 'next/navigation';
import { Sidebar } from './Sidebar';
import { TopBar } from './TopBar';
import { useThemeStore } from '@/stores/useThemeStore';

export function Layout({ children }: { children: React.ReactNode }) {
  const C = useThemeStore((s) => s.theme);
  const pathname = usePathname();
  const isEditor = pathname === '/editor';

  return (
    <>
      <style>{`
        ::-webkit-scrollbar-thumb{background:${C.border}}
        .sc-row{transition:all .12s}.sc-row:hover{background:${C.cardHover}!important}
        .gen-shimmer{background:linear-gradient(90deg,${C.card},${C.borderActive},${C.card});background-size:200% 100%;animation:shimmer 1.8s linear infinite}
        textarea:focus,input:focus{border-color:${C.borderActive}!important}
        .tf-skip-link{position:absolute;top:-100%;left:16px;z-index:99999;padding:12px 24px;background:${C.accent};color:#fff;font-size:14px;font-weight:700;border-radius:0 0 8px 8px;text-decoration:none;transition:top .2s ease;font-family:inherit}
        .tf-skip-link:focus{top:0}
        *:focus-visible{outline:2px solid ${C.accent};outline-offset:2px}
      `}</style>
      <a className="tf-skip-link" href="#main-content">Skip to content</a>
      <div style={{ width: '100vw', height: '100dvh', background: C.bg, fontFamily: "'Instrument Sans',sans-serif", color: C.text, display: 'flex', overflow: 'hidden' }}>
        {!isEditor && <Sidebar />}
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
          <TopBar />
          {isEditor ? (
            <main id="main-content">{children}</main>
          ) : (
            <main id="main-content" style={{ flex: 1, overflow: 'auto', padding: 28 }}>
              {children}
            </main>
          )}
        </div>
      </div>
    </>
  );
}
