// D2.1 FIX: Move hero slides from localStorage to database (page_content table)
import React, { createContext, useState, useEffect, useContext, ReactNode, useCallback } from 'react';
import { HomepageData } from '../types.ts';
import { DEFAULT_HOMEPAGE_DATA } from '../constants.ts';
import { supabase, isSupabaseConfigured } from '../lib/supabaseClient.ts';

interface HomepageDataContextType {
  homepageData: HomepageData;
  updateHomepageData: (newData: HomepageData) => void;
  loading: boolean;
}

const HomepageDataContext = createContext<HomepageDataContextType | undefined>(undefined);

const LOCAL_STORAGE_KEY = 'homepage_content'; // Keep for cache/fallback only

export const HomepageDataProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [homepageData, setHomepageData] = useState<HomepageData>(DEFAULT_HOMEPAGE_DATA);
  const [loading, setLoading] = useState(true);

  // Fetch homepage data from database
  const fetchHomepageData = useCallback(async () => {
    if (!isSupabaseConfigured) {
      // Fallback to localStorage if Supabase not configured
      try {
        const savedDataJSON = localStorage.getItem(LOCAL_STORAGE_KEY);
        if (savedDataJSON) {
          const savedData = JSON.parse(savedDataJSON);
          const defaultSections = DEFAULT_HOMEPAGE_DATA.sections;
          let finalSections = savedData.sections || [];
          defaultSections.forEach(defaultSection => {
            if (!finalSections.find((s: any) => s.type === defaultSection.type)) {
              finalSections.push(defaultSection);
            }
          });
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
      setLoading(false);
      return;
    }

    try {
      // Fetch from database
      const { data, error } = await supabase
        .from('page_content')
        .select('content_data')
        .eq('page_name', 'homepage')
        .single();

      if (error && error.code !== 'PGRST116') { // PGRST116 = no rows returned
        console.error('Error fetching homepage data:', error);
        // Fallback to localStorage
        const savedDataJSON = localStorage.getItem(LOCAL_STORAGE_KEY);
        if (savedDataJSON) {
          const savedData = JSON.parse(savedDataJSON);
          const defaultSections = DEFAULT_HOMEPAGE_DATA.sections;
          let finalSections = savedData.sections || [];
          defaultSections.forEach(defaultSection => {
            if (!finalSections.find((s: any) => s.type === defaultSection.type)) {
              finalSections.push(defaultSection);
            }
          });
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
        } else {
          setHomepageData(DEFAULT_HOMEPAGE_DATA);
        }
      } else if (data && data.content_data) {
        // Merge with defaults to ensure all sections are present
        const dbData = data.content_data as HomepageData;
        const defaultSections = DEFAULT_HOMEPAGE_DATA.sections;
        let finalSections = dbData.sections || [];
        defaultSections.forEach(defaultSection => {
          if (!finalSections.find((s: any) => s.type === defaultSection.type)) {
            finalSections.push(defaultSection);
          }
        });
        finalSections = finalSections.map((section: any) => {
          const defaultMatch = defaultSections.find(s => s.type === section.type);
          return { ...defaultMatch, ...section };
        });
        const mergedData: HomepageData = {
          ...DEFAULT_HOMEPAGE_DATA,
          ...dbData,
          sections: finalSections,
        };
        setHomepageData(mergedData);
        // Cache in localStorage for offline/fallback
        try {
          localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(mergedData));
        } catch (e) {
          console.warn('Failed to cache homepage data:', e);
        }
      } else {
        setHomepageData(DEFAULT_HOMEPAGE_DATA);
      }
    } catch (error) {
      console.error('Error in fetchHomepageData:', error);
      setHomepageData(DEFAULT_HOMEPAGE_DATA);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchHomepageData();
  }, [fetchHomepageData]);

  const updateHomepageData = async (newData: HomepageData) => {
    setHomepageData(newData);
    
    if (!isSupabaseConfigured) {
      // Fallback to localStorage if Supabase not configured
      try {
        localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(newData));
      } catch (error) {
        console.error(`Failed to save homepage data to localStorage:`, error);
      }
      return;
    }

    try {
      // Save to database
      const { error } = await supabase
        .from('page_content')
        .upsert({
          page_name: 'homepage',
          content_data: newData as any,
        }, {
          onConflict: 'page_name',
        });

      if (error) {
        console.error('Error saving homepage data:', error);
        // Fallback to localStorage
        try {
          localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(newData));
        } catch (e) {
          console.error('Failed to save to localStorage:', e);
        }
      } else {
        // Cache in localStorage for offline/fallback
        try {
          localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(newData));
        } catch (e) {
          console.warn('Failed to cache homepage data:', e);
        }
      }
    } catch (error) {
      console.error('Error in updateHomepageData:', error);
      // Fallback to localStorage
      try {
        localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(newData));
      } catch (e) {
        console.error('Failed to save to localStorage:', e);
      }
    }
  };

  const value = { homepageData, updateHomepageData, loading };

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