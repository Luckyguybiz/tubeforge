'use client';

import { memo } from 'react';
import { useThemeStore } from '@/stores/useThemeStore';
import type { Theme } from '@/lib/types';

interface ToggleProps {
  on: boolean;
  onChange: () => void;
  label: string;
  ck: string;
}

export const Toggle = memo(function Toggle({ on, onChange, label, ck }: ToggleProps) {
  const C = useThemeStore((s) => s.theme);
  const col = C[ck as keyof Theme] as string || C.green;
  return (
    <button type="button" role="switch" aria-checked={on} aria-label={label} onClick={onChange} style={{ display: 'flex', alignItems: 'center', gap: 6, cursor: 'pointer', padding: '5px 8px', borderRadius: 7, background: on ? `${col}12` : C.card, border: `1px solid ${on ? col + '33' : C.border}`, fontFamily: 'inherit' }}>
      <div style={{ width: 26, height: 14, borderRadius: 7, background: on ? col : C.dim, position: 'relative', transition: 'background .2s' }}>
        <div style={{ width: 10, height: 10, borderRadius: '50%', background: '#fff', position: 'absolute', top: 2, left: on ? 14 : 2, transition: 'left .15s' }} />
      </div>
      <span style={{ fontSize: 10, fontWeight: 600, color: on ? C.text : C.sub }}>{label}</span>
    </button>
  );
});
