import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { uid } from '@/lib/utils';

/* ── Types ─────────────────────────────────────────────────── */

export type ContentStatus = 'Idea' | 'Draft' | 'Scheduled' | 'Published';
export type ContentType = 'Video' | 'Short' | 'Post' | 'Story' | 'Reel';
export type Platform = 'YouTube' | 'TikTok' | 'Instagram' | 'Twitter' | 'Facebook';

export interface ContentItem {
  id: string;
  title: string;
  description: string;
  script: string;
  platforms: Platform[];
  contentType: ContentType;
  scheduledDate: string | null; // ISO string
  status: ContentStatus;
  tags: string[];
  notes: string;
  thumbnailColor: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface IdeaItem {
  id: string;
  text: string;
  category: string;
  priority: 1 | 2 | 3;
  createdAt: string;
}

export interface ContentTemplate {
  id: string;
  name: string;
  category: 'Tutorial' | 'Vlog' | 'Review' | 'Shorts' | 'Challenge' | 'Collab';
  titlePattern: string;
  descriptionTemplate: string;
  hashtags: string[];
  optimalTime: string; // e.g. "14:00"
  contentType: ContentType;
}

export type SortOption = 'date-asc' | 'date-desc' | 'title-asc' | 'title-desc' | 'status';
export type FilterStatus = ContentStatus | 'All';
export type FilterType = ContentType | 'All';

/* ── Default templates ─────────────────────────────────────── */

const DEFAULT_TEMPLATES: ContentTemplate[] = [
  {
    id: 'tpl_tutorial',
    name: 'Step-by-Step Tutorial',
    category: 'Tutorial',
    titlePattern: 'How to [TOPIC] in [YEAR] - Complete Guide',
    descriptionTemplate:
      'In this tutorial, I\'ll show you exactly how to [TOPIC] step by step.\n\nTimestamps:\n00:00 - Intro\n01:00 - What you\'ll need\n02:00 - Step 1\n05:00 - Step 2\n08:00 - Final result\n\nResources mentioned:\n- [Link 1]\n- [Link 2]\n\nIf this helped, hit subscribe for more tutorials!',
    hashtags: ['#tutorial', '#howto', '#learnwithme', '#stepbystep', '#guide'],
    optimalTime: '14:00',
    contentType: 'Video',
  },
  {
    id: 'tpl_vlog',
    name: 'Daily Vlog',
    category: 'Vlog',
    titlePattern: 'A Day in My Life as a [ROLE] | [LOCATION] Vlog',
    descriptionTemplate:
      'Come along with me for a day in my life! Today we\'re [ACTIVITY].\n\nFollow me on socials:\nInstagram: @handle\nTwitter: @handle\nTikTok: @handle\n\nCamera gear:\n- [Camera]\n- [Lens]\n\nMusic by [Artist] - [Song Name]',
    hashtags: ['#vlog', '#dayinmylife', '#dailyvlog', '#lifestyle', '#vlogger'],
    optimalTime: '17:00',
    contentType: 'Video',
  },
  {
    id: 'tpl_review',
    name: 'Product Review',
    category: 'Review',
    titlePattern: '[PRODUCT] Review - Worth It After [TIME]?',
    descriptionTemplate:
      'I\'ve been using [PRODUCT] for [TIME] and here\'s my honest review.\n\nPros:\n- [Pro 1]\n- [Pro 2]\n- [Pro 3]\n\nCons:\n- [Con 1]\n- [Con 2]\n\nVerdict: [Rating]/10\n\nBuy it here (affiliate): [LINK]\n\nDisclosure: This video contains affiliate links.',
    hashtags: ['#review', '#techreview', '#honest', '#productreview', '#unboxing'],
    optimalTime: '12:00',
    contentType: 'Video',
  },
  {
    id: 'tpl_shorts',
    name: 'Quick Tip Short',
    category: 'Shorts',
    titlePattern: '[TOPIC] hack you NEED to know! #shorts',
    descriptionTemplate: '[TOPIC] tip in under 60 seconds!\n\nFull video: [LINK]\n\n#shorts #tips #hack',
    hashtags: ['#shorts', '#tips', '#hack', '#viral', '#trending', '#quicktip'],
    optimalTime: '11:00',
    contentType: 'Short',
  },
  {
    id: 'tpl_challenge',
    name: 'Challenge Video',
    category: 'Challenge',
    titlePattern: 'I Tried [CHALLENGE] for [DURATION] - Here\'s What Happened',
    descriptionTemplate:
      'I challenged myself to [CHALLENGE] for [DURATION] and the results were [ADJECTIVE].\n\nDay 1: [Summary]\nDay 7: [Summary]\nDay 30: [Summary]\n\nWould I recommend it? Watch to find out!\n\nSubscribe and turn on notifications for more challenges!',
    hashtags: ['#challenge', '#experiment', '#transformation', '#results', '#motivation'],
    optimalTime: '16:00',
    contentType: 'Video',
  },
  {
    id: 'tpl_collab',
    name: 'Collaboration',
    category: 'Collab',
    titlePattern: '[TOPIC] with @[CREATOR] | [SUBTITLE]',
    descriptionTemplate:
      'Teaming up with @[CREATOR] for this one!\n\nCheck out their channel: [LINK]\nTheir video: [LINK]\n\nWe [ACTIVITY] and it was [ADJECTIVE].\n\nSubscribe to both channels for more collabs!',
    hashtags: ['#collab', '#collaboration', '#creators', '#youtube', '#together'],
    optimalTime: '15:00',
    contentType: 'Video',
  },
];

/* ── Store ─────────────────────────────────────────────────── */

export interface ContentPlannerState {
  contentItems: ContentItem[];
  ideas: IdeaItem[];
  templates: ContentTemplate[];

  /* Filters */
  filterStatus: FilterStatus;
  filterType: FilterType;
  sortOption: SortOption;

  /* CRUD - content items */
  addContentItem: (item: Omit<ContentItem, 'id' | 'createdAt' | 'updatedAt'>) => string;
  updateContentItem: (id: string, updates: Partial<ContentItem>) => void;
  deleteContentItem: (id: string) => void;
  moveContentItem: (id: string, newDate: string) => void;

  /* CRUD - ideas */
  addIdea: (text: string, category?: string, priority?: 1 | 2 | 3) => string;
  updateIdea: (id: string, updates: Partial<IdeaItem>) => void;
  deleteIdea: (id: string) => void;
  promoteIdea: (id: string) => string;

  /* Filters */
  setFilterStatus: (s: FilterStatus) => void;
  setFilterType: (t: FilterType) => void;
  setSortOption: (o: SortOption) => void;

  /* Helpers */
  getItemsForDate: (dateStr: string) => ContentItem[];
  getFilteredItems: () => ContentItem[];
}

function nowISO() {
  return new Date().toISOString();
}

export const useContentPlannerStore = create<ContentPlannerState>()(
  persist(
    (set, get) => ({
      contentItems: [],
      ideas: [],
      templates: DEFAULT_TEMPLATES,

      filterStatus: 'All',
      filterType: 'All',
      sortOption: 'date-desc',

      /* ── Content Items ──────────────────────────────── */

      addContentItem: (item) => {
        const id = uid();
        const now = nowISO();
        const newItem: ContentItem = {
          ...item,
          id,
          createdAt: now,
          updatedAt: now,
        };
        set((s) => ({ contentItems: [...s.contentItems, newItem] }));
        return id;
      },

      updateContentItem: (id, updates) => {
        set((s) => ({
          contentItems: s.contentItems.map((item) =>
            item.id === id
              ? { ...item, ...updates, updatedAt: nowISO() }
              : item,
          ),
        }));
      },

      deleteContentItem: (id) => {
        set((s) => ({
          contentItems: s.contentItems.filter((item) => item.id !== id),
        }));
      },

      moveContentItem: (id, newDate) => {
        set((s) => ({
          contentItems: s.contentItems.map((item) =>
            item.id === id
              ? { ...item, scheduledDate: newDate, updatedAt: nowISO() }
              : item,
          ),
        }));
      },

      /* ── Ideas ──────────────────────────────────────── */

      addIdea: (text, category = 'General', priority = 2) => {
        const id = uid();
        const newIdea: IdeaItem = {
          id,
          text,
          category,
          priority,
          createdAt: nowISO(),
        };
        set((s) => ({ ideas: [newIdea, ...s.ideas] }));
        return id;
      },

      updateIdea: (id, updates) => {
        set((s) => ({
          ideas: s.ideas.map((idea) =>
            idea.id === id ? { ...idea, ...updates } : idea,
          ),
        }));
      },

      deleteIdea: (id) => {
        set((s) => ({ ideas: s.ideas.filter((idea) => idea.id !== id) }));
      },

      promoteIdea: (id) => {
        const state = get();
        const idea = state.ideas.find((i) => i.id === id);
        if (!idea) return '';
        const contentId = state.addContentItem({
          title: idea.text,
          description: '',
          script: '',
          platforms: [],
          contentType: 'Video',
          scheduledDate: null,
          status: 'Draft',
          tags: idea.category !== 'General' ? [idea.category] : [],
          notes: '',
          thumbnailColor: null,
        });
        state.deleteIdea(id);
        return contentId;
      },

      /* ── Filters ────────────────────────────────────── */

      setFilterStatus: (s) => set({ filterStatus: s }),
      setFilterType: (t) => set({ filterType: t }),
      setSortOption: (o) => set({ sortOption: o }),

      /* ── Helpers ────────────────────────────────────── */

      getItemsForDate: (dateStr) => {
        return get().contentItems.filter((item) => {
          if (!item.scheduledDate) return false;
          return item.scheduledDate.slice(0, 10) === dateStr;
        });
      },

      getFilteredItems: () => {
        const { contentItems, filterStatus, filterType, sortOption } = get();
        let filtered = [...contentItems];

        if (filterStatus !== 'All') {
          filtered = filtered.filter((item) => item.status === filterStatus);
        }
        if (filterType !== 'All') {
          filtered = filtered.filter((item) => item.contentType === filterType);
        }

        switch (sortOption) {
          case 'date-asc':
            filtered.sort((a, b) => (a.scheduledDate ?? '').localeCompare(b.scheduledDate ?? ''));
            break;
          case 'date-desc':
            filtered.sort((a, b) => (b.scheduledDate ?? '').localeCompare(a.scheduledDate ?? ''));
            break;
          case 'title-asc':
            filtered.sort((a, b) => a.title.localeCompare(b.title));
            break;
          case 'title-desc':
            filtered.sort((a, b) => b.title.localeCompare(a.title));
            break;
          case 'status': {
            const order: Record<ContentStatus, number> = { Idea: 0, Draft: 1, Scheduled: 2, Published: 3 };
            filtered.sort((a, b) => order[a.status] - order[b.status]);
            break;
          }
        }

        return filtered;
      },
    }),
    {
      name: 'tf-content-planner',
      partialize: (state) => ({
        contentItems: state.contentItems,
        ideas: state.ideas,
        filterStatus: state.filterStatus,
        filterType: state.filterType,
        sortOption: state.sortOption,
      }),
    },
  ),
);
