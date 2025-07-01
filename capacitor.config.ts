import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'app.lovable.adb12d6e2ce64ba8bed5ca9f7fdf994b',
  appName: 'chiguard-ride-safe',
  webDir: 'dist',
  server: {
    url: 'https://adb12d6e-2ce6-4ba8-bed5-ca9f7fdf994b.lovableproject.com?forceHideBadge=true',
    cleartext: true
  },
  plugins: {
    SplashScreen: {
      launchShowDuration: 2000,
      backgroundColor: '#ffffff',
      androidScaleType: 'CENTER_CROP',
      splashFullScreen: true,
      splashImmersive: true
    }
  }
};

export default config;