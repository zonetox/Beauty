import React, { createContext, useMemo, useContext, ReactNode } from 'react';
import { Business } from '../types.ts';
import { useBusinessData } from './BusinessDataContext.tsx';
import { useUserData } from './UserDataContext.tsx';

interface BusinessAuthContextType {
  currentBusiness: Business | null;
}

const BusinessAuthContext = createContext<BusinessAuthContextType | undefined>(undefined);

export const BusinessAuthProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const { businesses } = useBusinessData();
  const { profile } = useUserData(); // Get the currently logged-in user's profile

  // Use useMemo to compute currentBusiness instead of useEffect to avoid setState in effect
  const currentBusiness = useMemo(() => {
    if (profile && profile.businessId && businesses.length > 0) {
      return businesses.find(b => b.id === profile.businessId) || null;
    }
    return null;
  }, [profile, businesses]);

  return (
    <BusinessAuthContext.Provider value={{ currentBusiness }}>
      {children}
    </BusinessAuthContext.Provider>
  );
};

export const useBusinessAuth = () => {
  const context = useContext(BusinessAuthContext);
  if (!context) {
    throw new Error('useBusinessAuth must be used within a BusinessAuthProvider');
  }
  return context;
};
