import { describe, it, expect, beforeEach } from 'vitest';
import { useThumbnailStore } from '@/stores/useThumbnailStore';
import { CANVAS_DEFAULT_BG, CANVAS_DEFAULT_DRAW_COLOR, CANVAS_DEFAULT_DRAW_SIZE, CANVAS_ZOOM_MIN, CANVAS_ZOOM_MAX, STICKY_NOTE_COLOR, CANVAS_W, CANVAS_H } from '@/lib/constants';

function resetStore() {
  const store = useThumbnailStore.getState();
  // Reset to defaults
  useThumbnailStore.setState({
    els: [],
    selIds: [],
    history: [],
    future: [],
    clipboard: null,
    zoom: 1,
    panX: 0,
    panY: 0,
    canvasBg: CANVAS_DEFAULT_BG,
    canvasW: CANVAS_W,
    canvasH: CANVAS_H,
    leftPanel: 'none',
    tool: 'select',
    step: 'editor',
    guides: { x: [], y: [] },
    shapeSub: 'rect',
    aiReferenceImage: null,
    linePreview: null,
  });
}

describe('useThumbnailStore', () => {
  beforeEach(resetStore);

  // ===== Element creation =====
  describe('element creation', () => {
    it('addText creates a text element', () => {
      useThumbnailStore.getState().addText();
      const { els, selIds } = useThumbnailStore.getState();
      expect(els.length).toBe(1);
      expect(els[0].type).toBe('text');
      expect(els[0].text).toBe('Новый текст');
      expect(selIds).toContain(els[0].id);
    });

    it('addRect creates a rectangle', () => {
      useThumbnailStore.getState().addRect();
      const { els } = useThumbnailStore.getState();
      expect(els.length).toBe(1);
      expect(els[0].type).toBe('rect');
      expect(els[0].color).toBe('#ff2d55');
    });

    it('addCircle creates a circle', () => {
      useThumbnailStore.getState().addCircle();
      const { els } = useThumbnailStore.getState();
      expect(els.length).toBe(1);
      expect(els[0].type).toBe('circle');
    });

    it('addLine creates a line', () => {
      useThumbnailStore.getState().addLine(10, 20, 100, 200);
      const { els } = useThumbnailStore.getState();
      expect(els.length).toBe(1);
      expect(els[0].type).toBe('line');
      expect(els[0].x).toBe(10);
      expect(els[0].y).toBe(20);
      expect(els[0].x2).toBe(100);
      expect(els[0].y2).toBe(200);
    });

    it('addArrow creates an arrow', () => {
      useThumbnailStore.getState().addArrow(50, 50, 200, 100);
      const { els } = useThumbnailStore.getState();
      expect(els.length).toBe(1);
      expect(els[0].type).toBe('arrow');
      expect(els[0].arrowHead).toBe('end');
    });

    it('addStickyNote creates a sticky note', () => {
      useThumbnailStore.getState().addStickyNote(100, 100);
      const { els } = useThumbnailStore.getState();
      expect(els.length).toBe(1);
      expect(els[0].type).toBe('stickyNote');
      expect(els[0].noteColor).toBe('#fef08a');
      expect(els[0].noteText).toBe('Заметка');
    });

    it('addTable creates a table', () => {
      useThumbnailStore.getState().addTable(4, 5);
      const { els } = useThumbnailStore.getState();
      expect(els.length).toBe(1);
      expect(els[0].type).toBe('table');
      expect(els[0].rows).toBe(4);
      expect(els[0].cols).toBe(5);
      expect(els[0].cellData?.length).toBe(4);
    });

    it('addShape delegates to correct creator', () => {
      useThumbnailStore.getState().addShape('triangle');
      const { els } = useThumbnailStore.getState();
      expect(els.length).toBe(1);
      expect(els[0].type).toBe('path');
    });
  });

  // ===== Undo/Redo =====
  describe('undo/redo', () => {
    it('undo restores previous state', () => {
      const s = useThumbnailStore.getState();
      s.addText();
      expect(useThumbnailStore.getState().els.length).toBe(1);
      s.undo();
      expect(useThumbnailStore.getState().els.length).toBe(0);
    });

    it('redo restores undone state', () => {
      const s = useThumbnailStore.getState();
      s.addText();
      s.undo();
      expect(useThumbnailStore.getState().els.length).toBe(0);
      s.redo();
      expect(useThumbnailStore.getState().els.length).toBe(1);
    });

    it('undo does nothing when history is empty', () => {
      useThumbnailStore.getState().undo();
      expect(useThumbnailStore.getState().els.length).toBe(0);
    });

    it('redo does nothing when future is empty', () => {
      useThumbnailStore.getState().redo();
      expect(useThumbnailStore.getState().els.length).toBe(0);
    });

    it('pushHistory caps at MAX_HISTORY (50)', () => {
      const s = useThumbnailStore.getState();
      for (let i = 0; i < 60; i++) {
        s.pushHistory();
        useThumbnailStore.setState({ els: [{ id: `el-${i}`, type: 'rect', x: 0, y: 0, w: 10, h: 10, rot: 0 }] as any });
      }
      expect(useThumbnailStore.getState().history.length).toBeLessThanOrEqual(50);
    });
  });

  // ===== Clipboard =====
  describe('clipboard', () => {
    it('copySelected copies elements', () => {
      const s = useThumbnailStore.getState();
      s.addRect();
      const id = useThumbnailStore.getState().els[0].id;
      useThumbnailStore.setState({ selIds: [id] });
      useThumbnailStore.getState().copySelected();
      expect(useThumbnailStore.getState().clipboard?.length).toBe(1);
    });

    it('pasteClipboard creates new elements with offset', () => {
      const s = useThumbnailStore.getState();
      s.addRect();
      const el = useThumbnailStore.getState().els[0];
      useThumbnailStore.setState({ selIds: [el.id] });
      useThumbnailStore.getState().copySelected();
      useThumbnailStore.getState().pasteClipboard();
      const { els } = useThumbnailStore.getState();
      expect(els.length).toBe(2);
      expect(els[1].x).toBe(el.x + 20); // offset
      expect(els[1].id).not.toBe(el.id); // new id
    });

    it('cutSelected removes originals and fills clipboard', () => {
      const s = useThumbnailStore.getState();
      s.addRect();
      const id = useThumbnailStore.getState().els[0].id;
      useThumbnailStore.setState({ selIds: [id] });
      useThumbnailStore.getState().cutSelected();
      expect(useThumbnailStore.getState().els.length).toBe(0);
      expect(useThumbnailStore.getState().clipboard?.length).toBe(1);
    });

    it('duplicateSelected creates copies', () => {
      const s = useThumbnailStore.getState();
      s.addRect();
      const id = useThumbnailStore.getState().els[0].id;
      useThumbnailStore.setState({ selIds: [id] });
      useThumbnailStore.getState().duplicateSelected();
      expect(useThumbnailStore.getState().els.length).toBe(2);
    });
  });

  // ===== Zoom =====
  describe('zoom', () => {
    it('zoomIn increases zoom', () => {
      useThumbnailStore.getState().zoomIn();
      expect(useThumbnailStore.getState().zoom).toBeCloseTo(1.1);
    });

    it('zoomOut decreases zoom', () => {
      useThumbnailStore.getState().zoomOut();
      expect(useThumbnailStore.getState().zoom).toBeCloseTo(0.9);
    });

    it('zoom is clamped between 0.25 and 3', () => {
      useThumbnailStore.getState().setZoom(5);
      expect(useThumbnailStore.getState().zoom).toBe(3);
      useThumbnailStore.getState().setZoom(0.1);
      expect(useThumbnailStore.getState().zoom).toBe(0.25);
    });

    it('fitToScreen resets zoom and pan', () => {
      useThumbnailStore.setState({ zoom: 2, panX: 100, panY: 50 });
      useThumbnailStore.getState().fitToScreen();
      expect(useThumbnailStore.getState().zoom).toBe(1);
      expect(useThumbnailStore.getState().panX).toBe(0);
      expect(useThumbnailStore.getState().panY).toBe(0);
    });
  });

  // ===== Canvas size =====
  describe('canvas size', () => {
    it('setCanvasSize updates dimensions', () => {
      useThumbnailStore.getState().setCanvasSize(1920, 1080);
      expect(useThumbnailStore.getState().canvasW).toBe(1920);
      expect(useThumbnailStore.getState().canvasH).toBe(1080);
    });
  });

  // ===== Selection =====
  describe('selection', () => {
    it('setSelId sets single selection', () => {
      useThumbnailStore.getState().setSelId('test-id');
      expect(useThumbnailStore.getState().selIds).toEqual(['test-id']);
    });

    it('setSelId(null) clears selection', () => {
      useThumbnailStore.setState({ selIds: ['a', 'b'] });
      useThumbnailStore.getState().setSelId(null);
      expect(useThumbnailStore.getState().selIds).toEqual([]);
    });

    it('addToSelection adds without duplicates', () => {
      useThumbnailStore.setState({ selIds: ['a'] });
      useThumbnailStore.getState().addToSelection('b');
      expect(useThumbnailStore.getState().selIds).toEqual(['a', 'b']);
      useThumbnailStore.getState().addToSelection('b'); // duplicate
      expect(useThumbnailStore.getState().selIds).toEqual(['a', 'b']);
    });
  });

  // ===== Left panel =====
  describe('left panel', () => {
    it('setLeftPanel toggles panel', () => {
      useThumbnailStore.getState().setLeftPanel('uploads');
      expect(useThumbnailStore.getState().leftPanel).toBe('uploads');
      useThumbnailStore.getState().setLeftPanel('uploads'); // same → toggle off
      expect(useThumbnailStore.getState().leftPanel).toBe('none');
    });

    it('setLeftPanel switches between panels', () => {
      useThumbnailStore.getState().setLeftPanel('uploads');
      useThumbnailStore.getState().setLeftPanel('elements');
      expect(useThumbnailStore.getState().leftPanel).toBe('elements');
    });
  });

  // ===== Element operations =====
  describe('element operations', () => {
    it('updEl updates element properties', () => {
      useThumbnailStore.getState().addRect();
      const id = useThumbnailStore.getState().els[0].id;
      useThumbnailStore.getState().updEl(id, { color: '#00ff00', w: 500 });
      const el = useThumbnailStore.getState().els[0];
      expect(el.color).toBe('#00ff00');
      expect(el.w).toBe(500);
    });

    it('delEl removes element', () => {
      useThumbnailStore.getState().addRect();
      const id = useThumbnailStore.getState().els[0].id;
      useThumbnailStore.getState().delEl(id);
      expect(useThumbnailStore.getState().els.length).toBe(0);
    });

    it('bringFront moves element to top', () => {
      useThumbnailStore.getState().addRect();
      useThumbnailStore.getState().addCircle();
      const rectId = useThumbnailStore.getState().els[0].id;
      useThumbnailStore.getState().bringFront(rectId);
      const { els } = useThumbnailStore.getState();
      expect(els[els.length - 1].id).toBe(rectId);
    });

    it('sendBack moves element to bottom', () => {
      useThumbnailStore.getState().addRect();
      useThumbnailStore.getState().addCircle();
      const circleId = useThumbnailStore.getState().els[1].id;
      useThumbnailStore.getState().sendBack(circleId);
      expect(useThumbnailStore.getState().els[0].id).toBe(circleId);
    });
  });

  // ===== Save/Load + backward compat =====
  describe('save/load', () => {
    it('exportState returns current state', () => {
      useThumbnailStore.getState().addRect();
      useThumbnailStore.setState({ canvasBg: '#ff0000', canvasW: 1920, canvasH: 1080 });
      const exported = useThumbnailStore.getState().exportState();
      expect(exported.els.length).toBe(1);
      expect(exported.canvasBg).toBe('#ff0000');
      expect(exported.canvasW).toBe(1920);
      expect(exported.canvasH).toBe(1080);
    });

    it('loadFromProject loads elements and canvas settings', () => {
      useThumbnailStore.getState().loadFromProject({
        els: [{ id: 'test', type: 'rect', x: 0, y: 0, w: 100, h: 100, rot: 0 } as any],
        canvasBg: '#123456',
        canvasW: 1080,
        canvasH: 1080,
      });
      const s = useThumbnailStore.getState();
      expect(s.els.length).toBe(1);
      expect(s.canvasBg).toBe('#123456');
      expect(s.canvasW).toBe(1080);
      expect(s.canvasH).toBe(1080);
      expect(s.history.length).toBe(0);
      expect(s.selIds).toEqual([]);
    });

    it('loadFromProject handles old format without canvasW/H', () => {
      useThumbnailStore.getState().loadFromProject({
        els: [{ id: 'old', type: 'text', x: 0, y: 0, w: 300, h: 50, rot: 0 } as any],
        canvasBg: '#000000',
      });
      const s = useThumbnailStore.getState();
      expect(s.els.length).toBe(1);
      expect(s.canvasW).toBe(1280); // default
      expect(s.canvasH).toBe(720);  // default
    });

    it('loadFromProject handles null', () => {
      useThumbnailStore.getState().addRect();
      useThumbnailStore.getState().loadFromProject(null);
      // Should not crash, state unchanged
      expect(useThumbnailStore.getState().els.length).toBe(1);
    });
  });

  // ===== Default constants verification =====
  describe('defaults use constants', () => {
    it('initial canvasBg matches CANVAS_DEFAULT_BG', () => {
      expect(useThumbnailStore.getState().canvasBg).toBe(CANVAS_DEFAULT_BG);
    });

    it('initial drawColor matches CANVAS_DEFAULT_DRAW_COLOR', () => {
      expect(useThumbnailStore.getState().drawColor).toBe(CANVAS_DEFAULT_DRAW_COLOR);
    });

    it('initial drawSize matches CANVAS_DEFAULT_DRAW_SIZE', () => {
      expect(useThumbnailStore.getState().drawSize).toBe(CANVAS_DEFAULT_DRAW_SIZE);
    });

    it('zoom clamping uses CANVAS_ZOOM_MIN and CANVAS_ZOOM_MAX', () => {
      useThumbnailStore.getState().setZoom(CANVAS_ZOOM_MIN - 0.1);
      expect(useThumbnailStore.getState().zoom).toBe(CANVAS_ZOOM_MIN);
      useThumbnailStore.getState().setZoom(CANVAS_ZOOM_MAX + 1);
      expect(useThumbnailStore.getState().zoom).toBe(CANVAS_ZOOM_MAX);
    });
  });

  // ===== Sticky note =====
  describe('sticky note', () => {
    it('addStickyNote uses STICKY_NOTE_COLOR', () => {
      useThumbnailStore.getState().addStickyNote();
      const el = useThumbnailStore.getState().els[0];
      expect(el.type).toBe('stickyNote');
      expect(el.noteColor).toBe(STICKY_NOTE_COLOR);
    });

    it('addStickyNote accepts custom position', () => {
      useThumbnailStore.getState().addStickyNote(50, 75);
      const el = useThumbnailStore.getState().els[0];
      expect(el.x).toBe(50);
      expect(el.y).toBe(75);
    });
  });

  // ===== Table =====
  describe('table', () => {
    it('addTable creates table with specified dimensions', () => {
      useThumbnailStore.getState().addTable(4, 5);
      const el = useThumbnailStore.getState().els[0];
      expect(el.type).toBe('table');
      expect(el.rows).toBe(4);
      expect(el.cols).toBe(5);
      expect(el.cellData?.length).toBe(4);
      expect(el.cellData?.[0].length).toBe(5);
    });

    it('addTable defaults to 3x3', () => {
      useThumbnailStore.getState().addTable();
      const el = useThumbnailStore.getState().els[0];
      expect(el.rows).toBe(3);
      expect(el.cols).toBe(3);
    });
  });

  // ===== Drawing =====
  describe('drawing', () => {
    it('setDrawColor updates draw color', () => {
      useThumbnailStore.getState().setDrawColor('#00ff00');
      expect(useThumbnailStore.getState().drawColor).toBe('#00ff00');
    });

    it('setDrawSize updates draw size', () => {
      useThumbnailStore.getState().setDrawSize(8);
      expect(useThumbnailStore.getState().drawSize).toBe(8);
    });

    it('setCanvasBg changes background', () => {
      useThumbnailStore.getState().setCanvasBg('#ffffff');
      expect(useThumbnailStore.getState().canvasBg).toBe('#ffffff');
    });
  });

  // ===== Shape sub-tool =====
  describe('shape sub-tool', () => {
    it('setShapeSub changes shape type', () => {
      useThumbnailStore.getState().setShapeSub('circle');
      expect(useThumbnailStore.getState().shapeSub).toBe('circle');
      useThumbnailStore.getState().setShapeSub('star');
      expect(useThumbnailStore.getState().shapeSub).toBe('star');
    });
  });

  // ===== Tool switching =====
  describe('tool switching', () => {
    it('setTool changes active tool', () => {
      useThumbnailStore.getState().setTool('draw');
      expect(useThumbnailStore.getState().tool).toBe('draw');
      useThumbnailStore.getState().setTool('eraser');
      expect(useThumbnailStore.getState().tool).toBe('eraser');
    });
  });

  // ===== Line and Arrow creation =====
  describe('line/arrow creation', () => {
    it('addLine creates line element with default coords', () => {
      useThumbnailStore.getState().addLine();
      const el = useThumbnailStore.getState().els[0];
      expect(el.type).toBe('line');
      expect(el.x).toBe(200);
      expect(el.y).toBe(200);
      expect(el.x2).toBe(400);
      expect(el.y2).toBe(200);
      expect(el.strokeColor).toBe('#ffffff');
      expect(el.lineWidth).toBe(2);
      expect(el.dashStyle).toBe('solid');
    });

    it('addLine with custom coords', () => {
      useThumbnailStore.getState().addLine(10, 20, 300, 400);
      const el = useThumbnailStore.getState().els[0];
      expect(el.x).toBe(10);
      expect(el.y).toBe(20);
      expect(el.x2).toBe(300);
      expect(el.y2).toBe(400);
    });

    it('addLine switches tool to select (one-shot)', () => {
      useThumbnailStore.getState().setTool('line');
      useThumbnailStore.getState().addLine();
      expect(useThumbnailStore.getState().tool).toBe('select');
    });

    it('addArrow creates arrow element with arrowHead', () => {
      useThumbnailStore.getState().addArrow();
      const el = useThumbnailStore.getState().els[0];
      expect(el.type).toBe('arrow');
      expect(el.arrowHead).toBe('end');
    });

    it('addArrow switches tool to select', () => {
      useThumbnailStore.getState().setTool('arrow');
      useThumbnailStore.getState().addArrow();
      expect(useThumbnailStore.getState().tool).toBe('select');
    });
  });

  // ===== Copy / Paste =====
  describe('clipboard operations', () => {
    it('copySelected stores selected elements in clipboard', () => {
      useThumbnailStore.getState().addRect();
      useThumbnailStore.getState().addCircle();
      const ids = useThumbnailStore.getState().els.map((e) => e.id);
      useThumbnailStore.setState({ selIds: ids });
      useThumbnailStore.getState().copySelected();
      expect(useThumbnailStore.getState().clipboard).not.toBeNull();
      expect(useThumbnailStore.getState().clipboard!.length).toBe(2);
    });

    it('copySelected with no selection does nothing', () => {
      useThumbnailStore.setState({ selIds: [] });
      useThumbnailStore.getState().copySelected();
      expect(useThumbnailStore.getState().clipboard).toBeNull();
    });

    it('pasteClipboard creates new elements offset by 20px', () => {
      useThumbnailStore.getState().addRect();
      const origEl = useThumbnailStore.getState().els[0];
      useThumbnailStore.setState({ selIds: [origEl.id] });
      useThumbnailStore.getState().copySelected();
      useThumbnailStore.getState().pasteClipboard();
      const { els } = useThumbnailStore.getState();
      expect(els.length).toBe(2);
      const pasted = els[1];
      expect(pasted.id).not.toBe(origEl.id);
      expect(pasted.x).toBe(origEl.x + 20);
      expect(pasted.y).toBe(origEl.y + 20);
    });

    it('pasteClipboard selects the newly pasted elements', () => {
      useThumbnailStore.getState().addRect();
      const origId = useThumbnailStore.getState().els[0].id;
      useThumbnailStore.setState({ selIds: [origId] });
      useThumbnailStore.getState().copySelected();
      useThumbnailStore.getState().pasteClipboard();
      const { selIds, els } = useThumbnailStore.getState();
      expect(selIds.length).toBe(1);
      expect(selIds[0]).not.toBe(origId);
      expect(selIds[0]).toBe(els[1].id);
    });

    it('pasteClipboard with empty clipboard does nothing', () => {
      useThumbnailStore.setState({ clipboard: null });
      useThumbnailStore.getState().pasteClipboard();
      expect(useThumbnailStore.getState().els.length).toBe(0);
    });
  });

  // ===== Undo / Redo edge cases =====
  describe('undo/redo edge cases', () => {
    it('undo with empty history does nothing', () => {
      useThumbnailStore.getState().undo();
      expect(useThumbnailStore.getState().els.length).toBe(0);
    });

    it('redo with empty future does nothing', () => {
      useThumbnailStore.getState().redo();
      expect(useThumbnailStore.getState().els.length).toBe(0);
    });

    it('undo clears selection', () => {
      useThumbnailStore.getState().addRect();
      const id = useThumbnailStore.getState().els[0].id;
      useThumbnailStore.setState({ selIds: [id] });
      useThumbnailStore.getState().undo();
      expect(useThumbnailStore.getState().selIds).toEqual([]);
    });

    it('redo clears selection', () => {
      useThumbnailStore.getState().addRect();
      useThumbnailStore.getState().undo();
      useThumbnailStore.setState({ selIds: ['some-id'] });
      useThumbnailStore.getState().redo();
      expect(useThumbnailStore.getState().selIds).toEqual([]);
    });

    it('undo then redo restores original state', () => {
      useThumbnailStore.getState().addRect();
      const original = useThumbnailStore.getState().els[0];
      useThumbnailStore.getState().undo();
      expect(useThumbnailStore.getState().els.length).toBe(0);
      useThumbnailStore.getState().redo();
      expect(useThumbnailStore.getState().els.length).toBe(1);
      expect(useThumbnailStore.getState().els[0].type).toBe(original.type);
    });
  });

  // ===== Multiple element operations =====
  describe('multiple element operations', () => {
    it('adding multiple shapes of different types', () => {
      const s = useThumbnailStore.getState();
      s.addRect(); s.addCircle(); s.addShape('triangle'); s.addShape('star');
      const { els } = useThumbnailStore.getState();
      expect(els.length).toBe(4);
      expect(els[0].type).toBe('rect');
      expect(els[1].type).toBe('circle');
      // triangle and star are stored as 'path' type elements
      expect(els[2].type).toBe('path');
      expect(els[3].type).toBe('path');
    });

    it('deleting middle element preserves order', () => {
      const s = useThumbnailStore.getState();
      s.addRect(); s.addCircle(); s.addRect();
      const middleId = useThumbnailStore.getState().els[1].id;
      useThumbnailStore.getState().delEl(middleId);
      const { els } = useThumbnailStore.getState();
      expect(els.length).toBe(2);
      expect(els[0].type).toBe('rect');
      expect(els[1].type).toBe('rect');
    });

    it('updEl on non-existent ID does not crash', () => {
      useThumbnailStore.getState().addRect();
      useThumbnailStore.getState().updEl('non-existent', { color: '#ff0000' });
      expect(useThumbnailStore.getState().els[0].color).not.toBe('#ff0000');
    });
  });
});
