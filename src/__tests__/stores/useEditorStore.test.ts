import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest';
import { useEditorStore } from '@/stores/useEditorStore';

describe('useEditorStore', () => {
  beforeEach(() => {
    useEditorStore.setState({
      scenes: [
        { id: 's1', label: 'Сцена 1', prompt: 'test', duration: 8, status: 'ready', ck: 'blue', chars: [], model: 'standard', sf: null, ef: null, enh: true, snd: true },
      ],
      selId: 's1',
      chars: [],
    });
  });

  it('should add a scene', () => {
    const ns = useEditorStore.getState().addScene();
    expect(ns.status).toBe('empty');
    expect(useEditorStore.getState().scenes.length).toBe(2);
  });

  it('should delete a scene', () => {
    useEditorStore.getState().delScene('s1');
    expect(useEditorStore.getState().scenes.length).toBe(0);
  });

  it('should update a scene', () => {
    useEditorStore.getState().updScene('s1', { label: 'Updated' });
    expect(useEditorStore.getState().scenes[0].label).toBe('Updated');
  });

  it('should duplicate a scene', () => {
    useEditorStore.getState().dupScene('s1');
    const scenes = useEditorStore.getState().scenes;
    expect(scenes.length).toBe(2);
    expect(scenes[1].label).toContain('копия');
  });

  it('should split a scene', () => {
    useEditorStore.getState().splitScene('s1');
    const scenes = useEditorStore.getState().scenes;
    expect(scenes.length).toBe(2);
    expect(scenes[0].label).toContain('A');
    expect(scenes[1].label).toContain('B');
  });

  it('should reorder scenes', () => {
    const s2 = useEditorStore.getState().addScene();
    useEditorStore.getState().reorderScenes(s2.id, 's1');
    const ids = useEditorStore.getState().scenes.map((s) => s.id);
    expect(ids[0]).toBe(s2.id);
    expect(ids[1]).toBe('s1');
  });

  it('should manage characters (save, delete)', () => {
    useEditorStore.setState({ editCh: 'new', chForm: { name: 'Алиса', role: 'main', avatar: '👩', ck: 'red', desc: '' } });
    useEditorStore.getState().saveCh();
    expect(useEditorStore.getState().chars.length).toBe(1);
    expect(useEditorStore.getState().chars[0].name).toBe('Алиса');
    const charId = useEditorStore.getState().chars[0].id;
    useEditorStore.getState().delCh(charId);
    expect(useEditorStore.getState().chars.length).toBe(0);
  });

  it('should toggle character on scene', () => {
    useEditorStore.setState({ chars: [{ id: 'c1', name: 'Боб', role: 'hero', avatar: '🧑', ck: 'blue', desc: '' }] });
    useEditorStore.getState().togChar('s1', 'c1');
    expect(useEditorStore.getState().scenes[0].chars).toContain('c1');
    useEditorStore.getState().togChar('s1', 'c1');
    expect(useEditorStore.getState().scenes[0].chars).not.toContain('c1');
  });
});

describe('useEditorStore – timers', () => {
  beforeEach(() => {
    vi.useFakeTimers();
    useEditorStore.setState({
      scenes: [
        { id: 's1', label: 'Сцена 1', prompt: 'test', duration: 8, status: 'ready', ck: 'blue', chars: [], model: 'standard', sf: null, ef: null, enh: true, snd: true },
      ],
      selId: 's1',
      chars: [],
    });
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('regenScene should set status to generating then error after 30s', () => {
    useEditorStore.getState().regenScene('s1', 'new prompt');
    expect(useEditorStore.getState().scenes[0].status).toBe('generating');
    expect(useEditorStore.getState().scenes[0].prompt).toBe('new prompt');

    vi.advanceTimersByTime(30000);
    expect(useEditorStore.getState().scenes[0].status).toBe('error');
  });

  it('regenScene should not switch to error if status changed before timeout', () => {
    useEditorStore.getState().regenScene('s1');
    // Simulate successful generation before timeout
    useEditorStore.getState().updScene('s1', { status: 'ready' });

    vi.advanceTimersByTime(30000);
    // Should still be ready, not error
    expect(useEditorStore.getState().scenes[0].status).toBe('ready');
  });

  it('addSceneFromPrompt should create scene in generating state and timeout to error', () => {
    useEditorStore.getState().addSceneFromPrompt('тестовый промпт');
    const scenes = useEditorStore.getState().scenes;
    expect(scenes.length).toBe(2);
    const added = scenes[1];
    expect(added.status).toBe('generating');
    expect(added.prompt).toBe('тестовый промпт');

    vi.advanceTimersByTime(30000);
    expect(useEditorStore.getState().scenes[1].status).toBe('error');
  });

  it('loadProject should cancel pending generation timers', () => {
    // Start generation — creates a 30s timer
    useEditorStore.getState().regenScene('s1');
    expect(useEditorStore.getState().scenes[0].status).toBe('generating');

    // Load a new project — should cancel the timer
    useEditorStore.getState().loadProject({
      id: 'p2',
      scenes: [{ id: 's2', prompt: 'fresh', label: 'Сцена 1', duration: 5, status: 'ready', model: 'standard', videoUrl: null }],
    });

    // Advance past the original 30s timeout
    vi.advanceTimersByTime(30000);
    // The new project's scene should NOT be changed to error
    expect(useEditorStore.getState().scenes[0].status).toBe('ready');
  });

  it('delScene should cancel pending generation timer for that scene', () => {
    useEditorStore.getState().regenScene('s1');
    useEditorStore.getState().delScene('s1');

    vi.advanceTimersByTime(30000);
    // Scene was deleted, no error should be set
    expect(useEditorStore.getState().scenes.length).toBe(0);
  });
});
