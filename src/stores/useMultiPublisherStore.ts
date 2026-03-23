import { create } from 'zustand';
import { persist } from 'zustand/middleware';

/* ── Types ─────────────────────────────────────────────────── */

export type PublishPlatform = 'YouTube' | 'TikTok' | 'Instagram';

export type PublishStatus = 'draft' | 'scheduled' | 'publishing' | 'published' | 'failed';

export interface PlatformAdaptation {
  platform: PublishPlatform;
  title: string;
  description: string;
  tags: string[];
}

export interface PublishItem {
  id: string;
  videoFile: File | null;
  videoName: string;
  videoDuration: number;
  videoSize: number;
  title: string;
  description: string;
  tags: string[];
  platforms: PublishPlatform[];
  adaptations: PlatformAdaptation[];
  scheduledDate: string | null; // ISO
  status: PublishStatus;
  createdAt: string;
  updatedAt: string;
  error?: string;
}

export interface ScheduledItem {
  id: string;
  title: string;
  platforms: PublishPlatform[];
  scheduledDate: string;
  status: PublishStatus;
  createdAt: string;
}

type Tab = 'publish' | 'planner';

interface MultiPublisherState {
  tab: Tab;
  setTab: (tab: Tab) => void;

  // Publish form
  videoFile: File | null;
  videoName: string;
  title: string;
  description: string;
  tags: string[];
  tagInput: string;
  platforms: PublishPlatform[];
  scheduledDate: string | null;

  setVideoFile: (file: File | null, name?: string) => void;
  setTitle: (v: string) => void;
  setDescription: (v: string) => void;
  setTagInput: (v: string) => void;
  addTag: (tag: string) => void;
  removeTag: (tag: string) => void;
  togglePlatform: (p: PublishPlatform) => void;
  setScheduledDate: (d: string | null) => void;
  resetForm: () => void;

  // Planner
  scheduled: ScheduledItem[];
  addScheduled: (item: ScheduledItem) => void;
  removeScheduled: (id: string) => void;
  updateScheduledStatus: (id: string, status: PublishStatus) => void;

  // Calendar
  calendarMonth: number; // 0-11
  calendarYear: number;
  setCalendarMonth: (m: number) => void;
  setCalendarYear: (y: number) => void;
}

const now = new Date();

export const useMultiPublisherStore = create<MultiPublisherState>()(
  persist(
    (set) => ({
      tab: 'publish',
      setTab: (tab) => set({ tab }),

      videoFile: null,
      videoName: '',
      title: '',
      description: '',
      tags: [],
      tagInput: '',
      platforms: ['YouTube'],
      scheduledDate: null,

      setVideoFile: (file, name) =>
        set({ videoFile: file, videoName: name ?? file?.name ?? '' }),
      setTitle: (title) => set({ title }),
      setDescription: (description) => set({ description }),
      setTagInput: (tagInput) => set({ tagInput }),
      addTag: (tag) =>
        set((s) => {
          const t = tag.trim();
          if (!t || s.tags.includes(t)) return s;
          return { tags: [...s.tags, t], tagInput: '' };
        }),
      removeTag: (tag) =>
        set((s) => ({ tags: s.tags.filter((t) => t !== tag) })),
      togglePlatform: (p) =>
        set((s) => ({
          platforms: s.platforms.includes(p)
            ? s.platforms.filter((x) => x !== p)
            : [...s.platforms, p],
        })),
      setScheduledDate: (scheduledDate) => set({ scheduledDate }),
      resetForm: () =>
        set({
          videoFile: null,
          videoName: '',
          title: '',
          description: '',
          tags: [],
          tagInput: '',
          platforms: ['YouTube'],
          scheduledDate: null,
        }),

      scheduled: [],
      addScheduled: (item) =>
        set((s) => ({ scheduled: [...s.scheduled, item] })),
      removeScheduled: (id) =>
        set((s) => ({ scheduled: s.scheduled.filter((x) => x.id !== id) })),
      updateScheduledStatus: (id, status) =>
        set((s) => ({
          scheduled: s.scheduled.map((x) =>
            x.id === id ? { ...x, status } : x,
          ),
        })),

      calendarMonth: now.getMonth(),
      calendarYear: now.getFullYear(),
      setCalendarMonth: (calendarMonth) => set({ calendarMonth }),
      setCalendarYear: (calendarYear) => set({ calendarYear }),
    }),
    {
      name: 'tf-multi-publisher',
      partialize: (s) => ({
        tab: s.tab,
        scheduled: s.scheduled,
        calendarMonth: s.calendarMonth,
        calendarYear: s.calendarYear,
      }),
    },
  ),
);
