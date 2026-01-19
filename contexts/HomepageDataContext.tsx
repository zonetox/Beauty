// D2.1 FIX: Move hero slides from localStorage to database (page_content table)
import React, { createContext, useState, useEffect, useContext, ReactNode, useCallback, useRef } from 'react';
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
  // Initialize with cached data immediately if available, otherwise use default
  // This ensures page renders immediately without blocking
  const getInitialData = (): HomepageData => {
    if (!isSupabaseConfigured) {
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
          return {
            ...DEFAULT_HOMEPAGE_DATA,
            ...savedData,
            sections: finalSections,
          };
        }
      } catch (error) {
        console.error(`Failed to parse homepage data from localStorage:`, error);
      }
    } else {
      // Check cache first
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
          return {
            ...DEFAULT_HOMEPAGE_DATA,
            ...savedData,
            sections: finalSections,
          };
        }
      } catch (error) {
        // Ignore cache parse errors, use default
      }
    }
    return DEFAULT_HOMEPAGE_DATA;
  };

  const [homepageData, setHomepageData] = useState<HomepageData>(getInitialData());
  // Start with loading false if we have cached/default data (page can render immediately)
  const [loading, setLoading] = useState(false);
  
  // Prevent double fetch in React.StrictMode (development)
  const hasFetchedRef = useRef(false);

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
      // Fetch from database with timeout protection
      let data, error;
      try {
        const queryPromise = supabase
          .from('page_content')
          .select('content_data')
          .eq('page_name', 'homepage')
          .single();
        
        // Homepage critical data timeout: 8 seconds
        const timeoutPromise = new Promise((_, reject) => 
          setTimeout(() => reject(new Error('Query timeout after 8 seconds')), 8000)
        );
        
        // Performance logging
        const startTime = performance.now();
        const result = await Promise.race([queryPromise, timeoutPromise]) as any;
        const duration = performance.now() - startTime;
        if (result.error?.code !== 'TIMEOUT') {
          console.log(`[PERF] Homepage Content: ${duration.toFixed(2)}ms`);
        }
        data = result.data;
        error = result.error;
      } catch (timeoutError: any) {
        if (timeoutError.message?.includes('timeout')) {
          // Silent timeout - has fallback to cache/default data
          error = { code: 'TIMEOUT', message: 'Query timeout' };
        } else {
          throw timeoutError;
        }
      }

      if (error && error.code !== 'PGRST116' && error.code !== 'TIMEOUT') { // PGRST116 = no rows returned, TIMEOUT = query timeout
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
      } else if (error && error.code === 'TIMEOUT') {
        // Timeout - use fallback immediately (silent in production)
        const savedDataJSON = localStorage.getItem(LOCAL_STORAGE_KEY);
        if (savedDataJSON) {
          try {
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
          } catch (e) {
            console.error('Failed to parse cached data:', e);
            setHomepageData(DEFAULT_HOMEPAGE_DATA);
          }
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
    } catch (error: any) {
      // Only log unhandled exceptions (not timeouts with fallbacks)
      if (!error?.message?.includes('timeout') && !error?.message?.includes('Timeout')) {
        console.error('Error in fetchHomepageData (unhandled exception):', error);
      }
      setHomepageData(DEFAULT_HOMEPAGE_DATA);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    // Prevent double fetch in React.StrictMode
    if (hasFetchedRef.current) return;
    hasFetchedRef.current = true;
    fetchHomepageData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []); // Only run once on mount

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