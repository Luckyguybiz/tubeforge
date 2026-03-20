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

  const disable = useCallback(() => {
    try {
      localStorage.setItem(LS_KEY, '0');
    } catch { /* noop */ }
    setStatus('off');
  }, []);

  const isSupported = status !== 'unsupported';
  const isEnabled = status === 'granted';
  const isDenied = status === 'denied';

  return { status, isSupported, isEnabled, isDenied, enable, disable };
}
