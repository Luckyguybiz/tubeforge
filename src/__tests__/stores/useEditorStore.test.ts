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

describe('useEditorStore – addSceneFromPrompt', () => {
  beforeEach(() => {
    vi.useFakeTimers();
    useEditorStore.setState({
      scenes: [],
      selId: null,
      chars: [],
      genIn: 'leftover',
    });
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('creates a scene with the given prompt and generating status', () => {
    useEditorStore.getState().addSceneFromPrompt('a cat walking on the moon');
    const scenes = useEditorStore.getState().scenes;
    expect(scenes.length).toBe(1);
    expect(scenes[0].prompt).toBe('a cat walking on the moon');
    expect(scenes[0].status).toBe('generating');
    expect(scenes[0].duration).toBe(5);
    expect(scenes[0].model).toBe('standard');
  });

  it('selects the newly created scene and clears genIn', () => {
    useEditorStore.getState().addSceneFromPrompt('some prompt');
    const state = useEditorStore.getState();
    expect(state.selId).toBe(state.scenes[0].id);
    expect(state.genIn).toBe('');
  });

  it('appends scene when scenes already exist', () => {
    useEditorStore.setState({
      scenes: [
        { id: 's1', label: 'Сцена 1', prompt: 'existing', duration: 5, status: 'ready', ck: 'blue', chars: [], model: 'standard', sf: null, ef: null, enh: true, snd: true },
      ],
    });
    useEditorStore.getState().addSceneFromPrompt('new prompt');
    const scenes = useEditorStore.getState().scenes;
    expect(scenes.length).toBe(2);
    expect(scenes[0].prompt).toBe('existing');
    expect(scenes[1].prompt).toBe('new prompt');
  });

  it('handles empty prompt — scene is created with empty string', () => {
    useEditorStore.getState().addSceneFromPrompt('');
    const scenes = useEditorStore.getState().scenes;
    expect(scenes.length).toBe(1);
    expect(scenes[0].prompt).toBe('');
    expect(scenes[0].status).toBe('generating');
  });
});

describe('useEditorStore – dupScene', () => {
  beforeEach(() => {
    useEditorStore.setState({
      scenes: [
        { id: 's1', label: 'Сцена 1', prompt: 'original prompt', duration: 8, status: 'ready', ck: 'blue', chars: ['c1'], model: 'pro', sf: 'fade', ef: 'zoom', enh: true, snd: false },
      ],
      selId: 's1',
      chars: [],
    });
  });

  it('creates a copy with a new ID', () => {
    useEditorStore.getState().dupScene('s1');
    const scenes = useEditorStore.getState().scenes;
    expect(scenes.length).toBe(2);
    expect(scenes[1].id).not.toBe('s1');
  });

  it('copies prompt, duration, model, and other content', () => {
    useEditorStore.getState().dupScene('s1');
    const dup = useEditorStore.getState().scenes[1];
    expect(dup.prompt).toBe('original prompt');
    expect(dup.duration).toBe(8);
    expect(dup.model).toBe('pro');
    expect(dup.ck).toBe('blue');
    expect(dup.chars).toEqual(['c1']);
    expect(dup.sf).toBe('fade');
    expect(dup.ef).toBe('zoom');
    expect(dup.enh).toBe(true);
    expect(dup.snd).toBe(false);
  });

  it('sets the label to original + " (копия)"', () => {
    useEditorStore.getState().dupScene('s1');
    const dup = useEditorStore.getState().scenes[1];
    expect(dup.label).toBe('Сцена 1 (копия)');
  });

  it('sets status to "editing"', () => {
    useEditorStore.getState().dupScene('s1');
    const dup = useEditorStore.getState().scenes[1];
    expect(dup.status).toBe('editing');
  });

  it('inserts the duplicate right after the original', () => {
    useEditorStore.setState({
      scenes: [
        { id: 's1', label: 'Сцена 1', prompt: 'p1', duration: 5, status: 'ready', ck: 'blue', chars: [], model: 'standard', sf: null, ef: null, enh: true, snd: true },
        { id: 's2', label: 'Сцена 2', prompt: 'p2', duration: 5, status: 'ready', ck: 'green', chars: [], model: 'standard', sf: null, ef: null, enh: true, snd: true },
      ],
    });
    useEditorStore.getState().dupScene('s1');
    const ids = useEditorStore.getState().scenes.map((s) => s.id);
    expect(ids.length).toBe(3);
    expect(ids[0]).toBe('s1');
    expect(ids[2]).toBe('s2');
    // The duplicated scene should be at index 1
    expect(ids[1]).not.toBe('s1');
    expect(ids[1]).not.toBe('s2');
  });

  it('does nothing if the scene ID does not exist', () => {
    useEditorStore.getState().dupScene('nonexistent');
    expect(useEditorStore.getState().scenes.length).toBe(1);
  });
});

describe('useEditorStore – splitScene', () => {
  beforeEach(() => {
    useEditorStore.setState({
      scenes: [
        { id: 's1', label: 'Сцена 1', prompt: 'test prompt', duration: 8, status: 'ready', ck: 'blue', chars: ['c1'], model: 'pro', sf: 'fade', ef: 'zoom', enh: true, snd: true },
      ],
      selId: 's1',
      chars: [],
    });
  });

  it('splits a scene into two halves', () => {
    useEditorStore.getState().splitScene('s1');
    const scenes = useEditorStore.getState().scenes;
    expect(scenes.length).toBe(2);
  });

  it('assigns correct durations (ceil + remainder)', () => {
    useEditorStore.getState().splitScene('s1');
    const scenes = useEditorStore.getState().scenes;
    // duration=8 -> ceil(8/2)=4, 8-4=4
    expect(scenes[0].duration).toBe(4);
    expect(scenes[1].duration).toBe(4);
  });

  it('assigns correct durations for odd duration', () => {
    useEditorStore.getState().updScene('s1', { duration: 7 });
    useEditorStore.getState().splitScene('s1');
    const scenes = useEditorStore.getState().scenes;
    // duration=7 -> ceil(7/2)=4, 7-4=3
    expect(scenes[0].duration).toBe(4);
    expect(scenes[1].duration).toBe(3);
  });

  it('labels parts with " — A" and " — B" suffixes', () => {
    useEditorStore.getState().splitScene('s1');
    const scenes = useEditorStore.getState().scenes;
    expect(scenes[0].label).toBe('Сцена 1 — A');
    expect(scenes[1].label).toBe('Сцена 1 — B');
  });

  it('part A keeps the original prompt; part B gets empty prompt', () => {
    useEditorStore.getState().splitScene('s1');
    const scenes = useEditorStore.getState().scenes;
    expect(scenes[0].prompt).toBe('test prompt');
    expect(scenes[1].prompt).toBe('');
  });

  it('part B has status "editing" and null sf/ef', () => {
    useEditorStore.getState().splitScene('s1');
    const scenes = useEditorStore.getState().scenes;
    expect(scenes[1].status).toBe('editing');
    expect(scenes[1].sf).toBeNull();
    expect(scenes[1].ef).toBeNull();
  });

  it('both parts get new IDs', () => {
    useEditorStore.getState().splitScene('s1');
    const scenes = useEditorStore.getState().scenes;
    expect(scenes[0].id).not.toBe('s1');
    expect(scenes[1].id).not.toBe('s1');
    expect(scenes[0].id).not.toBe(scenes[1].id);
  });

  it('does not split a scene with duration < 2 (1-second scene)', () => {
    useEditorStore.getState().updScene('s1', { duration: 1 });
    useEditorStore.getState().splitScene('s1');
    const scenes = useEditorStore.getState().scenes;
    expect(scenes.length).toBe(1);
    expect(scenes[0].id).toBe('s1');
  });

  it('does not split if scene ID does not exist', () => {
    useEditorStore.getState().splitScene('nonexistent');
    expect(useEditorStore.getState().scenes.length).toBe(1);
  });

  it('correctly splits a scene with duration exactly 2', () => {
    useEditorStore.getState().updScene('s1', { duration: 2 });
    useEditorStore.getState().splitScene('s1');
    const scenes = useEditorStore.getState().scenes;
    expect(scenes.length).toBe(2);
    expect(scenes[0].duration).toBe(1);
    expect(scenes[1].duration).toBe(1);
  });
});

describe('useEditorStore – reorderScenes', () => {
  beforeEach(() => {
    useEditorStore.setState({
      scenes: [
        { id: 's1', label: 'Сцена 1', prompt: 'p1', duration: 5, status: 'ready', ck: 'blue', chars: [], model: 'standard', sf: null, ef: null, enh: true, snd: true },
        { id: 's2', label: 'Сцена 2', prompt: 'p2', duration: 5, status: 'ready', ck: 'green', chars: [], model: 'standard', sf: null, ef: null, enh: true, snd: true },
        { id: 's3', label: 'Сцена 3', prompt: 'p3', duration: 5, status: 'ready', ck: 'purple', chars: [], model: 'standard', sf: null, ef: null, enh: true, snd: true },
      ],
      selId: 's1',
      chars: [],
    });
  });

  it('moves the first scene to the last position', () => {
    // reorder removes s1 (index 0), then inserts at s3's original index (2)
    // after removal array is [s2, s3], inserting at index 2 appends: [s2, s3, s1]
    useEditorStore.getState().reorderScenes('s1', 's3');
    const ids = useEditorStore.getState().scenes.map((s) => s.id);
    expect(ids).toEqual(['s2', 's3', 's1']);
  });

  it('moves the last scene to the first position', () => {
    useEditorStore.getState().reorderScenes('s3', 's1');
    const ids = useEditorStore.getState().scenes.map((s) => s.id);
    expect(ids).toEqual(['s3', 's1', 's2']);
  });

  it('is a no-op when fromId === toId', () => {
    useEditorStore.getState().reorderScenes('s2', 's2');
    const ids = useEditorStore.getState().scenes.map((s) => s.id);
    expect(ids).toEqual(['s1', 's2', 's3']);
  });

  it('moves middle scene to front', () => {
    useEditorStore.getState().reorderScenes('s2', 's1');
    const ids = useEditorStore.getState().scenes.map((s) => s.id);
    expect(ids).toEqual(['s2', 's1', 's3']);
  });
});

describe('useEditorStore – togChar', () => {
  beforeEach(() => {
    useEditorStore.setState({
      scenes: [
        { id: 's1', label: 'Сцена 1', prompt: 'p1', duration: 5, status: 'ready', ck: 'blue', chars: [], model: 'standard', sf: null, ef: null, enh: true, snd: true },
      ],
      chars: [
        { id: 'c1', name: 'Алиса', role: 'main', avatar: '👩', ck: 'red', desc: '' },
        { id: 'c2', name: 'Боб', role: 'hero', avatar: '🧑', ck: 'blue', desc: '' },
      ],
      selId: 's1',
    });
  });

  it('adds a character to a scene', () => {
    useEditorStore.getState().togChar('s1', 'c1');
    expect(useEditorStore.getState().scenes[0].chars).toEqual(['c1']);
  });

  it('removes a character from a scene when toggled again', () => {
    useEditorStore.getState().togChar('s1', 'c1');
    useEditorStore.getState().togChar('s1', 'c1');
    expect(useEditorStore.getState().scenes[0].chars).toEqual([]);
  });

  it('supports multiple characters on one scene', () => {
    useEditorStore.getState().togChar('s1', 'c1');
    useEditorStore.getState().togChar('s1', 'c2');
    expect(useEditorStore.getState().scenes[0].chars).toEqual(['c1', 'c2']);
  });

  it('only removes the targeted character', () => {
    useEditorStore.getState().togChar('s1', 'c1');
    useEditorStore.getState().togChar('s1', 'c2');
    useEditorStore.getState().togChar('s1', 'c1');
    expect(useEditorStore.getState().scenes[0].chars).toEqual(['c2']);
  });
});

describe('useEditorStore – saveCh / delCh', () => {
  beforeEach(() => {
    useEditorStore.setState({
      scenes: [
        { id: 's1', label: 'Сцена 1', prompt: 'p1', duration: 5, status: 'ready', ck: 'blue', chars: [], model: 'standard', sf: null, ef: null, enh: true, snd: true },
      ],
      chars: [],
      selId: 's1',
      editCh: null,
      chForm: { name: '', role: '', avatar: '👨‍💻', ck: 'blue', desc: '' },
    });
  });

  it('saveCh creates a new character when editCh is "new"', () => {
    useEditorStore.setState({
      editCh: 'new',
      chForm: { name: 'Персонаж', role: 'villain', avatar: '🦹', ck: 'purple', desc: 'злодей' },
    });
    useEditorStore.getState().saveCh();
    const chars = useEditorStore.getState().chars;
    expect(chars.length).toBe(1);
    expect(chars[0].name).toBe('Персонаж');
    expect(chars[0].role).toBe('villain');
    expect(chars[0].avatar).toBe('🦹');
    expect(chars[0].ck).toBe('purple');
    expect(chars[0].desc).toBe('злодей');
    expect(chars[0].id).toBeDefined();
    expect(useEditorStore.getState().editCh).toBeNull();
  });

  it('saveCh updates an existing character when editCh is an ID', () => {
    // First create a character
    useEditorStore.setState({
      chars: [{ id: 'c1', name: 'Алиса', role: 'main', avatar: '👩', ck: 'red', desc: '' }],
      editCh: 'c1',
      chForm: { name: 'Алиса обновленная', role: 'main', avatar: '👩', ck: 'green', desc: 'обновлено' },
    });
    useEditorStore.getState().saveCh();
    const chars = useEditorStore.getState().chars;
    expect(chars.length).toBe(1);
    expect(chars[0].id).toBe('c1');
    expect(chars[0].name).toBe('Алиса обновленная');
    expect(chars[0].ck).toBe('green');
    expect(chars[0].desc).toBe('обновлено');
  });

  it('saveCh does nothing when name is empty or whitespace', () => {
    useEditorStore.setState({
      editCh: 'new',
      chForm: { name: '   ', role: 'test', avatar: '👨‍💻', ck: 'blue', desc: '' },
    });
    useEditorStore.getState().saveCh();
    expect(useEditorStore.getState().chars.length).toBe(0);
  });

  it('delCh removes the character', () => {
    useEditorStore.setState({
      chars: [
        { id: 'c1', name: 'Алиса', role: 'main', avatar: '👩', ck: 'red', desc: '' },
        { id: 'c2', name: 'Боб', role: 'hero', avatar: '🧑', ck: 'blue', desc: '' },
      ],
    });
    useEditorStore.getState().delCh('c1');
    const chars = useEditorStore.getState().chars;
    expect(chars.length).toBe(1);
    expect(chars[0].id).toBe('c2');
  });

  it('delCh removes character references from all scenes', () => {
    useEditorStore.setState({
      scenes: [
        { id: 's1', label: 'Сцена 1', prompt: 'p1', duration: 5, status: 'ready', ck: 'blue', chars: ['c1', 'c2'], model: 'standard', sf: null, ef: null, enh: true, snd: true },
        { id: 's2', label: 'Сцена 2', prompt: 'p2', duration: 5, status: 'ready', ck: 'green', chars: ['c1'], model: 'standard', sf: null, ef: null, enh: true, snd: true },
      ],
      chars: [
        { id: 'c1', name: 'Алиса', role: 'main', avatar: '👩', ck: 'red', desc: '' },
        { id: 'c2', name: 'Боб', role: 'hero', avatar: '🧑', ck: 'blue', desc: '' },
      ],
    });
    useEditorStore.getState().delCh('c1');
    const scenes = useEditorStore.getState().scenes;
    expect(scenes[0].chars).toEqual(['c2']);
    expect(scenes[1].chars).toEqual([]);
  });

  it('delCh resets editCh to null', () => {
    useEditorStore.setState({
      chars: [{ id: 'c1', name: 'Алиса', role: 'main', avatar: '👩', ck: 'red', desc: '' }],
      editCh: 'c1',
    });
    useEditorStore.getState().delCh('c1');
    expect(useEditorStore.getState().editCh).toBeNull();
  });
});

describe('useEditorStore – setFormat', () => {
  beforeEach(() => {
    useEditorStore.setState({ format: '16:9' });
  });

  it('changes format to 9:16', () => {
    useEditorStore.getState().setFormat('9:16');
    expect(useEditorStore.getState().format).toBe('9:16');
  });

  it('changes format to 1:1', () => {
    useEditorStore.getState().setFormat('1:1');
    expect(useEditorStore.getState().format).toBe('1:1');
  });

  it('changes format back to 16:9', () => {
    useEditorStore.getState().setFormat('1:1');
    useEditorStore.getState().setFormat('16:9');
    expect(useEditorStore.getState().format).toBe('16:9');
  });
});

describe('useEditorStore – loadProject', () => {
  beforeEach(() => {
    useEditorStore.setState({
      scenes: [],
      chars: [],
      selId: null,
      projectId: null,
    });
  });

  it('loads project scenes into the store', () => {
    useEditorStore.getState().loadProject({
      id: 'proj1',
      scenes: [
        { id: 's1', prompt: 'hello', label: 'Сцена 1', duration: 5, status: 'ready', model: 'standard', videoUrl: null },
        { id: 's2', prompt: 'world', label: 'Сцена 2', duration: 10, status: 'editing', model: 'pro', videoUrl: null },
      ],
    });
    const state = useEditorStore.getState();
    expect(state.projectId).toBe('proj1');
    expect(state.scenes.length).toBe(2);
    expect(state.scenes[0].prompt).toBe('hello');
    expect(state.scenes[1].prompt).toBe('world');
  });

  it('selects the first scene', () => {
    useEditorStore.getState().loadProject({
      id: 'proj1',
      scenes: [
        { id: 's1', prompt: 'hello', duration: 5, status: 'ready', model: 'standard', videoUrl: null },
      ],
    });
    expect(useEditorStore.getState().selId).toBe('s1');
  });

  it('selId is null when project has no scenes', () => {
    useEditorStore.getState().loadProject({
      id: 'proj1',
      scenes: [],
    });
    expect(useEditorStore.getState().selId).toBeNull();
    expect(useEditorStore.getState().scenes.length).toBe(0);
  });

  it('maps null prompt to empty string', () => {
    useEditorStore.getState().loadProject({
      id: 'proj1',
      scenes: [
        { id: 's1', prompt: null, duration: 5, status: 'ready', model: 'standard', videoUrl: null },
      ],
    });
    expect(useEditorStore.getState().scenes[0].prompt).toBe('');
  });

  it('lowercases status', () => {
    useEditorStore.getState().loadProject({
      id: 'proj1',
      scenes: [
        { id: 's1', prompt: 'test', duration: 5, status: 'READY', model: 'standard', videoUrl: null },
      ],
    });
    expect(useEditorStore.getState().scenes[0].status).toBe('ready');
  });

  it('loads characters from project', () => {
    useEditorStore.getState().loadProject({
      id: 'proj1',
      scenes: [],
      characters: [
        { id: 'c1', name: 'Алиса', role: 'main', avatar: '👩', ck: 'red', desc: '' },
      ],
    });
    expect(useEditorStore.getState().chars.length).toBe(1);
    expect(useEditorStore.getState().chars[0].name).toBe('Алиса');
  });

  it('assigns default label when label is missing', () => {
    useEditorStore.getState().loadProject({
      id: 'proj1',
      scenes: [
        { id: 's1', prompt: 'test', duration: 5, status: 'ready', model: 'standard', videoUrl: null },
      ],
    });
    expect(useEditorStore.getState().scenes[0].label).toBe('Сцена 1');
  });

  it('loads metadata fields (ck, sf, ef, enh, snd, chars) from scene metadata', () => {
    useEditorStore.getState().loadProject({
      id: 'proj1',
      scenes: [
        {
          id: 's1',
          prompt: 'test',
          duration: 5,
          status: 'ready',
          model: 'standard',
          videoUrl: null,
          metadata: { ck: 'purple', sf: 'fade', ef: 'zoom', enh: false, snd: false, chars: ['c1'] },
        },
      ],
    });
    const scene = useEditorStore.getState().scenes[0];
    expect(scene.ck).toBe('purple');
    expect(scene.sf).toBe('fade');
    expect(scene.ef).toBe('zoom');
    expect(scene.enh).toBe(false);
    expect(scene.snd).toBe(false);
    expect(scene.chars).toEqual(['c1']);
  });

  it('replaces existing scenes when loading a new project', () => {
    useEditorStore.setState({
      projectId: 'old',
      scenes: [
        { id: 'old1', label: 'Старая', prompt: 'old', duration: 5, status: 'ready', ck: 'blue', chars: [], model: 'standard', sf: null, ef: null, enh: true, snd: true },
      ],
    });
    useEditorStore.getState().loadProject({
      id: 'new-proj',
      scenes: [
        { id: 'new1', prompt: 'new', duration: 3, status: 'editing', model: 'turbo', videoUrl: null },
      ],
    });
    const state = useEditorStore.getState();
    expect(state.projectId).toBe('new-proj');
    expect(state.scenes.length).toBe(1);
    expect(state.scenes[0].id).toBe('new1');
  });
});

describe('useEditorStore – edge cases', () => {
  beforeEach(() => {
    useEditorStore.setState({
      scenes: [
        { id: 's1', label: 'Сцена 1', prompt: 'test', duration: 1, status: 'ready', ck: 'blue', chars: [], model: 'standard', sf: null, ef: null, enh: true, snd: true },
        { id: 's2', label: 'Сцена 2', prompt: 'test2', duration: 5, status: 'ready', ck: 'green', chars: [], model: 'standard', sf: null, ef: null, enh: true, snd: true },
      ],
      selId: 's1',
      chars: [],
    });
  });

  it('splitScene on a 1-second scene does nothing', () => {
    useEditorStore.getState().splitScene('s1');
    const scenes = useEditorStore.getState().scenes;
    expect(scenes.length).toBe(2);
    expect(scenes[0].id).toBe('s1');
    expect(scenes[0].duration).toBe(1);
  });

  it('dupScene with non-existent ID does nothing', () => {
    useEditorStore.getState().dupScene('nonexistent');
    expect(useEditorStore.getState().scenes.length).toBe(2);
  });

  it('splitScene with non-existent ID does nothing', () => {
    useEditorStore.getState().splitScene('nonexistent');
    expect(useEditorStore.getState().scenes.length).toBe(2);
  });

  it('updScene with non-existent ID does not crash or change scenes', () => {
    const before = useEditorStore.getState().scenes;
    useEditorStore.getState().updScene('nonexistent', { label: 'X' });
    const after = useEditorStore.getState().scenes;
    expect(after.length).toBe(before.length);
    expect(after[0].label).toBe('Сцена 1');
    expect(after[1].label).toBe('Сцена 2');
  });

  it('delScene with non-existent ID does not change scenes', () => {
    useEditorStore.getState().delScene('nonexistent');
    expect(useEditorStore.getState().scenes.length).toBe(2);
  });

  it('togChar on non-existent scene does not crash', () => {
    useEditorStore.getState().togChar('nonexistent', 'c1');
    // Scenes should remain unchanged
    expect(useEditorStore.getState().scenes.length).toBe(2);
    expect(useEditorStore.getState().scenes[0].chars).toEqual([]);
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

    vi.advanceTimersByTime(120000);
    expect(useEditorStore.getState().scenes[0].status).toBe('error');
  });

  it('regenScene should not switch to error if status changed before timeout', () => {
    useEditorStore.getState().regenScene('s1');
    // Simulate successful generation before timeout
    useEditorStore.getState().updScene('s1', { status: 'ready' });

    vi.advanceTimersByTime(120000);
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

    vi.advanceTimersByTime(120000);
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
    vi.advanceTimersByTime(120000);
    // The new project's scene should NOT be changed to error
    expect(useEditorStore.getState().scenes[0].status).toBe('ready');
  });

  it('delScene should cancel pending generation timer for that scene', () => {
    useEditorStore.getState().regenScene('s1');
    useEditorStore.getState().delScene('s1');

    vi.advanceTimersByTime(120000);
    // Scene was deleted, no error should be set
    expect(useEditorStore.getState().scenes.length).toBe(0);
  });
});
