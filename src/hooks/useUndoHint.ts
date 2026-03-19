import { useEffect, useRef } from 'react';
import { useNotificationStore } from '@/stores/useNotificationStore';
import { useLocaleStore } from '@/stores/useLocaleStore';

/**
 * Shows a one-time "Ctrl+Z to undo" toast the first time the user triggers
 * a history-tracked edit (i.e. historyCount goes from 0 to 1).
 *
 * Usage: call `useUndoHint(historyCount)` in any editor component.
 */
export function useUndoHint(historyCount: number) {
  const shownRef = useRef(false);

  useEffect(() => {
    if (historyCount === 1 && !shownRef.current) {
      shownRef.current = true;
      const t = useLocaleStore.getState().t;
      useNotificationStore.getState().addToast('info', t('editor.undoHint'), 3000);
    }
  }, [historyCount]);
}
