/**
 * Toast Utilities - Prevent duplicate toast notifications
 * 
 * This utility helps prevent toast spam by tracking shown toasts
 * and preventing duplicates within a time window.
 */

import toast from 'react-hot-toast';

// Track shown toasts to prevent duplicates
const shownToasts = new Map<string, number>();
const TOAST_COOLDOWN_MS = 2000; // 2 seconds cooldown between same toast

/**
 * Show a toast notification with duplicate prevention
 * @param message - The toast message
 * @param type - Toast type (success, error, info, loading)
 * @param options - Additional toast options
 * @returns Toast ID or null if duplicate was prevented
 */
export const showToast = (
  message: string,
  type: 'success' | 'error' | 'info' | 'loading' = 'info',
  options?: {
    duration?: number;
    id?: string;
  }
): string | null => {
  // Create a unique key for this toast
  const toastKey = options?.id || `${type}-${message}`;
  const now = Date.now();
  
  // Check if this toast was shown recently
  const lastShown = shownToasts.get(toastKey);
  if (lastShown && (now - lastShown) < TOAST_COOLDOWN_MS) {
    // Duplicate toast within cooldown period - ignore
    return null;
  }
  
  // Mark as shown
  shownToasts.set(toastKey, now);
  
  // Clean up old entries (older than 10 seconds)
  const tenSecondsAgo = now - 10000;
  for (const [key, timestamp] of shownToasts.entries()) {
    if (timestamp < tenSecondsAgo) {
      shownToasts.delete(key);
    }
  }
  
  // Show toast
  switch (type) {
    case 'success':
      return toast.success(message, { duration: options?.duration || 3000, id: options?.id });
    case 'error':
      return toast.error(message, { duration: options?.duration || 4000, id: options?.id });
    case 'info':
      return toast(message, { duration: options?.duration || 3000, id: options?.id });
    case 'loading':
      return toast.loading(message, { id: options?.id });
    default:
      return toast(message, { duration: options?.duration || 3000, id: options?.id });
  }
};

/**
 * Clear all shown toast history (useful for testing or reset)
 */
export const clearToastHistory = () => {
  shownToasts.clear();
};

/**
 * Dismiss all active toasts
 */
export const dismissAllToasts = () => {
  toast.dismiss();
};
