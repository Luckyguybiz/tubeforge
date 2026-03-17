import { create } from 'zustand';
import { uid } from '@/lib/utils';

export type ToastType = 'success' | 'error' | 'info' | 'warning';

interface Toast {
  id: string;
  type: ToastType;
  message: string;
  duration: number;
}

interface NotificationState {
  toasts: Toast[];
  addToast: (type: ToastType, message: string, duration?: number) => void;
  removeToast: (id: string) => void;
}

export const useNotificationStore = create<NotificationState>((set) => ({
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
}));

export const toast = {
  success: (msg: string) => useNotificationStore.getState().addToast('success', msg),
  error: (msg: string) => useNotificationStore.getState().addToast('error', msg),
  info: (msg: string) => useNotificationStore.getState().addToast('info', msg),
  warning: (msg: string) => useNotificationStore.getState().addToast('warning', msg),
};
