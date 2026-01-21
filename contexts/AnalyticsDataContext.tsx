import React, { createContext, useContext, ReactNode } from 'react';
import { BusinessAnalytics } from '../types.ts';

interface AnalyticsDataContextType {
  getAnalyticsByBusinessId: (businessId: number) => BusinessAnalytics | undefined;
}

const AnalyticsDataContext = createContext<AnalyticsDataContextType | undefined>(undefined);

export const AnalyticsDataProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  // Data is static for this demo, so no state or effects needed.
  const analyticsData: BusinessAnalytics[] = [];

  const getAnalyticsByBusinessId = (businessId: number) => {
    return analyticsData.find(data => data.businessId === businessId);
  };

  const value = { getAnalyticsByBusinessId };

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
