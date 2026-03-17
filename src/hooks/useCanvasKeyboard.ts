import { useEffect } from 'react';
import { useThumbnailStore } from '@/stores/useThumbnailStore';
import { useNotificationStore } from '@/stores/useNotificationStore';

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
        store.undo();
        return;
      }

      // Redo: Ctrl+Shift+Z or Ctrl+Y
      if (ctrl && ((e.key === 'z' && e.shiftKey) || e.key === 'y')) {
        e.preventDefault();
        store.redo();
        return;
      }

      // `?` key toggles keyboard shortcuts modal (only when not editing text)
      if (e.key === '?' && !isEditing) {
        const ns = useNotificationStore.getState();
        ns.setShowShortcuts(!ns.showShortcuts);
        return;
      }

      // Skip rest if editing text
      if (isEditing) return;

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

      // Select all: Ctrl+A
      if (ctrl && e.key === 'a') {
        e.preventDefault();
        store.setSelIds(store.els.map((el) => el.id));
        return;
      }

      // Delete: Delete or Backspace (delEl already pushes history internally)
      if (e.key === 'Delete' || e.key === 'Backspace') {
        const ids = [...store.selIds];
        if (ids.length > 0) {
          ids.forEach((id) => {
            useThumbnailStore.getState().delEl(id);
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

      // Arrow keys: nudge selected elements (with undo support)
      if (['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight'].includes(e.key) && store.selIds.length > 0) {
        e.preventDefault();
        store.pushHistory();
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
