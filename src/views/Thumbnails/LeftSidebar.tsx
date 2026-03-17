'use client';

import { useThemeStore } from '@/stores/useThemeStore';
import { useThumbnailStore } from '@/stores/useThumbnailStore';
import { UploadsPanel } from './panels/UploadsPanel';
import { ElementsPanel } from './panels/ElementsPanel';
import { ProjectsPanel } from './panels/ProjectsPanel';

const PANEL_TITLES: Record<string, string> = {
  uploads: 'Загрузки',
  elements: 'Элементы',
  projects: 'Проекты',
};

export function LeftSidebar() {
  const C = useThemeStore((s) => s.theme);
  const leftPanel = useThumbnailStore((s) => s.leftPanel);
  const setLeftPanel = useThumbnailStore((s) => s.setLeftPanel);

  if (leftPanel === 'none') return null;

  return (
    <aside
      role="region"
      aria-label={PANEL_TITLES[leftPanel] ?? 'Панель'}
      style={{
        width: 280,
        flexShrink: 0,
        background: C.card,
        border: `1px solid ${C.border}`,
        borderRadius: 14,
        display: 'flex',
        flexDirection: 'column',
        overflow: 'hidden',
      }}>
      {/* Header */}
      <div style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: '14px 16px 10px',
        borderBottom: `1px solid ${C.border}`,
        flexShrink: 0,
      }}>
        <h3 style={{ fontSize: 14, fontWeight: 700, margin: 0 }}>
          {PANEL_TITLES[leftPanel] ?? ''}
        </h3>
        <button
          onClick={() => setLeftPanel('none')}
          title="Закрыть"
          aria-label="Закрыть боковую панель"
          style={{
            width: 24,
            height: 24,
            borderRadius: 6,
            border: 'none',
            background: C.surface,
            color: C.sub,
            fontSize: 14,
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            lineHeight: 1,
          }}
        >
          &times;
        </button>
      </div>

      {/* Content */}
      <div style={{ flex: 1, overflow: 'auto', padding: '12px 14px' }}>
        {leftPanel === 'uploads' && <UploadsPanel />}
        {leftPanel === 'elements' && <ElementsPanel />}
        {leftPanel === 'projects' && <ProjectsPanel />}
      </div>
    </aside>
  );
}
