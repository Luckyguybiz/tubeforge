'use client';

import { useEffect, useRef, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { useNotificationStore } from '@/stores/useNotificationStore';

/* ── Types ──────────────────────────────────────────────── */

export interface ShortcutDef {
  /** Unique identifier */
  id: string;
  /** Human-readable label */
  label: string;
  /** Display string for the key combo (e.g. "Ctrl+K") */
  keys: string;
  /** Category for grouping in the shortcuts modal */
  category: 'global' | 'editor' | 'tools';
  /** Handler — return `true` to stop propagation */
  handler: (e: KeyboardEvent) => void | boolean;
  /**
   * If true, shortcut fires even when the user is focused on an
   * input / textarea / contenteditable.
   */
  allowInInput?: boolean;
}

/* ── Helpers ─────────────────────────────────────────────── */

function isEditableTarget(): boolean {
  const el = document.activeElement as HTMLElement | null;
  if (!el) return false;
  const tag = el.tagName;
  if (tag === 'INPUT' || tag === 'TEXTAREA' || tag === 'SELECT') return true;
  if (el.getAttribute('contenteditable') === 'true') return true;
  return false;
}

const isMac =
  typeof navigator !== 'undefined' && /Mac|iPod|iPhone|iPad/.test(navigator.platform ?? '');

/**
 * Returns a platform-aware display string.
 * Replaces `Ctrl` with the symbol on Mac.
 */
export function formatShortcut(keys: string): string {
  if (isMac) {
    return keys
      .replace(/Ctrl\+/g, '\u2318')
      .replace(/Shift\+/g, '\u21E7')
      .replace(/Alt\+/g, '\u2325');
  }
  return keys;
}

/* ── Sequence tracking ───────────────────────────────────── */

const SEQUENCE_TIMEOUT = 800; // ms to wait between keys in a sequence

/* ── Hook ────────────────────────────────────────────────── */

/**
 * Registers global keyboard shortcuts.
 *
 * Supports:
 * - Ctrl/Cmd + key combos
 * - Multi-key sequences (e.g. 'g' then 'd')
 * - Automatic input detection to suppress shortcuts while typing
 *
 * @returns cleanup is handled automatically via useEffect
 */
export function useKeyboardShortcuts(shortcuts: ShortcutDef[]) {
  const shortcutsRef = useRef(shortcuts);
  shortcutsRef.current = shortcuts;

  useEffect(() => {
    // Sequence state
    let sequenceBuffer: string[] = [];
    let sequenceTimer: ReturnType<typeof setTimeout> | null = null;

    function resetSequence() {
      sequenceBuffer = [];
      if (sequenceTimer) {
        clearTimeout(sequenceTimer);
        sequenceTimer = null;
      }
    }

    function handler(e: KeyboardEvent) {
      const inInput = isEditableTarget();
      const ctrl = e.ctrlKey || e.metaKey;

      for (const sc of shortcutsRef.current) {
        // Skip shortcuts that shouldn't fire while typing in inputs
        if (inInput && !sc.allowInInput) continue;

        const keys = sc.keys;

        // ── Multi-key sequences (no modifiers) ──────────────
        if (keys.includes(' then ')) {
          // e.g. "G then D"
          const parts = keys.split(' then ').map((p) => p.trim().toLowerCase());

          // Don't interfere with modifier combos
          if (ctrl || e.altKey) continue;

          const pressed = e.key.toLowerCase();

          // If buffer is empty and this is the first key of the sequence
          if (sequenceBuffer.length === 0 && pressed === parts[0]) {
            sequenceBuffer.push(pressed);
            sequenceTimer = setTimeout(resetSequence, SEQUENCE_TIMEOUT);
            e.preventDefault();
            return; // consume event
          }

          // If we have a partial match, check next key
          if (
            sequenceBuffer.length > 0 &&
            sequenceBuffer.length < parts.length
          ) {
            const expectedIndex = sequenceBuffer.length;
            if (
              pressed === parts[expectedIndex] &&
              sequenceBuffer.every((k, i) => k === parts[i])
            ) {
              sequenceBuffer.push(pressed);

              // Complete match
              if (sequenceBuffer.length === parts.length) {
                e.preventDefault();
                resetSequence();
                sc.handler(e);
                return;
              }

              // Partial match — reset timer
              if (sequenceTimer) clearTimeout(sequenceTimer);
              sequenceTimer = setTimeout(resetSequence, SEQUENCE_TIMEOUT);
              e.preventDefault();
              return;
            }
          }
          continue;
        }

        // ── Ctrl/Cmd + Shift + Key ──────────────────────────
        if (keys.startsWith('Ctrl+Shift+')) {
          const targetKey = keys.replace('Ctrl+Shift+', '').toLowerCase();
          if (ctrl && e.shiftKey && e.key.toLowerCase() === targetKey) {
            e.preventDefault();
            resetSequence();
            sc.handler(e);
            return;
          }
          continue;
        }

        // ── Ctrl/Cmd + Key ──────────────────────────────────
        if (keys.startsWith('Ctrl+')) {
          const targetKey = keys.replace('Ctrl+', '').toLowerCase();
          if (ctrl && !e.shiftKey && e.key.toLowerCase() === targetKey) {
            e.preventDefault();
            resetSequence();
            sc.handler(e);
            return;
          }
          continue;
        }

        // ── Single-key shortcuts (no modifiers) ─────────────
        if (!ctrl && !e.altKey && !e.shiftKey) {
          if (e.key === keys || e.key.toLowerCase() === keys.toLowerCase()) {
            e.preventDefault();
            resetSequence();
            sc.handler(e);
            return;
          }
        }

        // ── Shift+key (like ?) ──────────────────────────────
        if (e.key === keys) {
          e.preventDefault();
          resetSequence();
          sc.handler(e);
          return;
        }
      }

      // If the key pressed doesn't match any sequence start, reset
      if (sequenceBuffer.length > 0 && !ctrl && !e.altKey) {
        // Check if it could be a different sequence start
        const pressed = e.key.toLowerCase();
        const isAnySequenceStart = shortcutsRef.current.some((sc) => {
          if (!sc.keys.includes(' then ')) return false;
          const firstKey = sc.keys.split(' then ')[0].trim().toLowerCase();
          return pressed === firstKey;
        });
        if (!isAnySequenceStart) {
          resetSequence();
        }
      }
    }

    window.addEventListener('keydown', handler);
    return () => {
      window.removeEventListener('keydown', handler);
      resetSequence();
    };
  }, []); // stable — reads from ref
}

/* ── Pre-built global shortcuts hook ─────────────────────── */

/**
 * Registers the standard global navigation shortcuts.
 * Should be called once in the app layout.
 */
export function useGlobalShortcuts() {
  const router = useRouter();

  const navigate = useCallback(
    (path: string) => {
      router.push(path);
    },
    [router],
  );

  const toggleShortcutsModal = useCallback(() => {
    const ns = useNotificationStore.getState();
    ns.setShowShortcuts(!ns.showShortcuts);
  }, []);

  const openSearch = useCallback(() => {
    window.dispatchEvent(new CustomEvent('tubeforge:open-search'));
  }, []);

  const closeModals = useCallback(() => {
    // Close shortcuts modal if open
    const ns = useNotificationStore.getState();
    if (ns.showShortcuts) {
      ns.setShowShortcuts(false);
    }
  }, []);

  const shortcuts: ShortcutDef[] = [
    // ── Global ────────────────────────────
    {
      id: 'search',
      label: 'Focus search',
      keys: '/',
      category: 'global',
      handler: openSearch,
    },
    {
      id: 'shortcuts-modal',
      label: 'Keyboard shortcuts',
      keys: '?',
      category: 'global',
      handler: toggleShortcutsModal,
    },
    {
      id: 'shortcuts-modal-ctrl',
      label: 'Keyboard shortcuts',
      keys: 'Ctrl+/',
      category: 'global',
      handler: toggleShortcutsModal,
      allowInInput: true,
    },
    {
      id: 'escape',
      label: 'Close modal / deselect',
      keys: 'Escape',
      category: 'global',
      handler: closeModals,
      allowInInput: true,
    },
    // ── Navigation sequences ──────────────
    {
      id: 'go-dashboard',
      label: 'Go to Dashboard',
      keys: 'G then D',
      category: 'global',
      handler: () => navigate('/dashboard'),
    },
    {
      id: 'go-editor',
      label: 'Go to Editor',
      keys: 'G then E',
      category: 'global',
      handler: () => navigate('/editor'),
    },
    {
      id: 'go-tools',
      label: 'Go to Tools',
      keys: 'G then T',
      category: 'global',
      handler: () => navigate('/tools'),
    },
    {
      id: 'go-billing',
      label: 'Go to Billing',
      keys: 'G then B',
      category: 'global',
      handler: () => navigate('/billing'),
    },
    {
      id: 'go-settings',
      label: 'Go to Settings',
      keys: 'G then S',
      category: 'global',
      handler: () => navigate('/settings'),
    },
  ];

  useKeyboardShortcuts(shortcuts);
}
