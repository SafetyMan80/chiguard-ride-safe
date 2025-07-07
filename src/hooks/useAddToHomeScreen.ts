import { useState, useEffect } from 'react';
import { useAnalytics } from './useAnalytics';

interface BeforeInstallPromptEvent extends Event {
  prompt(): Promise<void>;
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>;
}

export const useAddToHomeScreen = () => {
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [isInstallable, setIsInstallable] = useState(false);
  const { trackPWAInstall } = useAnalytics();
  const [isInstalled, setIsInstalled] = useState(false);

  useEffect(() => {
    // Check if already installed
    const isStandalone = window.matchMedia('(display-mode: standalone)').matches;
    const isInWebAppiOS = (window.navigator as any).standalone === true;
    setIsInstalled(isStandalone || isInWebAppiOS);

    // Show button on mobile devices even without beforeinstallprompt
    const isMobile = /Android|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
    const isPWACapable = 'serviceWorker' in navigator && 'PushManager' in window;
    
    // Set installable if mobile or PWA-capable and not already installed
    if ((isMobile || isPWACapable) && !isStandalone && !isInWebAppiOS) {
      setIsInstallable(true);
    }

    const handleBeforeInstallPrompt = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e as BeforeInstallPromptEvent);
      setIsInstallable(true);
    };

    const handleAppInstalled = () => {
      setIsInstalled(true);
      setIsInstallable(false);
      setDeferredPrompt(null);
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    window.addEventListener('appinstalled', handleAppInstalled);

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
      window.removeEventListener('appinstalled', handleAppInstalled);
    };
  }, []);

  const promptInstall = async () => {
    console.log('Install button clicked, deferredPrompt:', !!deferredPrompt);
    
    if (deferredPrompt) {
      // Native install prompt available
      try {
        deferredPrompt.prompt();
        const { outcome } = await deferredPrompt.userChoice;
        console.log('Install prompt outcome:', outcome);
        
        if (outcome === 'accepted') {
          trackPWAInstall();
          setDeferredPrompt(null);
          setIsInstallable(false);
        }
      } catch (error) {
        console.error('Error with install prompt:', error);
      }
    } else {
      // Fallback: Show instructions for manual installation
      const isIOS = /iPad|iPhone|iPod/.test(navigator.userAgent);
      const isAndroid = /Android/.test(navigator.userAgent);
      
      let instructions = '';
      if (isIOS) {
        instructions = 'To install this app on your iOS device:\n\n1. Tap the Share button ⬆️ (box with arrow up) in Safari\n2. Scroll down and tap "Add to Home Screen"\n3. Tap "Add" to confirm';
      } else if (isAndroid) {
        instructions = 'To install this app:\n\n1. Tap the menu (⋮) in your browser\n2. Select "Add to Home Screen" or "Install App"\n3. Tap "Add" or "Install" to confirm';
      } else {
        instructions = 'To install this app, look for an install button in your browser\'s address bar or menu.';
      }
      
      alert(instructions);
    }
  };

  return {
    isInstallable: isInstallable && !isInstalled,
    isInstalled,
    promptInstall
  };
};