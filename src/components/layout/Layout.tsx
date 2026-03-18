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
      `}</style>
      <div style={{ width: '100vw', height: '100vh', background: C.bg, fontFamily: "'Instrument Sans',sans-serif", color: C.text, display: 'flex', overflow: 'hidden' }}>
        {!isEditor && <Sidebar />}
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
          <TopBar />
          {isEditor ? (
            children
          ) : (
            <div style={{ flex: 1, overflow: 'auto', padding: 28 }}>
              {children}
            </div>
          )}
        </div>
      </div>
    </>
  );
}
