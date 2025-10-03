'use client';

import * as React from 'react';
import { Download, X, Smartphone, Monitor } from 'lucide-react';

import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';

interface BeforeInstallPromptEvent extends Event {
  readonly platforms: string[];
  readonly userChoice: Promise<{
    outcome: 'accepted' | 'dismissed';
    platform: string;
  }>;
  prompt(): Promise<void>;
}

declare global {
  interface WindowEventMap {
    beforeinstallprompt: BeforeInstallPromptEvent;
  }
}

export function PWAInstaller() {
  const [deferredPrompt, setDeferredPrompt] = React.useState<BeforeInstallPromptEvent | null>(null);
  const [showInstallPrompt, setShowInstallPrompt] = React.useState(false);
  const [isIOS, setIsIOS] = React.useState(false);
  const [isStandalone, setIsStandalone] = React.useState(false);
  const [showIOSInstructions, setShowIOSInstructions] = React.useState(false);
  const [isRecentlyDismissed, setIsRecentlyDismissed] = React.useState(false);
  const [showUpdatePrompt, setShowUpdatePrompt] = React.useState(false);
  const [waitingWorker, setWaitingWorker] = React.useState<ServiceWorker | null>(null);

  React.useEffect(() => {
    // Check if it's iOS
    const iOS = /iPad|iPhone|iPod/.test(navigator.userAgent);
    setIsIOS(iOS);

    // Check if already installed (running in standalone mode)
    const standalone =
      window.matchMedia('(display-mode: standalone)').matches ||
      (window.navigator as any).standalone === true;

    setIsStandalone(standalone);

    // Check if recently dismissed
    const dismissedTime = localStorage.getItem('pwa-install-dismissed');
    if (dismissedTime && Date.now() - parseInt(dismissedTime) < 7 * 24 * 60 * 60 * 1000) {
      setIsRecentlyDismissed(true);
    }

    // Handle the beforeinstallprompt event
    const handleBeforeInstallPrompt = (e: BeforeInstallPromptEvent) => {
      e.preventDefault();
      setDeferredPrompt(e);

      // Show the install prompt after a short delay
      setTimeout(() => {
        setShowInstallPrompt(true);
      }, 3000);
    };

    // Handle app installed event
    const handleAppInstalled = () => {
      console.log('PWA was installed');
      setShowInstallPrompt(false);
      setDeferredPrompt(null);
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    window.addEventListener('appinstalled', handleAppInstalled);

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
      window.removeEventListener('appinstalled', handleAppInstalled);
    };
  }, []);

  React.useEffect(() => {
    // Register service worker
    if ('serviceWorker' in navigator) {
      navigator.serviceWorker
        .register('/sw.js')
        .then((registration) => {
          console.log('Service Worker registered successfully:', registration.scope);

          // Listen for updates
          registration.addEventListener('updatefound', () => {
            const newWorker = registration.installing;
            if (newWorker) {
              newWorker.addEventListener('statechange', () => {
                if (newWorker.state === 'installed' && navigator.serviceWorker.controller) {
                  // New update available - show prompt to user
                  console.log('New version available! Prompting user to update...');
                  setWaitingWorker(newWorker);
                  setShowUpdatePrompt(true);
                }
              });
            }
          });

          // Check for waiting service worker on page load
          if (registration.waiting) {
            setWaitingWorker(registration.waiting);
            setShowUpdatePrompt(true);
          }
        })
        .catch((error) => {
          console.log('Service Worker registration failed:', error);
        });

      // Listen for controller change (when SW is activated)
      navigator.serviceWorker.addEventListener('controllerchange', () => {
        console.log('New service worker activated, reloading page...');
        window.location.reload();
      });
    }
  }, []);

  const handleInstallClick = async () => {
    if (!deferredPrompt) {
      if (isIOS) {
        setShowIOSInstructions(true);
        return;
      }
      return;
    }

    try {
      await deferredPrompt.prompt();
      const { outcome } = await deferredPrompt.userChoice;

      if (outcome === 'accepted') {
        console.log('User accepted the install prompt');
      } else {
        console.log('User dismissed the install prompt');
      }

      setDeferredPrompt(null);
      setShowInstallPrompt(false);
    } catch (error) {
      console.error('Error during installation:', error);
    }
  };

  const dismissPrompt = () => {
    setShowInstallPrompt(false);
    if (typeof window !== 'undefined') {
      localStorage.setItem('pwa-install-dismissed', Date.now().toString());
    }
  };

  const dismissIOSInstructions = () => {
    setShowIOSInstructions(false);
  };

  const handleUpdate = () => {
    if (waitingWorker) {
      // Tell the waiting service worker to skip waiting and activate immediately
      waitingWorker.postMessage({ type: 'SKIP_WAITING' });
      setShowUpdatePrompt(false);
    }
  };

  const dismissUpdatePrompt = () => {
    setShowUpdatePrompt(false);
    // Show again after 1 hour
    setTimeout(() => {
      if (waitingWorker) {
        setShowUpdatePrompt(true);
      }
    }, 60 * 60 * 1000);
  };

  // Update prompt takes priority over install prompt
  if (showUpdatePrompt) {
    return (
      <div className="fixed bottom-4 left-4 right-4 z-50 flex justify-center">
        <Card className="w-full max-w-sm animate-in slide-in-from-bottom duration-300 border-primary shadow-lg">
          <CardContent className="p-4">
            <div className="flex items-start space-x-3">
              <div className="flex-shrink-0">
                <div className="w-10 h-10 rounded-lg bg-primary flex items-center justify-center animate-pulse">
                  <Download className="h-5 w-5 text-primary-foreground" />
                </div>
              </div>

              <div className="flex-1 min-w-0">
                <div className="flex items-start justify-between">
                  <div>
                    <h3 className="font-semibold text-sm">Update Available</h3>
                    <p className="text-xs text-muted-foreground mt-1">
                      A new version of GrabtoGo is ready to install
                    </p>
                  </div>
                  <Button variant="ghost" size="sm" onClick={dismissUpdatePrompt}>
                    <X className="h-3 w-3" />
                  </Button>
                </div>

                <div className="flex items-center space-x-2 mt-3">
                  <Badge variant="secondary" className="text-xs bg-green-100 text-green-700">
                    New Features
                  </Badge>
                  <Badge variant="secondary" className="text-xs bg-blue-100 text-blue-700">
                    Bug Fixes
                  </Badge>
                </div>
              </div>
            </div>

            <div className="flex gap-2 mt-3">
              <Button onClick={dismissUpdatePrompt} variant="outline" className="flex-1" size="sm">
                Later
              </Button>
              <Button onClick={handleUpdate} className="flex-1" size="sm">
                <Download className="h-4 w-4 mr-2" />
                Update Now
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Don't show if already installed or dismissed recently
  if (isStandalone || isRecentlyDismissed) {
    return null;
  }

  // iOS installation instructions
  if (showIOSInstructions) {
    return (
      <div className="fixed inset-0 bg-black/50 flex items-end justify-center z-50 p-4">
        <Card className="w-full max-w-sm animate-in slide-in-from-bottom duration-300">
          <CardContent className="p-6">
            <div className="flex items-start justify-between mb-4">
              <div>
                <h3 className="font-semibold">Install GrabtoGo</h3>
                <p className="text-sm text-muted-foreground mt-1">
                  Add to your home screen for the best experience
                </p>
              </div>
              <Button variant="ghost" size="sm" onClick={dismissIOSInstructions}>
                <X className="h-4 w-4" />
              </Button>
            </div>

            <div className="space-y-3 text-sm">
              <div className="flex items-center space-x-3">
                <div className="w-6 h-6 rounded-full bg-primary text-primary-foreground flex items-center justify-center text-xs font-bold">
                  1
                </div>
                <span>Tap the Share button in Safari</span>
              </div>
              <div className="flex items-center space-x-3">
                <div className="w-6 h-6 rounded-full bg-primary text-primary-foreground flex items-center justify-center text-xs font-bold">
                  2
                </div>
                <span>Scroll down and tap "Add to Home Screen"</span>
              </div>
              <div className="flex items-center space-x-3">
                <div className="w-6 h-6 rounded-full bg-primary text-primary-foreground flex items-center justify-center text-xs font-bold">
                  3
                </div>
                <span>Tap &quot;Add&quot; to install the app</span>
              </div>
            </div>

            <Button onClick={dismissIOSInstructions} className="w-full mt-4">
              Got it!
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Main install prompt
  if ((showInstallPrompt && deferredPrompt) || isIOS) {
    return (
      <div className="fixed bottom-4 left-4 right-4 z-50 flex justify-center">
        <Card className="w-full max-w-sm animate-in slide-in-from-bottom duration-300">
          <CardContent className="p-4">
            <div className="flex items-start space-x-3">
              <div className="flex-shrink-0">
                <div className="w-10 h-10 rounded-lg bg-primary flex items-center justify-center">
                  {isIOS ? (
                    <Smartphone className="h-5 w-5 text-primary-foreground" />
                  ) : (
                    <Monitor className="h-5 w-5 text-primary-foreground" />
                  )}
                </div>
              </div>

              <div className="flex-1 min-w-0">
                <div className="flex items-start justify-between">
                  <div>
                    <h3 className="font-semibold text-sm">Install GrabtoGo</h3>
                    <p className="text-xs text-muted-foreground mt-1">
                      Get the full app experience with offline access
                    </p>
                  </div>
                  <Button variant="ghost" size="sm" onClick={dismissPrompt}>
                    <X className="h-3 w-3" />
                  </Button>
                </div>

                <div className="flex items-center space-x-2 mt-3">
                  <Badge variant="secondary" className="text-xs">
                    <Download className="h-3 w-3 mr-1" />
                    Free
                  </Badge>
                  <Badge variant="secondary" className="text-xs">
                    Offline Ready
                  </Badge>
                </div>
              </div>
            </div>

            <Button onClick={handleInstallClick} className="w-full mt-3" size="sm">
              <Download className="h-4 w-4 mr-2" />
              {isIOS ? 'Install Instructions' : 'Install App'}
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return null;
}

// Hook to check PWA installation status
export function usePWAInstallation() {
  const [isInstallable, setIsInstallable] = React.useState(false);
  const [isInstalled, setIsInstalled] = React.useState(false);

  React.useEffect(() => {
    // Check if already installed
    const standalone =
      window.matchMedia('(display-mode: standalone)').matches ||
      (window.navigator as any).standalone === true;
    setIsInstalled(standalone);

    // Check if installable
    const handleBeforeInstallPrompt = () => {
      setIsInstallable(true);
    };

    const handleAppInstalled = () => {
      setIsInstalled(true);
      setIsInstallable(false);
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    window.addEventListener('appinstalled', handleAppInstalled);

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
      window.removeEventListener('appinstalled', handleAppInstalled);
    };
  }, []);

  return { isInstallable, isInstalled };
}
