import React, { createContext, useState, useContext, ReactNode, useCallback, useEffect } from 'react';

export interface ErrorLog {
  id: string;
  timestamp: Date;
  message: string;
  stack?: string;
  source?: string; // Component, Context, API, etc.
  severity: 'error' | 'warning' | 'info';
  url?: string;
  userAgent?: string;
  userId?: string;
}

interface ErrorLoggerContextType {
  errors: ErrorLog[];
  logError: (error: Error | string, source?: string, severity?: ErrorLog['severity']) => void;
  logWarning: (message: string, source?: string) => void;
  logInfo: (message: string, source?: string) => void;
  clearErrors: () => void;
  clearError: (id: string) => void;
  getErrorsBySource: (source: string) => ErrorLog[];
  getRecentErrors: (minutes?: number) => ErrorLog[];
  exportErrors: () => string;
}

const ErrorLoggerContext = createContext<ErrorLoggerContextType | undefined>(undefined);

const MAX_ERRORS = 100; // Giới hạn số lỗi lưu trữ

export const ErrorLoggerProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [errors, setErrors] = useState<ErrorLog[]>([]);

  // Load errors from localStorage on mount
  useEffect(() => {
    try {
      const savedErrors = localStorage.getItem('app_error_logs');
      if (savedErrors) {
        const parsed = JSON.parse(savedErrors);
        // Convert timestamp strings back to Date objects
        const errorsWithDates = parsed.map((e: any) => ({
          ...e,
          timestamp: new Date(e.timestamp)
        }));
        setErrors(errorsWithDates);
      }
    } catch (err) {
      console.error('Failed to load error logs from localStorage:', err);
    }
  }, []);

  // Save errors to localStorage whenever errors change
  useEffect(() => {
    try {
      localStorage.setItem('app_error_logs', JSON.stringify(errors));
    } catch (err) {
      console.error('Failed to save error logs to localStorage:', err);
    }
  }, [errors]);

  const logError = useCallback((
    error: Error | string,
    source?: string,
    severity: ErrorLog['severity'] = 'error'
  ) => {
    const errorLog: ErrorLog = {
      id: `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      timestamp: new Date(),
      message: error instanceof Error ? error.message : error,
      stack: error instanceof Error ? error.stack : undefined,
      source: source || 'Unknown',
      severity,
      url: typeof window !== 'undefined' ? window.location.href : undefined,
      userAgent: typeof navigator !== 'undefined' ? navigator.userAgent : undefined,
    };

    setErrors(prev => {
      const newErrors = [errorLog, ...prev];
      // Giới hạn số lỗi lưu trữ
      return newErrors.slice(0, MAX_ERRORS);
    });

    // Vẫn log ra console để developer có thể thấy
    if (severity === 'error') {
      console.error(`[${source || 'App'}]`, error);
    } else if (severity === 'warning') {
      console.warn(`[${source || 'App'}]`, error);
    } else {
      console.info(`[${source || 'App'}]`, error);
    }
  }, []);

  const logWarning = useCallback((message: string, source?: string) => {
    logError(message, source, 'warning');
  }, [logError]);

  const logInfo = useCallback((message: string, source?: string) => {
    logError(message, source, 'info');
  }, [logError]);

  const clearErrors = useCallback(() => {
    setErrors([]);
    localStorage.removeItem('app_error_logs');
  }, []);

  const clearError = useCallback((id: string) => {
    setErrors(prev => prev.filter(e => e.id !== id));
  }, []);

  const getErrorsBySource = useCallback((source: string) => {
    return errors.filter(e => e.source === source);
  }, [errors]);

  const getRecentErrors = useCallback((minutes: number = 5) => {
    const cutoff = new Date(Date.now() - minutes * 60 * 1000);
    return errors.filter(e => e.timestamp >= cutoff);
  }, [errors]);

  const exportErrors = useCallback(() => {
    return JSON.stringify(errors, null, 2);
  }, [errors]);

  // Intercept console.error, console.warn
  useEffect(() => {
    const originalError = console.error;
    const originalWarn = console.warn;

    console.error = (...args: any[]) => {
      originalError.apply(console, args);
      const message = args.map(arg => 
        typeof arg === 'object' ? JSON.stringify(arg) : String(arg)
      ).join(' ');
      logError(message, 'Console', 'error');
    };

    console.warn = (...args: any[]) => {
      originalWarn.apply(console, args);
      const message = args.map(arg => 
        typeof arg === 'object' ? JSON.stringify(arg) : String(arg)
      ).join(' ');
      logWarning(message, 'Console');
    };

    // Intercept unhandled errors
    const handleError = (event: ErrorEvent) => {
      logError(event.error || event.message, 'UnhandledError', 'error');
    };

    const handleRejection = (event: PromiseRejectionEvent) => {
      logError(event.reason || 'Unhandled Promise Rejection', 'UnhandledRejection', 'error');
    };

    window.addEventListener('error', handleError);
    window.addEventListener('unhandledrejection', handleRejection);

    return () => {
      console.error = originalError;
      console.warn = originalWarn;
      window.removeEventListener('error', handleError);
      window.removeEventListener('unhandledrejection', handleRejection);
    };
  }, [logError, logWarning]);

  const value = {
    errors,
    logError,
    logWarning,
    logInfo,
    clearErrors,
    clearError,
    getErrorsBySource,
    getRecentErrors,
    exportErrors,
  };

  return (
    <ErrorLoggerContext.Provider value={value}>
      {children}
    </ErrorLoggerContext.Provider>
  );
};

export const useErrorLogger = () => {
  const context = useContext(ErrorLoggerContext);
  if (context === undefined) {
    throw new Error('useErrorLogger must be used within an ErrorLoggerProvider');
  }
  return context;
};
