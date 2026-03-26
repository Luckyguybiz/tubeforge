'use client';
import { useEffect, useRef } from 'react';
import { trpc } from '@/lib/trpc';
import { useNotificationStore } from '@/stores/useNotificationStore';
import type { Notification } from '@/stores/useNotificationStore';

/**
 * Syncs notifications between server (Prisma) and client (Zustand store).
 * Call once in a top-level component (e.g. TopBar).
 */
export function useNotificationSync() {
  const synced = useRef(false);
  const setNotifications = useNotificationStore((s) => s.setNotifications);

  const { data } = trpc.notification.list.useQuery(undefined, {
    staleTime: 30_000,
    refetchInterval: 60_000,
  });

  useEffect(() => {
    if (!data?.items) return;
    const mapped: Notification[] = data.items.map((n) => ({
      ...n,
      type: n.type as Notification['type'],
    }));
    setNotifications(mapped);
    synced.current = true;
  }, [data, setNotifications]);

  return data;
}
