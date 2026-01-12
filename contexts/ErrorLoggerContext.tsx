import React, { createContext, useState, useContext, ReactNode, useCallback, useEffect, useRef } from 'react';

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
  
  // Lưu original console functions để tránh vòng lặp vô hạn
  const originalConsoleRef = useRef<{
    error: typeof console.error;
    warn: typeof console.warn;
    info: typeof console.info;
  } | null>(null);
  
  // Flag để tránh vòng lặp khi log từ interceptor
  const isLoggingRef = useRef(false);

  // Load errors from localStorage on mount
  useEffect(() => {
    try {
      const savedErrors = localStorage.getItem('app_error_logs');
      if (savedErrors) {
        const parsed = JSON.parse(savedErrors);
        
        // Kiểm tra nếu có quá nhiều lỗi (có thể do vòng lặp vô hạn trước đó)
        if (parsed.length > MAX_ERRORS * 2) {
          // Xóa logs cũ nếu phát hiện quá nhiều lỗi
          localStorage.removeItem('app_error_logs');
          console.warn('Detected excessive error logs, cleared localStorage');
          return;
        }
        
        // Convert timestamp strings back to Date objects
        const errorsWithDates = parsed.map((e: any) => ({
          ...e,
          timestamp: new Date(e.timestamp)
        }));
        setErrors(errorsWithDates);
      }
    } catch (err) {
      // Sử dụng original console.error để tránh vòng lặp khi load
      const originalError = originalConsoleRef.current?.error || console.error;
      originalError.call(console, 'Failed to load error logs from localStorage:', err);
    }
  }, []);

  // Save errors to localStorage whenever errors change
  useEffect(() => {
    try {
      localStorage.setItem('app_error_logs', JSON.stringify(errors));
    } catch (err) {
      // Sử dụng original console.error để tránh vòng lặp khi save
      const originalError = originalConsoleRef.current?.error || console.error;
      originalError.call(console, 'Failed to save error logs to localStorage:', err);
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
    // Sử dụng original console functions để tránh vòng lặp vô hạn
    const originalError = originalConsoleRef.current?.error || console.error;
    const originalWarn = originalConsoleRef.current?.warn || console.warn;
    const originalInfo = originalConsoleRef.current?.info || console.info;
    
    if (severity === 'error') {
      originalError.call(console, `[${source || 'App'}]`, error);
    } else if (severity === 'warning') {
      originalWarn.call(console, `[${source || 'App'}]`, error);
    } else {
      originalInfo.call(console, `[${source || 'App'}]`, error);
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
    // Lưu original functions vào ref trước khi intercept
    if (!originalConsoleRef.current) {
      originalConsoleRef.current = {
        error: console.error.bind(console),
        warn: console.warn.bind(console),
        info: console.info.bind(console),
      };
    }

    const originalError = originalConsoleRef.current.error;
    const originalWarn = originalConsoleRef.current.warn;

    console.error = (...args: any[]) => {
      originalError.apply(console, args);
      if (!isLoggingRef.current) {
        isLoggingRef.current = true;
        try {
          const message = args.map(arg => 
            typeof arg === 'object' ? JSON.stringify(arg) : String(arg)
          ).join(' ');
          logError(message, 'Console', 'error');
        } finally {
          isLoggingRef.current = false;
        }
      }
    };

    console.warn = (...args: any[]) => {
      originalWarn.apply(console, args);
      if (!isLoggingRef.current) {
        isLoggingRef.current = true;
        try {
          const message = args.map(arg => 
            typeof arg === 'object' ? JSON.stringify(arg) : String(arg)
          ).join(' ');
          logWarning(message, 'Console');
        } finally {
          isLoggingRef.current = false;
        }
      }
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
      if (originalConsoleRef.current) {
        console.error = originalConsoleRef.current.error;
        console.warn = originalConsoleRef.current.warn;
      }
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
