import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.tubeforge.app',
  appName: 'TubeForge',
  webDir: 'out',
  server: {
    // In production, load from the deployed Vercel URL
    url: 'https://tubeforge.co',
    cleartext: false,
  },
  ios: {
    contentInset: 'automatic',
    preferredContentMode: 'mobile',
    scheme: 'TubeForge',
    backgroundColor: '#0a0a0a',
  },
  plugins: {
    SplashScreen: {
      launchShowDuration: 2000,
      launchAutoHide: true,
      backgroundColor: '#0a0a0a',
      showSpinner: false,
      androidScaleType: 'CENTER_CROP',
      splashFullScreen: true,
      splashImmersive: true,
    },
    StatusBar: {
      style: 'DARK',
      backgroundColor: '#0a0a0a',
    },
    Keyboard: {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      resize: 'body' as any,
      resizeOnFullScreen: true,
    },
  },
};

export default config;
