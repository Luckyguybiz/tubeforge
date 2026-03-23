'use client';

import { useThemeStore } from '@/stores/useThemeStore';
import { useLocaleStore } from '@/stores/useLocaleStore';
import { useThumbnailStore } from '@/stores/useThumbnailStore';
import { UploadsPanel } from './panels/UploadsPanel';
import { ElementsPanel } from './panels/ElementsPanel';
import { ProjectsPanel } from './panels/ProjectsPanel';
import { StockPhotosPanel } from './panels/StockPhotosPanel';

const PANEL_TITLE_KEYS: Record<string, string> = {
  uploads: 'thumbs.panel.uploads',
  elements: 'thumbs.panel.elements',
  projects: 'thumbs.panel.projects',
  photos: 'Stock Photos',
};

export function LeftSidebar({ isMobile = false }: { isMobile?: boolean } = {}) {
  const C = useThemeStore((s) => s.theme);
  const t = useLocaleStore((s) => s.t);
  const leftPanel = useThumbnailStore((s) => s.leftPanel);
  const setLeftPanel = useThumbnailStore((s) => s.setLeftPanel);

  if (leftPanel === 'none') return null;

  const panelTitle = PANEL_TITLE_KEYS[leftPanel] ? t(PANEL_TITLE_KEYS[leftPanel]) : t('thumbs.sidebar.panel');

  return (
    <aside
      role="region"
      aria-label={panelTitle}
      style={isMobile ? {
        width: '100%',
        maxWidth: '100%',
        flexShrink: 0,
        background: C.card,
        border: `1px solid ${C.border}`,
        borderRadius: 10,
        display: 'flex',
        flexDirection: 'column',
        overflow: 'hidden',
        maxHeight: 260,
      } : {
        width: 280,
        maxWidth: 280,
        flexShrink: 0,
        background: C.card,
        border: `1px solid ${C.border}`,
        borderRadius: 12,
        display: 'flex',
        flexDirection: 'column',
        overflow: 'hidden',
      }}>
      {/* Header */}
      <div style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: '12px 14px 10px',
        borderBottom: `1px solid ${C.border}`,
        flexShrink: 0,
      }}>
        <h3 style={{ fontSize: 13, fontWeight: 700, margin: 0, display: 'flex', alignItems: 'center', gap: 6 }}>
          {leftPanel === 'uploads' && <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4"/><polyline points="17 8 12 3 7 8"/><line x1="12" y1="3" x2="12" y2="15"/></svg>}
          {leftPanel === 'elements' && <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/></svg>}
          {leftPanel === 'projects' && <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M22 19a2 2 0 01-2 2H4a2 2 0 01-2-2V5a2 2 0 012-2h5l2 3h9a2 2 0 012 2z"/></svg>}
          {(leftPanel as string) === 'photos' && <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="3" width="18" height="18" rx="2"/><circle cx="8.5" cy="8.5" r="1.5"/><polyline points="21 15 16 10 5 21"/></svg>}
          {panelTitle}
        </h3>
        <button
          onClick={() => setLeftPanel('none')}
          title={t('thumbs.sidebar.close')}
          aria-label={t('thumbs.sidebar.closeLabel')}
          style={{
            width: isMobile ? 44 : 24,
            height: isMobile ? 44 : 24,
            borderRadius: 6,
            border: 'none',
            background: 'transparent',
            color: C.sub,
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            transition: 'all .12s',
          }}
          onMouseEnter={(e) => { (e.currentTarget as HTMLElement).style.background = C.surface; (e.currentTarget as HTMLElement).style.color = C.text; }}
          onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.background = 'transparent'; (e.currentTarget as HTMLElement).style.color = C.sub; }}
        >
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
        </button>
      </div>

      {/* Content */}
      <div style={{ flex: 1, overflow: 'auto', padding: '12px 14px' }}>
        {leftPanel === 'uploads' && <UploadsPanel />}
        {leftPanel === 'elements' && <ElementsPanel />}
        {leftPanel === 'projects' && <ProjectsPanel />}
        {leftPanel === 'photos' && <StockPhotosPanel />}
      </div>
    </aside>
  );
}
