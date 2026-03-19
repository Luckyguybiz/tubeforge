'use client';

import { memo } from 'react';
import { STATUS } from '@/lib/constants';
import { useThemeStore } from '@/stores/useThemeStore';
import { useLocaleStore } from '@/stores/useLocaleStore';
import type { Theme } from '@/lib/types';

const STATUS_KEY: Record<string, string> = {
  empty: 'status.empty',
  editing: 'status.editing',
  generating: 'status.generating',
  ready: 'status.ready',
  error: 'status.error',
};

export const StatusDot = memo(function StatusDot({ status }: { status: string }) {
  const C = useThemeStore((s) => s.theme);
  const t = useLocaleStore((s) => s.t);
  const s = STATUS[status] || STATUS.empty;
  const col = (typeof C[s.c as keyof Theme] === 'string' ? C[s.c as keyof Theme] : C.dim) as string;
  const label = STATUS_KEY[status] ? t(STATUS_KEY[status]) : s.l;
  return (
    <span aria-label={`${t('status.label')}: ${label}`} style={{ display: 'inline-flex', alignItems: 'center', gap: 4, fontSize: 10, fontWeight: 600, color: col }}>
      <span aria-hidden="true" style={{ width: 6, height: 6, borderRadius: '50%', background: col, animation: status === 'generating' ? 'pulse 1.4s infinite' : 'none' }} />
      {label}
    </span>
  );
});
