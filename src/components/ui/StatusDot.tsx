'use client';

import { memo } from 'react';
import { STATUS } from '@/lib/constants';
import { useThemeStore } from '@/stores/useThemeStore';
import type { Theme } from '@/lib/types';

export const StatusDot = memo(function StatusDot({ status }: { status: string }) {
  const C = useThemeStore((s) => s.theme);
  const s = STATUS[status] || STATUS.empty;
  const col = (typeof C[s.c as keyof Theme] === 'string' ? C[s.c as keyof Theme] : C.dim) as string;
  return (
    <span aria-label={`Статус: ${s.l}`} style={{ display: 'inline-flex', alignItems: 'center', gap: 4, fontSize: 10, fontWeight: 600, color: col }}>
      <span aria-hidden="true" style={{ width: 6, height: 6, borderRadius: '50%', background: col, animation: status === 'generating' ? 'pulse 1.4s infinite' : 'none' }} />
      {s.l}
    </span>
  );
});
