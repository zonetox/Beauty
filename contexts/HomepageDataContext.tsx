import React, { createContext, useState, useEffect, useContext, ReactNode } from 'react';
import { HomepageData } from '../types.ts';
import { DEFAULT_HOMEPAGE_DATA } from '../constants.ts';

interface HomepageDataContextType {
  homepageData: HomepageData;
  updateHomepageData: (newData: HomepageData) => void;
}

const HomepageDataContext = createContext<HomepageDataContextType | undefined>(undefined);

const LOCAL_STORAGE_KEY = 'homepage_content';

export const HomepageDataProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [homepageData, setHomepageData] = useState<HomepageData>(DEFAULT_HOMEPAGE_DATA);

  useEffect(() => {
    try {
      const savedDataJSON = localStorage.getItem(LOCAL_STORAGE_KEY);
      if (savedDataJSON) {
        const savedData = JSON.parse(savedDataJSON);

        // Advanced merge: Use saved order, but ensure all default sections are present.
        const defaultSections = DEFAULT_HOMEPAGE_DATA.sections;
        let finalSections = savedData.sections || [];

        // Add any missing sections from default to the end
        defaultSections.forEach(defaultSection => {
            if (!finalSections.find((s: any) => s.type === defaultSection.type)) {
                finalSections.push(defaultSection);
            }
        });
        
        // Ensure all sections have all properties from the default
        finalSections = finalSections.map((section: any) => {
            const defaultMatch = defaultSections.find(s => s.type === section.type);
            return { ...defaultMatch, ...section };
        });

        const mergedData: HomepageData = {
            ...DEFAULT_HOMEPAGE_DATA,
            ...savedData,
            sections: finalSections,
        };
        setHomepageData(mergedData);
      }
    } catch (error) {
        console.error(`Failed to parse homepage data from localStorage:`, error);
        setHomepageData(DEFAULT_HOMEPAGE_DATA);
    }
  }, []);

  const updateHomepageData = (newData: HomepageData) => {
    setHomepageData(newData);
    try {
        localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(newData));
    } catch (error) {
        console.error(`Failed to save homepage data to localStorage:`, error);
    }
  };

  const value = { homepageData, updateHomepageData };

  return (
    <HomepageDataContext.Provider value={value}>
      {children}
    </HomepageDataContext.Provider>
  );
};

export const useHomepageData = () => {
  const context = useContext(HomepageDataContext);
  if (!context) {
    throw new Error('useHomepageData must be used within a HomepageDataProvider');
  }
  return context;
};