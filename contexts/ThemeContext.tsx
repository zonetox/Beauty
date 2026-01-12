import React, { createContext, useState, useEffect, useContext, ReactNode } from 'react';
import { ThemeSettings } from '../types.ts';

// Default theme settings that match the initial index.html
const DEFAULT_THEME: ThemeSettings = {
  logoUrl: '/logo.svg', // Logo with "1Beauty.Asia" text
  faviconUrl: '/favicon.svg',
  colors: {
    primary: '#BFA16A',
    primaryDark: '#A98C5A',
    secondary: '#4A4A4A',
    accent: '#EAE0D1',
    background: '#FDFCF9',
    neutralDark: '#2D2D2D',
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
    if (faviconEl && faviconEl.href !== theme.faviconUrl) {
        faviconEl.href = theme.faviconUrl;
    }

    // 2. Apply Colors via CSS Variables
    const cssVariables = `
      :root {
        --color-primary: ${theme.colors.primary};
        --color-primary-dark: ${theme.colors.primaryDark};
        --color-secondary: ${theme.colors.secondary};
        --color-accent: ${theme.colors.accent};
        --color-background: ${theme.colors.background};
        --color-neutral-dark: ${theme.colors.neutralDark};
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
            if(linkEl.href !== newHref) linkEl.href = newHref;
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

  // Load from localStorage on initial mount
  useEffect(() => {
    try {
      const savedThemeJSON = localStorage.getItem(LOCAL_STORAGE_KEY);
      if (savedThemeJSON) {
        // Merge with default to ensure new properties are not missing
        setTheme({ ...DEFAULT_THEME, ...JSON.parse(savedThemeJSON) });
      }
    } catch (e) {
      console.error("Failed to load theme from localStorage", e);
    }
  }, []);

  // Apply theme whenever it changes
  useEffect(() => {
    applyTheme(theme);
  }, [theme]);

  const updateTheme = (newTheme: ThemeSettings) => {
    setTheme(newTheme);
    try {
      localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(newTheme));
    } catch (e) {
      console.error("Failed to save theme to localStorage", e);
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
