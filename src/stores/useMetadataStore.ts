import { create } from 'zustand';

export type YouTubeCategory =
  | '' | 'Entertainment' | 'Education' | 'Science & Technology'
  | 'Gaming' | 'Music' | 'Sports' | 'News & Politics'
  | 'Howto & Style' | 'People & Blogs' | 'Comedy'
  | 'Film & Animation' | 'Autos & Vehicles' | 'Travel & Events'
  | 'Pets & Animals' | 'Nonprofits & Activism';

interface AISuggestions {
  titles: string[];
  descriptions: string[];
  tags: string[];
}

interface MetadataState {
  projectId: string | null;
  title: string;
  desc: string;
  tags: string[];
  category: YouTubeCategory;
  saveStatus: 'idle' | 'saving' | 'saved' | 'error';
  aiSuggestions: AISuggestions;
  setProjectId: (id: string | null) => void;
  setTitle: (t: string) => void;
  setDesc: (d: string) => void;
  addTag: (tag: string) => void;
  removeTag: (tag: string) => void;
  setCategory: (c: YouTubeCategory) => void;
  setSaveStatus: (s: 'idle' | 'saving' | 'saved' | 'error') => void;
  setAISuggestions: (s: Partial<AISuggestions>) => void;
  clearAISuggestions: () => void;
  loadFromProject: (project: { id: string; title: string; description?: string | null; tags?: string[] | null }) => void;
  reset: () => void;
}

const emptyAI: AISuggestions = { titles: [], descriptions: [], tags: [] };

export const useMetadataStore = create<MetadataState>((set) => ({
  projectId: null,
  title: '',
  desc: '',
  tags: [],
  category: '',
  saveStatus: 'idle',
  aiSuggestions: { ...emptyAI },
  setProjectId: (id) => set({ projectId: id }),
  setTitle: (t) => set({ title: t }),
  setDesc: (d) => set({ desc: d }),
  addTag: (tag) => set((s) => s.tags.includes(tag) ? s : { tags: [...s.tags, tag] }),
  removeTag: (tag) => set((s) => ({ tags: s.tags.filter((t) => t !== tag) })),
  setCategory: (c) => set({ category: c }),
  setSaveStatus: (s) => set({ saveStatus: s }),
  setAISuggestions: (s) => set((st) => ({ aiSuggestions: { ...st.aiSuggestions, ...s } })),
  clearAISuggestions: () => set({ aiSuggestions: { ...emptyAI } }),
  loadFromProject: (project) => set({
    projectId: project.id,
    title: project.title || '',
    desc: project.description || '',
    tags: project.tags || [],
    saveStatus: 'idle',
    aiSuggestions: { ...emptyAI },
  }),
  reset: () => set({
    projectId: null,
    title: '',
    desc: '',
    tags: [],
    category: '',
    saveStatus: 'idle',
    aiSuggestions: { ...emptyAI },
  }),
}));
