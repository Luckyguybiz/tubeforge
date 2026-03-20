'use client';

import { memo } from 'react';
import { useThemeStore } from '@/stores/useThemeStore';
import { useLocaleStore } from '@/stores/useLocaleStore';

interface FrameSlotProps {
  label: string;
  has: string | boolean | null;
  onClick: () => void;
}

export const FrameSlot = memo(function FrameSlot({ label, has, onClick }: FrameSlotProps) {
  const C = useThemeStore((s) => s.theme);
  const t = useLocaleStore((s) => s.t);
  return (
    <button
      type="button"
      aria-label={has ? `${label} — ${t('frame.uploaded')}` : `${t('frame.upload')}: ${label}`}
      onClick={onClick}
      style={{ flex: 1, minHeight: 44, borderRadius: 8, border: `1.5px dashed ${has ? C.green + '55' : C.border}`, background: has ? `${C.green}08` : C.card, padding: '10px 6px', textAlign: 'center', cursor: 'pointer', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 3, fontFamily: 'inherit' }}
    >
      <span style={{ fontSize: 8, fontWeight: 600, color: C.sub, letterSpacing: '.04em' }}>{t('frame.optional')}</span>
      <div style={{ width: 28, height: 28, borderRadius: 6, background: has ? `${C.green}20` : C.surface, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 14, color: has ? C.green : C.dim }}>{has ? '✓' : '↑'}</div>
      <span style={{ fontSize: 9, color: has ? C.green : C.dim }}>{has ? t('frame.done') : label}</span>
    </button>
  );
});
