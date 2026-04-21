import React, { createContext, useContext, ReactNode } from 'react';
import { useHomepage } from '../hooks/useHomepage';
import { HomepageData } from '../../../../types';

interface HomepageContextType {
    homepageData: HomepageData;
    updateHomepageData: (newData: HomepageData) => Promise<HomepageData>;
    loading: boolean;
}

const HomepageContext = createContext<HomepageContextType | undefined>(undefined);

export const HomepageProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
    const { homepageData, isLoading, updateHomepageData } = useHomepage();

    const value = {
        homepageData,
        updateHomepageData,
        loading: isLoading
    };

    return (
        <HomepageContext.Provider value={value}>
            {children}
        </HomepageContext.Provider>
    );
};

export const useHomepageData = () => {
    const context = useContext(HomepageContext);
    if (!context) {
        throw new Error('useHomepageData must be used within a HomepageProvider');
    }
    return context;
};
