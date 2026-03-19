'use client';

import { memo } from 'react';
import { useThemeStore } from '@/stores/useThemeStore';
import { formatShortcut } from '@/hooks/useKeyboardShortcuts';

interface KbdHintProps {
  /** The shortcut keys to display, e.g. "Ctrl+S" */
  keys: string;
  /** Override font size (default 10) */
  size?: number;
}

/**
 * Small <kbd> badge to show a keyboard shortcut hint next to a
 * button or menu item label.
 *
 * @example
 * ```tsx
 * <button>Save <KbdHint keys="Ctrl+S" /></button>
 * ```
 */
export const KbdHint = memo(function KbdHint({ keys, size = 10 }: KbdHintProps) {
  const isDark = useThemeStore((s) => s.isDark);
  const C = useThemeStore((s) => s.theme);

  const formatted = formatShortcut(keys);

  return (
    <kbd
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        gap: 2,
        marginLeft: 6,
        padding: '1px 5px',
        borderRadius: 4,
        background: isDark ? 'rgba(255,255,255,.06)' : 'rgba(0,0,0,.05)',
        border: `1px solid ${isDark ? 'rgba(255,255,255,.08)' : 'rgba(0,0,0,.08)'}`,
        color: C.dim,
        fontSize: size,
        fontWeight: 500,
        fontFamily: 'var(--font-mono), monospace',
        lineHeight: 1.4,
        whiteSpace: 'nowrap',
        pointerEvents: 'none',
        userSelect: 'none',
        letterSpacing: '.02em',
      }}
    >
      {formatted}
    </kbd>
  );
});
