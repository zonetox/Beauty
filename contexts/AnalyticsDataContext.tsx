import React, { createContext, useContext, ReactNode } from 'react';
import { BusinessAnalytics } from '../types.ts';

interface AnalyticsDataContextType {
  getAnalyticsBybusiness_id: (business_id: number) => BusinessAnalytics | undefined;
}

const AnalyticsDataContext = createContext<AnalyticsDataContextType | undefined>(undefined);

export const AnalyticsDataProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  // Data is static for this demo, so no state or effects needed.
  const analyticsData: BusinessAnalytics[] = [];

  const getAnalyticsBybusiness_id = (business_id: number) => {
    return analyticsData.find(data => data.business_id === business_id);
  };

  const value = { getAnalyticsBybusiness_id };

  return (
    <AnalyticsDataContext.Provider value={value}>
      {children}
    </AnalyticsDataContext.Provider>
  );
};

export const useAnalyticsData = () => {
  const context = useContext(AnalyticsDataContext);
  if (!context) {
    throw new Error('useAnalyticsData must be used within an AnalyticsDataProvider');
  }
  return context;
};
