import React, { createContext, useState, useEffect, useContext, ReactNode, useCallback } from 'react';
import { ThemeSettings } from '../types.ts';
import { supabase, isSupabaseConfigured } from '../lib/supabaseClient.ts';

// Default theme settings that match the initial index.html
const DEFAULT_THEME: ThemeSettings = {
  logo_url: '/logo.svg', // Logo with "1Beauty.Asia" text
  favicon_url: '/favicon.svg',
  colors: {
    primary: '#BFA16A',
    primary_dark: '#A98C5A',
    secondary: '#4A4A4A',
    accent: '#EAE0D1',
    background: '#FDFCF9',
    neutral_dark: '#2D2D2D',
  },
  fonts: {
    sans: 'Inter',
    serif: 'Playfair Display',
  },
};

// Map font names to their Google Fonts URL part
const FONT_URL_MAP: { [key: string]: string } = {
  'Inter': 'Inter:wght@400;500;600;700',
  'Playfair Display': 'Playfair+Display:ital,wght@0,400;0,700;0,900;1,400',
  'Roboto': 'Roboto:wght@400;500;700',
  'Lato': 'Lato:wght@400;700',
  'Montserrat': 'Montserrat:wght@400;500;600;700',
  'Lora': 'Lora:ital,wght@0,400;0,700;1,400',
  'Source Serif Pro': 'Source+Serif+Pro:wght@400;600;700',
};

interface ThemeContextType {
  theme: ThemeSettings;
  updateTheme: (newTheme: ThemeSettings) => void;
  availableFonts: string[];
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

const LOCAL_STORAGE_KEY = 'app_theme_settings';

// Function to apply theme styles to the DOM
const applyTheme = (theme: ThemeSettings) => {
  // 1. Apply Favicon
  const faviconEl = document.getElementById('favicon') as HTMLLinkElement | null;
  if (faviconEl && faviconEl.href !== theme.favicon_url) {
    faviconEl.href = theme.favicon_url;
  }

  // 2. Apply Colors via CSS Variables
  const cssVariables = `
      :root {
        --color-primary: ${theme.colors.primary};
        --color-primary-dark: ${theme.colors.primary_dark};
        --color-secondary: ${theme.colors.secondary};
        --color-accent: ${theme.colors.accent};
        --color-background: ${theme.colors.background};
        --color-neutral-dark: ${theme.colors.neutral_dark};
      }
    `;
  let styleEl = document.getElementById('dynamic-theme-styles');
  if (!styleEl) {
    styleEl = document.createElement('style');
    styleEl.id = 'dynamic-theme-styles';
    document.head.appendChild(styleEl);
  }
  styleEl.innerHTML = cssVariables;

  // 3. Apply Fonts
  document.body.style.fontFamily = `'${theme.fonts.sans}', sans-serif`;
  document.querySelectorAll('.font-serif').forEach(el => {
    (el as HTMLElement).style.fontFamily = `'${theme.fonts.serif}', serif`;
  });

  // 4. Load Google Fonts
  const loadFont = (fontName: string, id: string) => {
    const fontUrlPart = FONT_URL_MAP[fontName];
    if (!fontUrlPart) return;

    let linkEl = document.getElementById(id) as HTMLLinkElement | null;
    const newHref = `https://fonts.googleapis.com/css2?family=${fontUrlPart.replace(/ /g, '+')}&display=swap`;

    if (linkEl) {
      if (linkEl.href !== newHref) linkEl.href = newHref;
    } else {
      linkEl = document.createElement('link');
      linkEl.id = id;
      linkEl.rel = 'stylesheet';
      linkEl.href = newHref;
      document.head.appendChild(linkEl);
    }
  };

  // De-duplicate font loading
  const requiredFonts = new Set([theme.fonts.sans, theme.fonts.serif]);
  let fontCounter = 0;
  requiredFonts.forEach(fontName => {
    loadFont(fontName, `dynamic-font-${fontCounter++}`);
  });
};

export const ThemeProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [theme, setTheme] = useState<ThemeSettings>(DEFAULT_THEME);
  // Start with loading false - use cached/default data immediately
  // const [loading, setLoading] = useState(false);

  // Load theme from database or localStorage (silent, no loading state)
  const fetchTheme = useCallback(async () => {
    // Load from localStorage first (instant)
    try {
      const savedThemeJSON = localStorage.getItem(LOCAL_STORAGE_KEY);
      if (savedThemeJSON) {
        // Merge with default to ensure new properties are not missing
        setTheme({ ...DEFAULT_THEME, ...JSON.parse(savedThemeJSON) });
      }
    } catch (e) {
      console.error("Failed to load theme from localStorage", e);
    }

    // Then try database in background (non-blocking)
    if (isSupabaseConfigured) {
      try {
        // Try to load from app_settings table
        const { data, error } = await supabase
          .from('app_settings')
          .select('settings_data')
          .eq('id', 1)
          .maybeSingle();

        const settings = data?.settings_data as { theme?: ThemeSettings } | null;
        if (!error && settings?.theme) {
          // Merge with default to ensure new properties are not missing
          const mergedTheme = { ...DEFAULT_THEME, ...settings.theme };

          // Force default logo if the value from DB is empty
          if (!mergedTheme.logo_url) {
            mergedTheme.logo_url = DEFAULT_THEME.logo_url;
          }

          setTheme(mergedTheme);
          // Save to localStorage for next time
          try {
            localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(settings.theme));
          } catch (e) {
            console.error("Failed to save theme to localStorage", e);
          }
        }
      } catch (error) {
        console.error('Error fetching theme from database:', error);
        // Silent fail - use localStorage/default theme
      }
    }
  }, []);

  // Delay theme fetch from database (load from localStorage first, then sync from DB)
  useEffect(() => {
    // Delay database fetch by 500ms to let app initialize first
    const timer = setTimeout(() => {
      fetchTheme();
    }, 500);

    return () => clearTimeout(timer);
  }, [fetchTheme]);

  // Apply theme whenever it changes
  useEffect(() => {
    applyTheme(theme);
  }, [theme]);

  const updateTheme = async (newTheme: ThemeSettings) => {
    setTheme(newTheme);

    // Save to localStorage immediately for fast UI update
    try {
      localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(newTheme));
    } catch (e) {
      console.error("Failed to save theme to localStorage", e);
    }

    // Save to database if configured
    if (isSupabaseConfigured) {
      try {
        // Get current app_settings
        const { data: currentSettings } = await supabase
          .from('app_settings')
          .select('settings_data')
          .eq('id', 1)
          .maybeSingle();

        const updatedSettings = {
          ...(currentSettings?.settings_data as Record<string, unknown> || {}),
          theme: newTheme,
        };

        // Upsert app_settings with theme
        const { error } = await supabase
          .from('app_settings')
          .upsert(
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            { id: 1, settings_data: updatedSettings as any },
            { onConflict: 'id' }
          );

        if (error) {
          console.error('Error saving theme to database:', error);
        }
      } catch (error) {
        console.error('Error updating theme in database:', error);
      }
    }
  };

  const availableFonts = Object.keys(FONT_URL_MAP);

  const value = { theme, updateTheme, availableFonts };

  return (
    <ThemeContext.Provider value={value}>
      {children}
    </ThemeContext.Provider>
  );
};

export const useTheme = () => {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }
  return context;
};
