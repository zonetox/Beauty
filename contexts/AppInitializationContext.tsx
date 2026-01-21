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
    return { isInitializing: false, setInitializing: () => { } };
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
    // We no longer use a hardcoded delay.
    // Initialization is controlled by the AuthGate component
    // which marks it as complete when auth state resolves.
  }, []);

  return (
    <AppInitializationContext.Provider value={{ isInitializing, setInitializing }}>
      {children}
    </AppInitializationContext.Provider>
  );
};
