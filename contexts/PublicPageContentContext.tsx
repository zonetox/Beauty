// Public Page Content Context - For public pages (About, Contact)
// Không cần AdminPlatformProvider, fetch trực tiếp từ database

import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { supabase, isSupabaseConfigured } from '../lib/supabaseClient.ts';
import { DEFAULT_PAGE_CONTENT } from './PageContentContext.tsx';
import { LayoutItem } from '../types.ts';

type PageName = 'about' | 'contact';

interface PageData {
  layout: LayoutItem[];
  visibility: { [key: string]: boolean };
}

interface PublicPageContentContextType {
  getPageContent: (page: PageName) => PageData | undefined;
  loading: boolean;
}

const PublicPageContentContext = createContext<PublicPageContentContextType | undefined>(undefined);

export const PublicPageContentProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [pageContent, setPageContent] = useState<{ [key in PageName]?: PageData }>({});
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!isSupabaseConfigured) {
      // Use default content if Supabase not configured
      setPageContent(DEFAULT_PAGE_CONTENT);
      setLoading(false);
      return;
    }

    const fetchPageContent = async () => {
      try {
        const { data, error } = await supabase
          .from('page_content')
          .select('page_name, content_data')
          .in('page_name', ['about', 'contact']);

        if (error) {
          console.error('Error fetching page content:', error);
          // Fallback to default content
          setPageContent(DEFAULT_PAGE_CONTENT);
        } else {
          const contentMap: { [key in PageName]?: PageData } = {};
          if (data) {
            (data as { page_name: string; content_data: unknown }[]).forEach((row) => {
              if (row.page_name === 'about' || row.page_name === 'contact') {
                contentMap[row.page_name as PageName] = row.content_data as PageData;
              }
            });
          }
          // Merge with defaults for missing pages
          setPageContent({
            ...DEFAULT_PAGE_CONTENT,
            ...contentMap,
          });
        }
      } catch (err) {
        console.error('Unexpected error fetching page content:', err);
        setPageContent(DEFAULT_PAGE_CONTENT);
      } finally {
        setLoading(false);
      }
    };

    fetchPageContent();
  }, []);

  const getPageContent = (page: PageName): PageData | undefined => {
    return pageContent[page] || DEFAULT_PAGE_CONTENT[page];
  };

  return (
    <PublicPageContentContext.Provider value={{ getPageContent, loading }}>
      {children}
    </PublicPageContentContext.Provider>
  );
};

export const usePublicPageContent = () => {
  const context = useContext(PublicPageContentContext);
  if (context === undefined) {
    throw new Error('usePublicPageContent must be used within PublicPageContentProvider');
  }
  return context;
};
