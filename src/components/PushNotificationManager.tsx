'use client';

import { useEffect, useState, useCallback } from 'react';

const LS_KEY = 'tf-push-enabled';

type PushStatus = 'unsupported' | 'denied' | 'granted' | 'prompt' | 'off';

function getStatus(): PushStatus {
  if (typeof window === 'undefined' || !('Notification' in window) || !('PushManager' in window)) {
    return 'unsupported';
  }
  const perm = Notification.permission;
  if (perm === 'denied') return 'denied';
  if (perm === 'granted') {
    try {
      return localStorage.getItem(LS_KEY) === '1' ? 'granted' : 'off';
    } catch {
      return 'off';
    }
  }
  return 'prompt';
}

async function subscribeToPush(): Promise<PushSubscription | null> {
  const vapidKey = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY;
  if (!vapidKey) return null;

  const reg = await navigator.serviceWorker.ready;
  const existing = await reg.pushManager.getSubscription();
  if (existing) return existing;

  return reg.pushManager.subscribe({
    userVisibleOnly: true,
    applicationServerKey: urlBase64ToUint8Array(vapidKey).buffer as ArrayBuffer,
  });
}

function urlBase64ToUint8Array(base64String: string): Uint8Array {
  const padding = '='.repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding).replace(/-/g, '+').replace(/_/g, '/');
  const rawData = atob(base64);
  const outputArray = new Uint8Array(rawData.length);
  for (let i = 0; i < rawData.length; ++i) {
    outputArray[i] = rawData.charCodeAt(i);
  }
  return outputArray;
}

async function sendSubscriptionToServer(sub: PushSubscription) {
  const json = sub.toJSON();
  await fetch('/api/push', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      endpoint: json.endpoint,
      keys: json.keys,
    }),
  });
}

async function removeSubscriptionFromServer(sub: PushSubscription) {
  await fetch('/api/push', {
    method: 'DELETE',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ endpoint: sub.endpoint }),
  });
}

export function usePushNotifications() {
  const [status, setStatus] = useState<PushStatus>('prompt');

  useEffect(() => {
    setStatus(getStatus());
  }, []);

  const enable = useCallback(async (): Promise<boolean> => {
    if (typeof window === 'undefined' || !('Notification' in window)) return false;

    try {
      const permission = await Notification.requestPermission();
      if (permission === 'granted') {
        const sub = await subscribeToPush();
        if (sub) {
          await sendSubscriptionToServer(sub);
        }
        localStorage.setItem(LS_KEY, '1');
        setStatus('granted');
        return true;
      }
      if (permission === 'denied') {
        setStatus('denied');
      }
      return false;
    } catch {
      return false;
    }
  }, []);

  const disable = useCallback(async () => {
    try {
      const reg = await navigator.serviceWorker.ready;
      const sub = await reg.pushManager.getSubscription();
      if (sub) {
        await removeSubscriptionFromServer(sub);
        await sub.unsubscribe();
      }
      localStorage.setItem(LS_KEY, '0');
    } catch { /* noop */ }
    setStatus('off');
  }, []);

  const isSupported = status !== 'unsupported';
  const isEnabled = status === 'granted';
  const isDenied = status === 'denied';

  return { status, isSupported, isEnabled, isDenied, enable, disable };
}
