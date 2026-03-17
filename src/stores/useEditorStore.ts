import { create } from 'zustand';
import { PK, GENERATION_TIMEOUT_MS } from '@/lib/constants';
import { uid } from '@/lib/utils';
import type { Scene, Character } from '@/lib/types';

/** Track generation timeouts by scene ID so they can be cancelled */
const genTimers = new Map<string, ReturnType<typeof setTimeout>>();
/** Track generation versions to prevent stale timeout callbacks */
const genVersions = new Map<string, number>();

function clearGenTimer(sceneId: string) {
  const t = genTimers.get(sceneId);
  if (t) {
    clearTimeout(t);
    genTimers.delete(sceneId);
  }
}

function clearAllGenTimers() {
  genTimers.forEach(clearTimeout);
  genTimers.clear();
}

interface ProjectData {
  id: string;
  scenes: Array<{
    id: string;
    prompt: string | null;
    label?: string;
    duration: number;
    status: string;
    model: string;
    videoUrl: string | null;
    metadata?: unknown;
  }>;
  characters?: unknown;
}

interface EditorState {
  projectId: string | null;
  format: string;
  scenes: Scene[];
  chars: Character[];
  selId: string | null;
  rpanel: string;
  editCh: string | null;
  chForm: Omit<Character, 'id'>;
  genIn: string;
  chPick: boolean;
  modPick: boolean;
  dragId: string | null;
  dragOv: string | null;
  confirmDel: string | null;
  saveStatus: 'idle' | 'saving' | 'saved' | 'error';
  history: Scene[][];
  future: Scene[][];

  loadProject: (project: ProjectData) => void;
  setFormat: (f: string) => void;
  setSelId: (id: string | null) => void;
  setRpanel: (p: string) => void;
  setEditCh: (id: string | null) => void;
  setChForm: (form: Omit<Character, 'id'> | ((prev: Omit<Character, 'id'>) => Omit<Character, 'id'>)) => void;
  setGenIn: (v: string) => void;
  setChPick: (v: boolean) => void;
  setModPick: (v: boolean) => void;
  setDragId: (id: string | null) => void;
  setDragOv: (id: string | null) => void;
  setConfirmDel: (id: string | null) => void;
  setSaveStatus: (s: 'idle' | 'saving' | 'saved' | 'error') => void;

  pushHistory: () => void;
  undo: () => void;
  redo: () => void;

  updScene: (id: string, patch: Partial<Scene>) => void;
  addScene: (afterId?: string) => Scene;
  delScene: (id: string) => void;
  dupScene: (id: string) => void;
  splitScene: (id: string) => void;
  regenScene: (id: string, newPrompt?: string) => void;
  togChar: (sceneId: string, charId: string) => void;
  saveCh: () => void;
  delCh: (id: string) => void;
  reorderScenes: (fromId: string, toId: string) => void;
  addSceneFromPrompt: (prompt: string) => void;
}

export const useEditorStore = create<EditorState>((set, get) => ({
  projectId: null,
  format: '16:9',
  scenes: [],
  chars: [],
  selId: null,
  rpanel: 'scene',
  editCh: null,
  chForm: { name: '', role: '', avatar: '\u{1F468}\u200D\u{1F4BB}', ck: 'blue', desc: '' },
  genIn: '',
  chPick: false,
  modPick: false,
  dragId: null,
  dragOv: null,
  confirmDel: null,
  saveStatus: 'idle',
  history: [],
  future: [],

  loadProject: (project) => {
    clearAllGenTimers();
    const scenes: Scene[] = project.scenes.map((s, i) => {
      const meta = (s.metadata ?? {}) as Record<string, unknown>;
      return {
        id: s.id,
        prompt: s.prompt ?? '',
        label: s.label || `\u0421\u0446\u0435\u043D\u0430 ${i + 1}`,
        duration: s.duration,
        status: s.status.toLowerCase(),
        model: s.model || 'standard',
        ck: (meta.ck as string) || PK[i % PK.length],
        sf: (meta.sf as string | null) ?? null,
        ef: (meta.ef as string | null) ?? null,
        enh: (meta.enh as boolean) ?? true,
        snd: (meta.snd as boolean) ?? true,
        chars: (meta.chars as string[]) ?? [],
        taskId: (s as Record<string, unknown>).taskId as string | null | undefined,
        videoUrl: s.videoUrl,
      };
    });
    const chars = (project.characters ?? []) as Character[];
    set({
      projectId: project.id,
      scenes,
      chars,
      selId: scenes[0]?.id ?? null,
    });
  },

  setFormat: (f) => set({ format: f }),
  setSelId: (id) => set({ selId: id }),
  setRpanel: (p) => set({ rpanel: p }),
  setEditCh: (id) => set({ editCh: id }),
  setChForm: (form) =>
    set((s) => ({
      chForm: typeof form === 'function' ? form(s.chForm) : form,
    })),
  setGenIn: (v) => set({ genIn: v }),
  setChPick: (v) => set({ chPick: v }),
  setModPick: (v) => set({ modPick: v }),
  setDragId: (id) => set({ dragId: id }),
  setDragOv: (id) => set({ dragOv: id }),
  setConfirmDel: (id) => set({ confirmDel: id }),
  setSaveStatus: (s) => set({ saveStatus: s }),

  pushHistory: () => {
    const { scenes, history } = get();
    const snap: Scene[] = JSON.parse(JSON.stringify(scenes));
    set({ history: [...history.slice(-49), snap], future: [] });
  },

  undo: () => {
    const { history, scenes, future, selId } = get();
    if (history.length === 0) return;
    const prev = history[history.length - 1];
    set({
      history: history.slice(0, -1),
      future: [...future, JSON.parse(JSON.stringify(scenes))],
      scenes: prev,
      selId: prev.find((s) => s.id === selId)?.id ?? prev[0]?.id ?? null,
    });
  },

  redo: () => {
    const { history, scenes, future, selId } = get();
    if (future.length === 0) return;
    const next = future[future.length - 1];
    set({
      future: future.slice(0, -1),
      history: [...history, JSON.parse(JSON.stringify(scenes))],
      scenes: next,
      selId: next.find((s) => s.id === selId)?.id ?? next[0]?.id ?? null,
    });
  },

  updScene: (id, patch) => {
    if (patch.duration !== undefined) {
      patch = { ...patch, duration: Math.max(1, Math.min(30, patch.duration)) };
    }
    set((s) => ({
      scenes: s.scenes.map((sc) => (sc.id === id ? { ...sc, ...patch } : sc)),
    }));
  },

  addScene: (afterId) => {
    get().pushHistory();
    const s = get();
    const ns: Scene = {
      id: uid(),
      label: `\u0421\u0446\u0435\u043D\u0430 ${s.scenes.length + 1}`,
      prompt: '',
      duration: 5,
      status: 'empty',
      ck: PK[s.scenes.length % PK.length],
      chars: [],
      model: 'standard',
      sf: null,
      ef: null,
      enh: true,
      snd: true,
    };
    set((st) => {
      if (!afterId) return { scenes: [...st.scenes, ns], selId: ns.id };
      const i = st.scenes.findIndex((sc) => sc.id === afterId);
      const n = [...st.scenes];
      n.splice(i + 1, 0, ns);
      return { scenes: n, selId: ns.id };
    });
    return ns;
  },

  delScene: (id) => {
    get().pushHistory();
    clearGenTimer(id);
    set((s) => {
      const i = s.scenes.findIndex((sc) => sc.id === id);
      const n = s.scenes.filter((sc) => sc.id !== id);
      return {
        scenes: n,
        selId: s.selId === id ? (n[Math.min(i, n.length - 1)]?.id ?? null) : s.selId,
      };
    });
  },

  dupScene: (id) => {
    get().pushHistory();
    set((s) => {
      const i = s.scenes.findIndex((sc) => sc.id === id);
      if (i === -1) return s;
      const c = { ...s.scenes[i], id: uid(), label: s.scenes[i].label + ' (\u043A\u043E\u043F\u0438\u044F)', status: 'editing' };
      const n = [...s.scenes];
      n.splice(i + 1, 0, c);
      return { scenes: n };
    });
  },

  splitScene: (id) => {
    get().pushHistory();
    set((s) => {
      const i = s.scenes.findIndex((sc) => sc.id === id);
      if (i === -1) return s;
      const sc = s.scenes[i];
      if (sc.duration < 2) return s;
      const h = Math.ceil(sc.duration / 2);
      const a: Scene = { ...sc, id: uid(), label: sc.label + ' \u2014 A', duration: h };
      const b: Scene = { ...sc, id: uid(), label: sc.label + ' \u2014 B', duration: sc.duration - h, prompt: '', status: 'editing', sf: null, ef: null };
      const n = [...s.scenes];
      n.splice(i, 1, a, b);
      return { scenes: n };
    });
  },

  regenScene: (id, newPrompt) => {
    const patch: Partial<Scene> = { status: 'generating' };
    if (newPrompt) patch.prompt = newPrompt;
    get().updScene(id, patch);
    // Cancel any existing timeout for this scene before setting a new one
    clearGenTimer(id);
    const version = (genVersions.get(id) ?? 0) + 1;
    genVersions.set(id, version);
    const timer = setTimeout(() => {
      genTimers.delete(id);
      // Only set error if version still matches (no newer regen started)
      if (genVersions.get(id) !== version) return;
      const current = get().scenes.find((sc) => sc.id === id);
      if (current?.status === 'generating') {
        get().updScene(id, { status: 'error' });
      }
    }, GENERATION_TIMEOUT_MS);
    genTimers.set(id, timer);
  },

  togChar: (sceneId, charId) =>
    set((s) => ({
      scenes: s.scenes.map((sc) =>
        sc.id !== sceneId ? sc : {
          ...sc,
          chars: sc.chars.includes(charId) ? sc.chars.filter((c) => c !== charId) : [...sc.chars, charId],
        }
      ),
    })),

  saveCh: () => {
    const s = get();
    if (!s.chForm.name.trim()) return;
    if (s.editCh === 'new') {
      set((st) => ({ chars: [...st.chars, { id: uid(), ...st.chForm }], editCh: null }));
    } else {
      set((st) => ({
        chars: st.chars.map((c) => (c.id === st.editCh ? { ...c, ...st.chForm } : c)),
        editCh: null,
      }));
    }
  },

  delCh: (cid) =>
    set((s) => ({
      chars: s.chars.filter((c) => c.id !== cid),
      scenes: s.scenes.map((sc) => ({ ...sc, chars: sc.chars.filter((c) => c !== cid) })),
      editCh: null,
    })),

  reorderScenes: (fromId, toId) => {
    get().pushHistory();
    set((s) => {
      const n = [...s.scenes];
      const fi = n.findIndex((sc) => sc.id === fromId);
      const ti = n.findIndex((sc) => sc.id === toId);
      const [m] = n.splice(fi, 1);
      n.splice(ti, 0, m);
      return { scenes: n };
    });
  },

  addSceneFromPrompt: (prompt) => {
    const s = get();
    const ns: Scene = {
      id: uid(),
      label: `\u0421\u0446\u0435\u043D\u0430 ${s.scenes.length + 1}`,
      prompt,
      duration: 5,
      status: 'generating',
      ck: PK[s.scenes.length % PK.length],
      chars: [],
      model: 'standard',
      sf: null,
      ef: null,
      enh: true,
      snd: true,
    };
    set((st) => ({ scenes: [...st.scenes, ns], selId: ns.id, genIn: '' }));
    // Track timeout so it can be cancelled on project load or re-generation
    clearGenTimer(ns.id);
    const timer = setTimeout(() => {
      genTimers.delete(ns.id);
      const current = get().scenes.find((sc) => sc.id === ns.id);
      if (current?.status === 'generating') {
        get().updScene(ns.id, { status: 'error' });
      }
    }, GENERATION_TIMEOUT_MS);
    genTimers.set(ns.id, timer);
  },
}));
