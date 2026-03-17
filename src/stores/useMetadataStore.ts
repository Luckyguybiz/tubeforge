import { create } from 'zustand';

interface MetadataState {
  projectId: string | null;
  title: string;
  desc: string;
  tags: string[];
  saveStatus: 'idle' | 'saving' | 'saved' | 'error';
  setProjectId: (id: string | null) => void;
  setTitle: (t: string) => void;
  setDesc: (d: string) => void;
  addTag: (tag: string) => void;
  removeTag: (tag: string) => void;
  setSaveStatus: (s: 'idle' | 'saving' | 'saved' | 'error') => void;
  loadFromProject: (project: { id: string; title: string; description?: string | null; tags?: string[] | null }) => void;
  reset: () => void;
}

export const useMetadataStore = create<MetadataState>((set) => ({
  projectId: null,
  title: '',
  desc: '',
  tags: [],
  saveStatus: 'idle',
  setProjectId: (id) => set({ projectId: id }),
  setTitle: (t) => set({ title: t }),
  setDesc: (d) => set({ desc: d }),
  addTag: (tag) => set((s) => s.tags.includes(tag) ? s : { tags: [...s.tags, tag] }),
  removeTag: (tag) => set((s) => ({ tags: s.tags.filter((t) => t !== tag) })),
  setSaveStatus: (s) => set({ saveStatus: s }),
  loadFromProject: (project) => set({
    projectId: project.id,
    title: project.title || '',
    desc: project.description || '',
    tags: project.tags || [],
    saveStatus: 'idle',
  }),
  reset: () => set({
    projectId: null,
    title: '',
    desc: '',
    tags: [],
    saveStatus: 'idle',
  }),
}));
