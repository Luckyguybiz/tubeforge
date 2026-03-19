'use client';

// Capacitor native bridge — provides access to native iOS features
// when the app runs inside the Capacitor shell

import { Capacitor } from '@capacitor/core';

export const isNative = Capacitor.isNativePlatform();
export const isIOS = Capacitor.getPlatform() === 'ios';
export const isWeb = Capacitor.getPlatform() === 'web';

// Haptic feedback
export async function hapticLight() {
  if (!isNative) return;
  const { Haptics, ImpactStyle } = await import('@capacitor/haptics');
  await Haptics.impact({ style: ImpactStyle.Light });
}

export async function hapticMedium() {
  if (!isNative) return;
  const { Haptics, ImpactStyle } = await import('@capacitor/haptics');
  await Haptics.impact({ style: ImpactStyle.Medium });
}

export async function hapticSuccess() {
  if (!isNative) return;
  const { Haptics, NotificationType } = await import('@capacitor/haptics');
  await Haptics.notification({ type: NotificationType.Success });
}

// Status bar
export async function setStatusBarDark() {
  if (!isNative) return;
  const { StatusBar, Style } = await import('@capacitor/status-bar');
  await StatusBar.setStyle({ style: Style.Dark });
}

// Keyboard
export async function hideKeyboard() {
  if (!isNative) return;
  const { Keyboard } = await import('@capacitor/keyboard');
  await Keyboard.hide();
}

// Open external URLs in system browser
export async function openExternal(url: string) {
  if (!isNative) {
    window.open(url, '_blank');
    return;
  }
  const { Browser } = await import('@capacitor/browser');
  await Browser.open({ url });
}

// App lifecycle
export async function onAppStateChange(callback: (isActive: boolean) => void) {
  if (!isNative) return () => {};
  const { App } = await import('@capacitor/app');
  const listener = await App.addListener('appStateChange', ({ isActive }) => {
    callback(isActive);
  });
  return () => listener.remove();
}

// Back button handler (iOS swipe back)
export async function onBackButton(callback: () => void) {
  if (!isNative) return () => {};
  const { App } = await import('@capacitor/app');
  const listener = await App.addListener('backButton', () => {
    callback();
  });
  return () => listener.remove();
}
