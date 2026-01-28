

import React, { createContext, useState, useEffect, useContext, ReactNode } from 'react';
import { MembershipPackage } from '../types.ts';
import { DEFAULT_MEMBERSHIP_PACKAGES } from '../constants.ts';

interface MembershipPackageContextType {
  packages: MembershipPackage[];
  addPackage: (newPackage: Omit<MembershipPackage, 'id'>) => void;
  updatePackage: (package_id: string, updates: Partial<MembershipPackage>) => void;
  deletePackage: (package_id: string) => void;
}

const MembershipPackageContext = createContext<MembershipPackageContextType | undefined>(undefined);

const LOCAL_STORAGE_KEY = 'membership_packages';

export const MembershipPackageProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [packages, setPackages] = useState<MembershipPackage[]>(DEFAULT_MEMBERSHIP_PACKAGES);

  useEffect(() => {
    try {
      const savedPackagesJSON = localStorage.getItem(LOCAL_STORAGE_KEY);
      if (savedPackagesJSON) {
        const savedPackages: MembershipPackage[] = JSON.parse(savedPackagesJSON);
        const mergedPackages = [...savedPackages];
        DEFAULT_MEMBERSHIP_PACKAGES.forEach(defaultPkg => {
          if (!savedPackages.find(savedPkg => savedPkg.id === defaultPkg.id)) {
            mergedPackages.push(defaultPkg);
          }
        });
        // eslint-disable-next-line react-hooks/set-state-in-effect
        setPackages(mergedPackages);
      } else {
        localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(DEFAULT_MEMBERSHIP_PACKAGES));
      }
    } catch (error) {
      console.error("Failed to parse membership packages from localStorage", error);
      setPackages(DEFAULT_MEMBERSHIP_PACKAGES);
    }
  }, []);

  const updateLocalStorage = (updatedPackages: MembershipPackage[]) => {
    try {
      localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(updatedPackages));
    } catch (error) {
      console.error("Failed to save membership packages to localStorage", error);
    }
  }

  const addPackage = (newPackage: Omit<MembershipPackage, 'id'>) => {
    const packageToAdd: MembershipPackage = {
      ...newPackage,
      id: `pkg_${crypto.randomUUID()}`,
    };
    const updatedPackages = [...packages, packageToAdd];
    setPackages(updatedPackages);
    updateLocalStorage(updatedPackages);
  };

  const updatePackage = (package_id: string, updates: Partial<MembershipPackage>) => {
    const updatedPackages = packages.map(pkg =>
      pkg.id === package_id ? { ...pkg, ...updates } : pkg
    );
    setPackages(updatedPackages);
    updateLocalStorage(updatedPackages);
  };

  const deletePackage = (package_id: string) => {
    const updatedPackages = packages.filter(pkg => pkg.id !== package_id);
    setPackages(updatedPackages);
    updateLocalStorage(updatedPackages);
  };

  return (
    <MembershipPackageContext.Provider value={{ packages, addPackage, updatePackage, deletePackage }}>
      {children}
    </MembershipPackageContext.Provider>
  );
};

export const useMembershipPackageData = () => {
  const context = useContext(MembershipPackageContext);
  if (!context) {
    throw new Error('useMembershipPackageData must be used within a MembershipPackageProvider');
  }
  return context;
};
