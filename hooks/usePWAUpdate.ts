import { useCallback, useEffect, useRef, useState } from 'react';
import { useRegisterSW } from 'virtual:pwa-register/react';

const CHECK_INTERVAL_MS = 3 * 60 * 1000; // Check every 3 minutes while open
const MIN_CHECK_COOLDOWN_MS = 10 * 1000; // Debounce rapid focus/visibility switches

export type UpdateCheckResult = 'update-available' | 'up-to-date' | 'error';

export function usePWAUpdate() {
  const [hasVersionMismatch, setHasVersionMismatch] = useState(false);
  const [isUpdating, setIsUpdating] = useState(false);
  const [isChecking, setIsChecking] = useState(false);
  const [dismissed, setDismissed] = useState(false);

  const registrationRef = useRef<ServiceWorkerRegistration | null>(null);
  const lastCheckAtRef = useRef<number>(0);
  const reloadingRef = useRef<boolean>(false);
  const userTriggeredReloadRef = useRef<boolean>(false);

  const {
    needRefresh: [needRefresh, setNeedRefresh],
    updateServiceWorker,
  } = useRegisterSW({
    onRegisteredSW(_swUrl, registration) {
      if (registration) {
        registrationRef.current = registration;
      }
    },
    onNeedRefresh() {
      setDismissed(false);
    },
  });

  const currentBuildVersion =
    typeof __APP_BUILD_VERSION__ !== 'undefined' ? __APP_BUILD_VERSION__ : '';

  const checkServerVersion = useCallback(async (): Promise<boolean> => {
    if (!currentBuildVersion || import.meta.env.DEV) {
      return false;
    }

    try {
      const response = await fetch(`/version.json?t=${Date.now()}`, {
        cache: 'no-store',
        headers: {
          'Cache-Control': 'no-cache, no-store, must-revalidate',
          Pragma: 'no-cache',
        },
      });
      if (!response.ok) return false;

      const data = (await response.json()) as { version?: string };
      if (data?.version && data.version !== currentBuildVersion) {
        setHasVersionMismatch(true);
        setDismissed(false);
        return true;
      }
      return false;
    } catch {
      return false;
    }
  }, [currentBuildVersion]);

  const checkForUpdates = useCallback(
    async (force = false): Promise<UpdateCheckResult> => {
      if (typeof window === 'undefined' || !navigator.onLine) {
        return 'error';
      }

      const now = Date.now();
      if (!force && now - lastCheckAtRef.current < MIN_CHECK_COOLDOWN_MS) {
        return needRefresh || hasVersionMismatch ? 'update-available' : 'up-to-date';
      }
      lastCheckAtRef.current = now;
      setIsChecking(true);

      try {
        const tasks: Promise<unknown>[] = [checkServerVersion()];
        if (registrationRef.current) {
          tasks.push(registrationRef.current.update().catch(() => undefined));
        } else if ('serviceWorker' in navigator) {
          tasks.push(
            navigator.serviceWorker
              .getRegistration()
              .then((reg) => {
                if (reg) {
                  registrationRef.current = reg;
                  return reg.update();
                }
                return undefined;
              })
              .catch(() => undefined)
          );
        }

        const [mismatchFound] = await Promise.all(tasks);
        const hasUpdate = Boolean(mismatchFound) || needRefresh || hasVersionMismatch;
        return hasUpdate ? 'update-available' : 'up-to-date';
      } catch {
        return 'error';
      } finally {
        setIsChecking(false);
      }
    },
    [checkServerVersion, hasVersionMismatch, needRefresh]
  );

  // Check immediately on mount, on app foreground return, on network reconnect, and periodically
  useEffect(() => {
    checkForUpdates(true);

    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible') {
        checkForUpdates(false);
      }
    };

    const handleFocus = () => {
      checkForUpdates(false);
    };

    const handleOnline = () => {
      checkForUpdates(true);
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    window.addEventListener('focus', handleFocus);
    window.addEventListener('online', handleOnline);

    const intervalId = window.setInterval(() => {
      if (document.visibilityState === 'visible') {
        checkForUpdates(true);
      }
    }, CHECK_INTERVAL_MS);

    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      window.removeEventListener('focus', handleFocus);
      window.removeEventListener('online', handleOnline);
      window.clearInterval(intervalId);
    };
  }, [checkForUpdates]);

  // Reload cleanly when a new Service Worker takes control after user-requested update
  useEffect(() => {
    if (typeof navigator === 'undefined' || !('serviceWorker' in navigator)) return;

    const handleControllerChange = () => {
      if (!userTriggeredReloadRef.current || reloadingRef.current) return;
      reloadingRef.current = true;
      window.location.reload();
    };

    navigator.serviceWorker.addEventListener('controllerchange', handleControllerChange);
    return () => {
      navigator.serviceWorker.removeEventListener('controllerchange', handleControllerChange);
    };
  }, []);

  const applyUpdate = useCallback(async () => {
    if (isUpdating || reloadingRef.current) return;
    setIsUpdating(true);
    userTriggeredReloadRef.current = true;

    try {
      // Force SW to check first so any waiting worker activates
      if (registrationRef.current) {
        await registrationRef.current.update().catch(() => undefined);
      }

      if (needRefresh) {
        await updateServiceWorker(true);
        // Fallback reload in case iOS standalone WebKit doesn't fire controllerchange quickly
        window.setTimeout(() => {
          if (!reloadingRef.current) {
            reloadingRef.current = true;
            window.location.reload();
          }
        }, 1200);
        return;
      }

      // If version.json mismatch occurred before SW swapped, purge stale CacheStorage and reload
      if ('caches' in window) {
        const cacheNames = await caches.keys();
        await Promise.all(cacheNames.map((name) => caches.delete(name)));
      }

      if (registrationRef.current?.waiting) {
        registrationRef.current.waiting.postMessage({ type: 'SKIP_WAITING' });
      }

      reloadingRef.current = true;
      window.location.reload();
    } catch {
      reloadingRef.current = true;
      window.location.reload();
    }
  }, [isUpdating, needRefresh, updateServiceWorker]);

  const dismissUpdate = useCallback(() => {
    setDismissed(true);
    setNeedRefresh(false);
  }, [setNeedRefresh]);

  const hasUpdate = needRefresh || hasVersionMismatch;

  return {
    hasUpdate,
    showBanner: hasUpdate && !dismissed,
    isUpdating,
    isChecking,
    buildVersion: currentBuildVersion,
    applyUpdate,
    dismissUpdate,
    checkForUpdates,
  };
}
