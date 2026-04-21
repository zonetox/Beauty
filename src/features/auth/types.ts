import { Session, User } from '@supabase/supabase-js';
import { Profile } from '../../../types';
import { UserRole } from '../../../lib/roleResolution';

export type AuthState = 'loading' | 'authenticated' | 'unauthenticated';

export interface AuthContextType {
    state: AuthState;
    session: Session | null;
    user: User | null;
    profile: Profile | null;
    role: UserRole;
    business_id: number | null;
    isDataLoaded: boolean;
    error: string | null;

    // Actions
    login: (email: string, password: string) => Promise<void>;
    logout: () => Promise<void>;
    register: (email: string, password: string, metadata?: Record<string, unknown>) => Promise<void>;
    refreshAuth: () => Promise<void>;
    requestPasswordReset: (email: string) => Promise<void>;
    resetPassword: (newPassword: string) => Promise<void>;
    isFavorite: (business_id: number) => boolean;
    toggleFavorite: (business_id: number) => Promise<void>;
}
