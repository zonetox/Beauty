import React, { createContext, useContext, useState, useCallback, ReactNode } from 'react';
import toast from 'react-hot-toast';

interface CMSContextType {
    isEditing: boolean;
    setIsEditing: (value: boolean) => void;
    stagedChanges: Record<string, any>;
    setStagedChange: (id: string, value: any) => void;
    clearChanges: () => void;
    saveChanges: (callback: (changes: Record<string, any>) => Promise<void>) => Promise<void>;
}

const CMSContext = createContext<CMSContextType | undefined>(undefined);

export const CMSProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
    const [isEditing, setIsEditing] = useState(false);
    const [stagedChanges, setStagedChanges] = useState<Record<string, any>>({});

    const setStagedChange = useCallback((id: string, value: any) => {
        setStagedChanges((prev) => ({ ...prev, [id]: value }));
    }, []);

    const clearChanges = useCallback(() => {
        setStagedChanges({});
    }, []);

    const saveChanges = useCallback(async (callback: (changes: Record<string, any>) => Promise<void>) => {
        try {
            await callback(stagedChanges);
            setStagedChanges({});
            setIsEditing(false);
            toast.success('Đã lưu thay đổi thành công!');
        } catch (error) {
            console.error('Lỗi khi lưu CMS:', error);
            toast.error('Không thể lưu thay đổi. Vui lòng thử lại.');
        }
    }, [stagedChanges]);

    return (
        <CMSContext.Provider
            value={{
                isEditing,
                setIsEditing,
                stagedChanges,
                setStagedChange,
                clearChanges,
                saveChanges,
            }}
        >
            {children}
        </CMSContext.Provider>
    );
};

export const useCMS = () => {
    const context = useContext(CMSContext);
    if (!context) {
        throw new Error('useCMS must be used within a CMSProvider');
    }
    return context;
};
