import React, { createContext, useState, useEffect, useContext, ReactNode } from 'react';
import { Business } from '../types.ts';
import { useBusinessData } from './BusinessDataContext.tsx';
import { useUserData } from './UserDataContext.tsx';

interface BusinessAuthContextType {
  currentBusiness: Business | null;
}

const BusinessAuthContext = createContext<BusinessAuthContextType | undefined>(undefined);

export const BusinessAuthProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [currentBusiness, setCurrentBusiness] = useState<Business | null>(null);
  const { businesses } = useBusinessData();
  const { profile } = useUserData(); // Get the currently logged-in user's profile

  useEffect(() => {
    // This effect now dynamically finds the business linked to the logged-in user.
    if (profile && profile.businessId && businesses.length > 0) {
      const userBusiness = businesses.find(b => b.id === profile.businessId);
      setCurrentBusiness(userBusiness || null);
    } else {
      // If there's no profile or no linked business, there's no current business.
      setCurrentBusiness(null);
    }
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
