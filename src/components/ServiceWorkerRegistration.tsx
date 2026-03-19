'use client';

import { useEffect, useState, useCallback } from 'react';

export function ServiceWorkerRegistration() {
  const [waitingWorker, setWaitingWorker] = useState<ServiceWorker | null>(null);
  const [showUpdateBanner, setShowUpdateBanner] = useState(false);

  const onUpdate = useCallback((registration: ServiceWorkerRegistration) => {
    setWaitingWorker(registration.waiting);
    setShowUpdateBanner(true);
  }, []);

  const applyUpdate = useCallback(() => {
    if (waitingWorker) {
      waitingWorker.postMessage({ type: 'SKIP_WAITING' });
    }
    setShowUpdateBanner(false);
    // Reload once the new SW has taken over
    window.location.reload();
  }, [waitingWorker]);

  useEffect(() => {
    if (typeof window === 'undefined' || !('serviceWorker' in navigator)) return;

    const register = async () => {
      try {
        const registration = await navigator.serviceWorker.register('/sw.js', {
          scope: '/',
        });

        // If there's already a waiting worker on first load
        if (registration.waiting) {
          onUpdate(registration);
          return;
        }

        // Listen for new installing workers
        registration.addEventListener('updatefound', () => {
          const newWorker = registration.installing;
          if (!newWorker) return;

          newWorker.addEventListener('statechange', () => {
            // When the new worker is installed and waiting, notify the user
            if (newWorker.state === 'installed' && navigator.serviceWorker.controller) {
              onUpdate(registration);
            }
          });
        });

        // Check for updates periodically (every 60 minutes)
        const intervalId = setInterval(() => {
          registration.update();
        }, 60 * 60 * 1000);

        return () => clearInterval(intervalId);
      } catch (err) {
        console.error('[SW] Registration failed:', err);
      }
    };

    register();
  }, [onUpdate]);

  if (!showUpdateBanner) return null;

  return (
    <div
      role="alert"
      style={{
        position: 'fixed',
        bottom: '1rem',
        left: '50%',
        transform: 'translateX(-50%)',
        zIndex: 9999,
        background: '#18181b',
        border: '1px solid #27272a',
        borderRadius: '0.75rem',
        padding: '0.875rem 1.25rem',
        display: 'flex',
        alignItems: 'center',
        gap: '0.75rem',
        boxShadow: '0 8px 30px rgba(0,0,0,0.4)',
        maxWidth: '420px',
        width: 'calc(100% - 2rem)',
      }}
    >
      <span style={{ fontSize: '0.875rem', color: '#d4d4d8', flex: 1 }}>
        A new version of TubeForge is available.
      </span>
      <button
        onClick={applyUpdate}
        style={{
          background: '#7c3aed',
          color: '#fff',
          border: 'none',
          borderRadius: '0.375rem',
          padding: '0.5rem 1rem',
          fontSize: '0.8125rem',
          fontWeight: 600,
          cursor: 'pointer',
          whiteSpace: 'nowrap',
          flexShrink: 0,
        }}
      >
        Update
      </button>
      <button
        onClick={() => setShowUpdateBanner(false)}
        aria-label="Dismiss"
        style={{
          background: 'transparent',
          border: 'none',
          color: '#71717a',
          cursor: 'pointer',
          fontSize: '1.25rem',
          lineHeight: 1,
          padding: '0.25rem',
          flexShrink: 0,
        }}
      >
        &times;
      </button>
    </div>
  );
}
