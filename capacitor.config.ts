import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.electrotransport.app',
  appName: 'ElectroTransport',
  webDir: 'public',
  server: {
    url: 'https://electrotransport.vercel.app',
    androidScheme: 'https'
  },
  plugins: {
    SplashScreen: {
      launchShowDuration: 2000,
      backgroundColor: '#059669',
      showSpinner: false,
    },
  },
};

export default config;
