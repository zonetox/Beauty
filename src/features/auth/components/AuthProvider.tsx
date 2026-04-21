import { createContext, useContext, ReactNode } from 'react';
import { AuthContextType } from '../types';
import { useAuth as useAuthFeature } from '../hooks/useAuth';

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const useAuth = () => {
    const context = useContext(AuthContext);
    if (!context) {
        throw new Error('useAuth must be used within AuthProvider');
    }
    return context;
};

interface AuthProviderProps {
    children: ReactNode;
}

export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
    const auth = useAuthFeature();

    return <AuthContext.Provider value={auth}>{children}</AuthContext.Provider>;
};
