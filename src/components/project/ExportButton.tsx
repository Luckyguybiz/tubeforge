'use client';

import { useState } from 'react';
import { trpc } from '@/lib/trpc';
import { useThemeStore } from '@/stores/useThemeStore';
import { useLocaleStore } from '@/stores/useLocaleStore';
import { toast } from '@/stores/useNotificationStore';

function IconDownload({ size = 16, color = 'currentColor' }: { size?: number; color?: string }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4" />
      <polyline points="7 10 12 15 17 10" /><line x1="12" y1="15" x2="12" y2="3" />
    </svg>
  );
}

export function ExportButton({ projectId, projectTitle }: { projectId: string; projectTitle: string }) {
  const C = useThemeStore((s) => s.theme);
  const t = useLocaleStore((s) => s.t);
  const [isHovered, setIsHovered] = useState(false);
  const [isExporting, setIsExporting] = useState(false);

  const utils = trpc.useUtils();

  const handleExport = async (e: React.MouseEvent) => {
    e.stopPropagation();
    if (isExporting) return;
    setIsExporting(true);

    try {
      const data = await utils.project.export.fetch({ id: projectId });

      const json = JSON.stringify(data, null, 2);
      const blob = new Blob([json], { type: 'application/json' });
      const url = URL.createObjectURL(blob);

      const a = document.createElement('a');
      a.href = url;
      // Sanitize filename: remove special chars, replace spaces with hyphens
      const safeName = projectTitle
        .replace(/[^a-zA-Z0-9а-яА-ЯёЁ\s-_]/g, '')
        .replace(/\s+/g, '-')
        .slice(0, 50)
        || 'project';
      a.download = `${safeName}.tubeforge.json`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);

      toast.success(t('dashboard.exportSuccess'));
    } catch (err) {
      toast.error(err instanceof Error ? err.message : t('dashboard.exportError'));
    } finally {
      setIsExporting(false);
    }
  };

  return (
    <button
      onClick={handleExport}
      disabled={isExporting}
      title={t('dashboard.export')}
      aria-label={`${t('dashboard.export')} ${projectTitle}`}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      style={{
        width: 28,
        height: 28,
        borderRadius: 7,
        border: `1px solid ${isHovered ? C.borderActive : C.border}`,
        background: isHovered ? C.card : 'transparent',
        color: C.sub,
        cursor: isExporting ? 'wait' : 'pointer',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        transition: 'all .15s ease',
        opacity: isExporting ? 0.5 : 1,
      }}
    >
      <IconDownload size={13} color={C.sub} />
    </button>
  );
}
