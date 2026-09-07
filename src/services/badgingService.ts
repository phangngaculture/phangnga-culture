/**
 * Badging Service for iOS (16.4+) & Android Progressive Web Apps
 * Allows displaying unread counts / task counts directly on the home screen app icon.
 */

// Register Service Worker for PWA support and Web Push / Badging lifecycle
export async function registerServiceWorker(): Promise<ServiceWorkerRegistration | null> {
  if (typeof window === 'undefined' || !('serviceWorker' in navigator)) {
    return null;
  }

  try {
    const registration = await navigator.serviceWorker.register('/sw.js', { scope: '/' });
    return registration;
  } catch (err) {
    console.warn('Service Worker registration failed:', err);
    return null;
  }
}

/**
 * Check if the browser / platform supports App Badging
 */
export function isBadgingSupported(): boolean {
  return typeof navigator !== 'undefined' && ('setAppBadge' in navigator || 'clearAppBadge' in navigator);
}

/**
 * Get current system notification permission state
 */
export function getNotificationPermission(): NotificationPermission | 'unsupported' {
  if (typeof window === 'undefined' || !('Notification' in window)) {
    return 'unsupported';
  }
  return Notification.permission;
}

/**
 * Request notification permission from the user.
 * On iOS 16.4+, notification permission is required to enable app icon badging and push alerts.
 */
export async function requestNotificationPermission(): Promise<NotificationPermission | 'unsupported'> {
  if (typeof window === 'undefined' || !('Notification' in window)) {
    return 'unsupported';
  }

  try {
    const permission = await Notification.requestPermission();
    return permission;
  } catch (err) {
    console.warn('Error requesting notification permission:', err);
    return 'denied';
  }
}

/**
 * Update the badge number on the home screen icon
 * @param count Number of unread items or pending actions
 */
export async function updateAppBadge(count: number): Promise<boolean> {
  if (typeof navigator === 'undefined') return false;

  const validCount = Math.max(0, Math.floor(count));

  // 1. Direct Navigator Badging API (iOS 16.4+ standalone PWA, Chrome/Edge on Android and Desktop)
  if ('setAppBadge' in navigator && typeof (navigator as any).setAppBadge === 'function') {
    try {
      if (validCount > 0) {
        await (navigator as any).setAppBadge(validCount);
      } else {
        await (navigator as any).clearAppBadge();
      }
    } catch (e) {
      console.warn('Failed to set app badge directly:', e);
    }
  }

  // 2. Relay to Service Worker if active
  if ('serviceWorker' in navigator && navigator.serviceWorker.controller) {
    try {
      navigator.serviceWorker.controller.postMessage({
        type: validCount > 0 ? 'SET_BADGE' : 'CLEAR_BADGE',
        count: validCount
      });
    } catch (e) {
      // Ignore worker message errors
    }
  }

  return true;
}

/**
 * Clear the badge from the app icon
 */
export async function clearAppBadge(): Promise<boolean> {
  return updateAppBadge(0);
}
