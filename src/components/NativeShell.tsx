'use client';

import { useEffect } from 'react';
import { isNative, setStatusBarDark, onAppStateChange } from '@/lib/capacitor';

/**
 * NativeShell — initializes native iOS features when running in Capacitor.
 * Add this component to the root layout.
 */
export function NativeShell({ children }: { children: React.ReactNode }) {
  useEffect(() => {
    if (!isNative) return;

    // Set dark status bar
    setStatusBarDark();

    // Handle app state changes (background/foreground)
    let cleanup: (() => void) | undefined;
    onAppStateChange((isActive) => {
      if (isActive) {
        // App came to foreground — refresh auth state, etc.
        document.dispatchEvent(new CustomEvent('app:resume'));
      }
    }).then(fn => { cleanup = fn; });

    // Add safe area CSS variables for iOS notch
    document.documentElement.style.setProperty(
      '--safe-area-top',
      'env(safe-area-inset-top, 0px)'
    );
    document.documentElement.style.setProperty(
      '--safe-area-bottom',
      'env(safe-area-inset-bottom, 0px)'
    );

    // Prevent overscroll bounce on iOS
    document.body.style.overscrollBehavior = 'none';

    return () => {
      cleanup?.();
    };
  }, []);

  return <>{children}</>;
}
