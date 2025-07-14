import { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'app.lovable.adb12d6e2ce64ba8bed5ca9f7fdf994b',
  appName: 'RailSafe',
  webDir: 'dist',
  server: {
    url: 'https://adb12d6e-2ce6-4ba8-bed5-ca9f7fdf994b.lovableproject.com?forceHideBadge=true',
    cleartext: true
  },
  plugins: {
    PushNotifications: {
      presentationOptions: ['badge', 'sound', 'alert']
    },
    LocalNotifications: {
      smallIcon: 'ic_stat_icon_config_sample',
      iconColor: '#488AFF',
      sound: 'beep.wav'
    }
  }
};

export default config;