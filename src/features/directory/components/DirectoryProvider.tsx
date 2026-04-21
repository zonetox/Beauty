import React, { createContext, useContext, ReactNode, useState, useCallback } from 'react';
import { useBusinesses } from '../hooks/useBusinesses';
import { useMarkers } from '../hooks/useMarkers';
import { DirectoryFilters, BusinessMarker } from '../types';
import { Business } from '../../../../types';

interface DirectoryContextType {
    businesses: Business[];
    businessMarkers: BusinessMarker[];
    totalBusinesses: number;
    loading: boolean;
    filters: DirectoryFilters;
    setFilters: (filters: Partial<DirectoryFilters>) => void;
    fetchBusinesses: (page?: number, options?: Partial<DirectoryFilters>) => Promise<void>;
}

const DirectoryContext = createContext<DirectoryContextType | undefined>(undefined);

export const DirectoryProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
    const [filters, setInternalFilters] = useState<DirectoryFilters>({
        page: 1,
    });

    const { data, isLoading } = useBusinesses(filters);
    const { data: markers = [], isLoading: isLoadingMarkers } = useMarkers();

    const setFilters = useCallback((newFilters: Partial<DirectoryFilters>) => {
        setInternalFilters(prev => ({ ...prev, ...newFilters }));
    }, []);

    const fetchBusinesses = useCallback(async (page: number = 1, options: Partial<DirectoryFilters> = {}) => {
        setInternalFilters(prev => ({ ...prev, ...options, page }));
    }, []);

    const value = {
        businesses: data?.businesses || [],
        businessMarkers: markers,
        totalBusinesses: data?.total || 0,
        loading: isLoading || isLoadingMarkers,
        filters,
        setFilters,
        fetchBusinesses
    };

    return (
        <DirectoryContext.Provider value={value}>
            {children}
        </DirectoryContext.Provider>
    );
};

export const useDirectoryData = () => {
    const context = useContext(DirectoryContext);
    if (!context) {
        throw new Error('useDirectoryData must be used within a DirectoryProvider');
    }
    return context;
};
