import { useEffect } from 'react';
import { useThumbnailStore } from '@/stores/useThumbnailStore';
import { useNotificationStore } from '@/stores/useNotificationStore';
import { useLocaleStore } from '@/stores/useLocaleStore';

export function useCanvasKeyboard() {
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      const store = useThumbnailStore.getState();
      // Skip if in AI view or no editor
      if (store.step !== 'editor') return;

      const ctrl = e.ctrlKey || e.metaKey;
      const isEditing =
        (document.activeElement as HTMLElement)?.getAttribute('contenteditable') === 'true' ||
        document.activeElement?.tagName === 'INPUT' ||
        document.activeElement?.tagName === 'TEXTAREA' ||
        document.activeElement?.tagName === 'SELECT';

      // Undo: Ctrl+Z (always, even while editing)
      if (ctrl && e.key === 'z' && !e.shiftKey) {
        e.preventDefault();
        if (store.historyCount > 0) {
          store.undo();
          useNotificationStore.getState().addToast('info', useLocaleStore.getState().t('editor.actionUndone'), 1500);
        }
        return;
      }

      // Redo: Ctrl+Shift+Z or Ctrl+Y
      if (ctrl && ((e.key === 'z' && e.shiftKey) || e.key === 'y')) {
        e.preventDefault();
        if (store.futureCount > 0) {
          store.redo();
          useNotificationStore.getState().addToast('info', useLocaleStore.getState().t('editor.actionRedone'), 1500);
        }
        return;
      }

      // Note: `?` shortcut is now handled by useGlobalShortcuts

      // Skip rest if editing text
      if (isEditing) return;

      // Toggle rulers: Shift+R
      if (e.shiftKey && e.key === 'R' && 'setShowRulers' in store) {
        e.preventDefault();
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        (store as any).setShowRulers(!(store as any).showRulers);
        return;
      }

      // Copy style: Alt+C
      if (e.altKey && e.key === 'c' && 'copyStyle' in store) {
        e.preventDefault();
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        (store as any).copyStyle();
        return;
      }

      // Paste style: Alt+V
      if (e.altKey && e.key === 'v' && 'pasteStyle' in store) {
        e.preventDefault();
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        (store as any).pasteStyle();
        return;
      }

      // Copy: Ctrl+C
      if (ctrl && e.key === 'c') {
        store.copySelected();
        return;
      }

      // Paste: Ctrl+V
      if (ctrl && e.key === 'v') {
        e.preventDefault();
        store.pasteClipboard();
        return;
      }

      // Cut: Ctrl+X
      if (ctrl && e.key === 'x') {
        store.cutSelected();
        return;
      }

      // Duplicate: Ctrl+D
      if (ctrl && e.key === 'd') {
        e.preventDefault();
        store.duplicateSelected();
        return;
      }

      // Group: Ctrl+G / Ungroup: Ctrl+Shift+G
      if (ctrl && e.key === 'g') {
        e.preventDefault();
        if (e.shiftKey) store.ungroupSelected();
        else store.groupSelected();
        return;
      }

      // Select all: Ctrl+A
      if (ctrl && e.key === 'a') {
        e.preventDefault();
        store.setSelIds(store.els.map((el) => el.id));
        return;
      }

      // Delete: Delete or Backspace — batch into a single undo step
      if (e.key === 'Delete' || e.key === 'Backspace') {
        const ids = [...store.selIds];
        if (ids.length > 0) {
          store.pushHistory();
          // Delete all selected elements without pushing history for each one
          const currentEls = useThumbnailStore.getState().els;
          const idSet = new Set(ids);
          useThumbnailStore.setState({
            els: currentEls.filter((e) => !idSet.has(e.id)),
            selIds: [],
          });
        }
        return;
      }

      // Escape: close context menu first, then deselect
      if (e.key === 'Escape') {
        if (store.contextMenu) {
          store.setContextMenu(null);
          return;
        }
        store.setSelIds([]);
        store.setTool('select');
        return;
      }

      // Ctrl+0: Fit to screen
      if (ctrl && e.key === '0') {
        e.preventDefault();
        store.fitToScreen();
        return;
      }

      // Group: Ctrl+G
      if (ctrl && e.key === 'g' && !e.shiftKey) {
        e.preventDefault();
        store.groupSelected();
        return;
      }

      // Ungroup: Ctrl+Shift+G
      if (ctrl && e.key === 'g' && e.shiftKey) {
        e.preventDefault();
        store.ungroupSelected();
        return;
      }

      // Bring to front: Ctrl+] / Send to back: Ctrl+[
      if (ctrl && (e.key === ']' || e.key === '[') && store.selIds.length === 1) {
        e.preventDefault();
        const id = store.selIds[0];
        e.key === ']' ? store.bringFront(id) : store.sendBack(id);
        return;
      }

      // Zoom: Ctrl+= / Ctrl+-
      if (ctrl && (e.key === '=' || e.key === '+')) {
        e.preventDefault();
        store.zoomIn();
        return;
      }
      if (ctrl && e.key === '-') {
        e.preventDefault();
        store.zoomOut();
        return;
      }

      // Zoom: +/- without modifier
      if ((e.key === '=' || e.key === '+') && !ctrl) {
        e.preventDefault();
        store.zoomIn();
        return;
      }
      if (e.key === '-' && !ctrl) {
        e.preventDefault();
        store.zoomOut();
        return;
      }

      // Arrow keys: nudge selected elements (with debounced undo)
      if (['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight'].includes(e.key) && store.selIds.length > 0) {
        e.preventDefault();
        store.pushHistoryDebounced();
        const step = e.shiftKey ? 10 : 1;
        const dx = e.key === 'ArrowLeft' ? -step : e.key === 'ArrowRight' ? step : 0;
        const dy = e.key === 'ArrowUp' ? -step : e.key === 'ArrowDown' ? step : 0;
        store.selIds.forEach((id) => {
          const el = useThumbnailStore.getState().els.find((e) => e.id === id);
          if (el) store.updEl(id, { x: el.x + dx, y: el.y + dy });
        });
        return;
      }
    };

    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, []);
}
