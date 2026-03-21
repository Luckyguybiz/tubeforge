import { create } from 'zustand';
import { uid } from '@/lib/utils';

export type ToastType = 'success' | 'error' | 'info' | 'warning';

interface Toast {
  id: string;
  type: ToastType;
  message: string;
  duration: number;
}

export interface Notification {
  id: string;
  type: 'success' | 'error' | 'info' | 'warning';
  title: string;
  message: string;
  read: boolean;
  createdAt: number;
}

interface NotificationState {
  toasts: Toast[];
  addToast: (type: ToastType, message: string, duration?: number) => void;
  removeToast: (id: string) => void;

  notifications: Notification[];
  addNotification: (type: Notification['type'], title: string, message: string) => void;
  markRead: (id: string) => void;
  markAsRead: (id: string) => void;
  markAllRead: () => void;
  markAllAsRead: () => void;
  clearNotifications: () => void;
  clearAll: () => void;
  unreadCount: () => number;

  showShortcuts: boolean;
  setShowShortcuts: (v: boolean) => void;
}

export const useNotificationStore = create<NotificationState>((set, get) => ({
  toasts: [],

  addToast: (type, message, duration = 4000) => {
    const id = uid();
    set((s) => {
      // Cap at 5 visible toasts — drop oldest when exceeded
      const next = [...s.toasts, { id, type, message, duration }];
      return { toasts: next.length > 5 ? next.slice(-5) : next };
    });
    setTimeout(() => {
      set((s) => ({ toasts: s.toasts.filter((t) => t.id !== id) }));
    }, duration);
  },

  removeToast: (id) => {
    set((s) => ({ toasts: s.toasts.filter((t) => t.id !== id) }));
  },

  /* ── Persistent notifications ────────────────────── */

  notifications: [],

  addNotification: (type, title, message) => {
    const n: Notification = { id: uid(), type, title, message, read: false, createdAt: Date.now() };
    set((s) => {
      const next = [n, ...s.notifications];
      // Keep max 50 notifications
      return { notifications: next.length > 50 ? next.slice(0, 50) : next };
    });
  },

  markRead: (id) => {
    set((s) => ({
      notifications: s.notifications.map((n) => (n.id === id ? { ...n, read: true } : n)),
    }));
  },

  markAsRead: (id) => {
    set((s) => ({
      notifications: s.notifications.map((n) => (n.id === id ? { ...n, read: true } : n)),
    }));
  },

  markAllRead: () => {
    set((s) => ({
      notifications: s.notifications.map((n) => (n.read ? n : { ...n, read: true })),
    }));
  },

  markAllAsRead: () => {
    set((s) => ({
      notifications: s.notifications.map((n) => (n.read ? n : { ...n, read: true })),
    }));
  },

  clearNotifications: () => {
    set({ notifications: [] });
  },

  clearAll: () => {
    set({ notifications: [] });
  },

  unreadCount: () => get().notifications.filter((n) => !n.read).length,

  /* ── Shortcuts modal flag ────────────────────────── */

  showShortcuts: false,
  setShowShortcuts: (v) => set({ showShortcuts: v }),
}));

/** Default auto-dismiss durations per toast type (ms) */
const TOAST_DURATION: Record<ToastType, number> = {
  success: 5000,
  info: 5000,
  error: 8000,
  warning: 8000,
};

export const toast = {
  success: (msg: string) => useNotificationStore.getState().addToast('success', msg, TOAST_DURATION.success),
  error: (msg: string) => useNotificationStore.getState().addToast('error', msg, TOAST_DURATION.error),
  info: (msg: string) => useNotificationStore.getState().addToast('info', msg, TOAST_DURATION.info),
  warning: (msg: string) => useNotificationStore.getState().addToast('warning', msg, TOAST_DURATION.warning),
};
