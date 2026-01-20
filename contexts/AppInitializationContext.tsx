/**
 * App Initialization Context
 * 
 * Tracks app initialization state to prevent multiple loading screens
 * and toast notifications during startup.
 */

import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { setAppInitializing } from '../lib/toastUtils.ts';

interface AppInitializationContextType {
  isInitializing: boolean;
  setInitializing: (value: boolean) => void;
}

const AppInitializationContext = createContext<AppInitializationContextType | undefined>(undefined);

export const useAppInitialization = () => {
  const context = useContext(AppInitializationContext);
  if (!context) {
    return { isInitializing: false, setInitializing: () => {} };
  }
  return context;
};

export const AppInitializationProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [isInitializing, setIsInitializing] = useState(true);

  const setInitializing = (value: boolean) => {
    setIsInitializing(value);
    // Also update toast utils to suppress toasts during initialization
    setAppInitializing(value);
  };

  useEffect(() => {
    // Mark initialization as complete after a short delay to ensure all contexts are mounted
    const timer = setTimeout(() => {
      setInitializing(false);
    }, 2000); // 2 seconds should be enough for initial auth check

    return () => clearTimeout(timer);
  }, []);

  return (
    <AppInitializationContext.Provider value={{ isInitializing, setInitializing }}>
      {children}
    </AppInitializationContext.Provider>
  );
};
