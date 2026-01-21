import { useEffect } from 'react';
import { useRegisterSW } from 'virtual:pwa-register/react';
import { toast } from '@/hooks/use-toast';

export function PWAUpdater() {
  const {
    needRefresh: [needRefresh, setNeedRefresh],
    updateServiceWorker,
  } = useRegisterSW({
    onRegistered(r) {
      console.log('SW Registered:', r);
      // Aggressive polling for updates (every 30 seconds)
      if (r) {
        setInterval(() => {
          console.log('Checking for updates...');
          r.update();
        }, 30 * 1000);
      }
    },
    onRegisterError(error) {
      console.error('SW registration error', error);
    },
  });

  useEffect(() => {
    if (needRefresh) {
      console.log('New content available, reloading...');
      toast({
        title: "Updating App...",
        description: "A new version is available. Refreshing now to apply changes.",
        duration: 5000,
      });

      // Give the user a moment to see the toast, then reload
      const timer = setTimeout(() => {
        updateServiceWorker(true);
      }, 2000);

      return () => clearTimeout(timer);
    }
  }, [needRefresh, updateServiceWorker]);

  return null; // This component doesn't render anything UI-wise except via toast
}
