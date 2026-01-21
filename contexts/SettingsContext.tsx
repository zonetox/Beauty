// contexts/SettingsContext.tsx
import React, { createContext, useState, useEffect, useContext, ReactNode } from 'react';
import { AppSettings } from '../types.ts';

interface SettingsContextType {
  settings: AppSettings;
  updateSettings: (newSettings: Partial<AppSettings>) => void;
}

const SettingsContext = createContext<SettingsContextType | undefined>(undefined);

const LOCAL_STORAGE_KEY = 'app_settings';

const DEFAULT_SETTINGS: AppSettings = {
  bankDetails: {
    bankName: 'Vietcombank',
    accountName: 'CONG TY TNHH BEAUTYDIR',
    accountNumber: '1234567890',
    transferNote: 'Vui lòng ghi rõ nội dung chuyển khoản: [Tên doanh nghiệp] - [Mã đơn hàng]',
  },
};

export const SettingsProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [settings, setSettings] = useState<AppSettings>(DEFAULT_SETTINGS);

  useEffect(() => {
    try {
      const savedDataJSON = localStorage.getItem(LOCAL_STORAGE_KEY);
      if (savedDataJSON) {
        const savedData = JSON.parse(savedDataJSON);
        // Merge with defaults to ensure all keys exist
        setSettings({ ...DEFAULT_SETTINGS, ...savedData });
      } else {
        localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(DEFAULT_SETTINGS));
      }
    } catch (error) {
      console.error(`Failed to parse settings from localStorage:`, error);
      setSettings(DEFAULT_SETTINGS);
    }
  }, []);

  const updateSettings = (newSettings: Partial<AppSettings>) => {
    const updatedSettings = { ...settings, ...newSettings };
    setSettings(updatedSettings);
    try {
      localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(updatedSettings));
    } catch (error) {
      console.error(`Failed to save settings to localStorage:`, error);
    }
  };

  const value = { settings, updateSettings };

  return (
    <SettingsContext.Provider value={value}>
      {children}
    </SettingsContext.Provider>
  );
};

export const useSettings = () => {
  const context = useContext(SettingsContext);
  if (!context) {
    throw new Error('useSettings must be used within a SettingsProvider');
  }
  return context;
};