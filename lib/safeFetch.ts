/**
 * Unified Safe Fetch Utility
 * 
 * Provides configurable timeout, retry, graceful fallback, and centralized AbortController
 * No console spam in production - only logs fatal errors
 */

export interface SafeFetchOptions {
  timeout?: number; // milliseconds
  retry?: boolean; // retry once on failure
  retryDelay?: number; // milliseconds between retries
  abortController?: AbortController; // for cancellation
  priority?: 'high' | 'medium' | 'low'; // request prioritization
  silent?: boolean; // if true, don't log even fatal errors
}

export interface SafeFetchResult<T> {
  data: T | null;
  error: Error | null;
  fromCache?: boolean;
}

// Centralized AbortController registry for request cancellation
const abortControllers = new Map<string, AbortController>();

/**
 * Create or get AbortController for a request key
 */
export function getAbortController(key: string): AbortController {
  // Cancel existing request with same key
  const existing = abortControllers.get(key);
  if (existing) {
    existing.abort();
  }

  const controller = new AbortController();
  abortControllers.set(key, controller);
  return controller;
}

/**
 * Cancel a request by key
 */
export function cancelRequest(key: string): void {
  const controller = abortControllers.get(key);
  if (controller) {
    controller.abort();
    abortControllers.delete(key);
  }
}

/**
 * Safe fetch wrapper with timeout, retry, and graceful fallback
 */
export async function safeFetch<T>(
  fetchFn: () => Promise<T>,
  options: SafeFetchOptions = {}
): Promise<SafeFetchResult<T>> {
  const {
    timeout = 8000, // Default 8s
    retry = true,
    retryDelay = 1000,
    abortController,
    silent = false
  } = options;

  const controller = abortController || new AbortController();
  const signal = controller.signal;

  const isDevelopment = typeof import.meta !== 'undefined'
    ? import.meta.env?.MODE === 'development'
    : process.env.NODE_ENV !== 'production';

  const attemptFetch = async (): Promise<T> => {
    // Create timeout promise
    const timeoutPromise = new Promise<never>((_, reject) => {
      setTimeout(() => {
        reject(new Error('Request timeout'));
      }, timeout);
    });

    try {
      // Race between fetch and timeout
      const result = await Promise.race([fetchFn(), timeoutPromise]);
      return result;
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      // Don't retry if aborted
      if (signal.aborted) {
        throw new Error('Request aborted');
      }

      // Don't retry on timeout (timeout is expected in slow networks)
      if (errorMessage === 'Request timeout') {
        throw error;
      }

      throw error;
    }
  };

  try {
    const data = await attemptFetch();
    return { data, error: null };
  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    // Retry once if enabled and not aborted
    if (retry && !signal.aborted && errorMessage !== 'Request timeout') {
      // Wait before retry
      await new Promise(resolve => setTimeout(resolve, retryDelay));

      try {
        const data = await attemptFetch();
        return { data, error: null };
      } catch (retryError: unknown) {
        const retryErrorMessage = retryError instanceof Error ? retryError.message : 'Unknown error';
        // Only log fatal errors (not timeouts, not aborted)
        if (!silent && !retryErrorMessage.includes('timeout') && !retryErrorMessage.includes('aborted')) {
          if (isDevelopment) {
            console.error('[SafeFetch] Fatal error after retry:', retryError);
          }
        }
        return { data: null, error: retryError as any };
      }
    }

    // Handle timeout gracefully (not an error in slow networks)
    if (errorMessage === 'Request timeout') {
      return { data: null, error: null }; // Graceful fallback - return null data, no error
    }

    // Handle abort gracefully
    if (errorMessage === 'Request aborted') {
      return { data: null, error: null }; // Graceful fallback
    }

    // Only log fatal errors
    if (!silent && isDevelopment) {
      console.error('[SafeFetch] Fatal error:', error);
    }

    return { data: null, error: error as any };
  }
}

/**
 * Priority-based fetch queue
 * High priority requests are executed first
 */
class PriorityQueue {
  private high: Array<() => Promise<unknown>> = [];
  private medium: Array<() => Promise<unknown>> = [];
  private low: Array<() => Promise<unknown>> = [];
  private running = 0;
  private maxConcurrent = 6; // Max concurrent requests

  async enqueue<T>(
    fetchFn: () => Promise<T>,
    priority: 'high' | 'medium' | 'low' = 'medium'
  ): Promise<T> {
    return new Promise((resolve, reject) => {
      const task = async () => {
        try {
          const result = await fetchFn();
          resolve(result);
        } catch (error) {
          reject(error);
        } finally {
          this.running--;
          this.process();
        }
      };

      if (priority === 'high') {
        this.high.push(task);
      } else if (priority === 'medium') {
        this.medium.push(task);
      } else {
        this.low.push(task);
      }

      this.process();
    });
  }

  private process(): void {
    while (this.running < this.maxConcurrent) {
      let task: (() => Promise<unknown>) | undefined;

      if (this.high.length > 0) {
        task = this.high.shift();
      } else if (this.medium.length > 0) {
        task = this.medium.shift();
      } else if (this.low.length > 0) {
        task = this.low.shift();
      }

      if (!task) break;

      this.running++;
      task();
    }
  }
}

const priorityQueue = new PriorityQueue();

/**
 * Priority-based safe fetch
 */
export async function prioritySafeFetch<T>(
  fetchFn: () => Promise<T>,
  options: SafeFetchOptions = {}
): Promise<SafeFetchResult<T>> {
  const priority = options.priority || 'medium';

  return priorityQueue.enqueue(
    () => safeFetch(fetchFn, options),
    priority
  );
}
