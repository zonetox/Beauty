/**
 * LEGACY Homepage Data Context Wrapper
 * 
 * This file is kept for backward compatibility.
 * It re-exports and wraps the new Home feature.
 */

import React from 'react';
import { HomepageProvider as NewHomepageProvider, useHomepageData as useNewHomepageData } from '../src/features/home';

export const HomepageDataProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  return <NewHomepageProvider>{children}</NewHomepageProvider>;
};

export const useHomepageData = useNewHomepageData;
