import React, { createContext, useState, useEffect, useContext, ReactNode, useCallback } from 'react';
import { AdminUser, AdminPermissions } from '../types.ts';
import { supabase } from '../lib/supabaseClient.ts';
import { useAdminPlatform } from './AdminPlatformContext.tsx';
import { Session, User } from '@supabase/supabase-js';

// Combined Admin User type including Auth data
export interface AuthenticatedAdmin extends AdminUser {
  authUser: User;
}

interface AdminAuthContextType {
  currentUser: AuthenticatedAdmin | null;
  loading: boolean;
  adminUsers: AdminUser[];
  adminLogin: (email: string, pass: string) => Promise<any>;
  adminLogout: () => Promise<any>;
  addAdminUser: (newUser: Omit<AdminUser, 'id' | 'lastLogin' | 'isLocked'>) => Promise<void>;
  updateAdminUser: (userId: number, updates: Partial<AdminUser>) => Promise<void>;
  deleteAdminUser: (userId: number) => Promise<void>;
}

const AdminAuthContext = createContext<AdminAuthContextType | undefined>(undefined);

export const AdminAuthProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [currentUser, setCurrentUser] = useState<AuthenticatedAdmin | null>(null);
  const [adminUsers, setAdminUsers] = useState<AdminUser[]>([]);
  const [loading, setLoading] = useState(true);
  const { logAdminAction } = useAdminPlatform();

  const fetchAdminUsers = useCallback(async () => {
    const { data, error } = await supabase.from('admin_users').select('*').order('id');
    if (error) {
      console.error("Failed to fetch admin users:", error);
      return [];
    }
    return data || [];
  }, []);

  useEffect(() => {
    const checkUser = async (user: User | null) => {
      if (user) {
        // User is logged in via Supabase Auth, check if they are an admin
        const { data: adminProfile, error } = await supabase
          .from('admin_users')
          .select('*')
          .eq('email', user.email)
          .single();
        
        if (adminProfile && !adminProfile.is_locked) {
          // It's a valid, active admin. Combine auth user with admin profile.
          setCurrentUser({ ...adminProfile, authUser: user });
        } else {
          // Logged in, but not a valid admin or is locked.
          if (adminProfile?.is_locked) console.warn("Admin user is locked:", user.email);
          setCurrentUser(null);
          supabase.auth.signOut(); // Log them out from Supabase Auth session
        }
      } else {
        // No user session
        setCurrentUser(null);
      }
      setLoading(false);
    };

    const initialize = async () => {
        const { data: { session } } = await supabase.auth.getSession();
        await checkUser(session?.user ?? null);
        
        // Also fetch the list of all admin users for management purposes
        const users = await fetchAdminUsers();
        setAdminUsers(users);
    };

    initialize();

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
        setLoading(true);
        checkUser(session?.user ?? null);
    });

    return () => {
        subscription.unsubscribe();
    };
  }, [fetchAdminUsers]);

  const adminLogin = async (email: string, pass: string) => {
    const { error } = await supabase.auth.signInWithPassword({ email, password: pass });
    if (error) throw error;
  };

  const adminLogout = async () => {
    const { error } = await supabase.auth.signOut();
    if (error) throw error;
  };

  const addAdminUser = async (newUser: Omit<AdminUser, 'id' | 'lastLogin' | 'isLocked'>) => { /* ... implementation unchanged ... */ };
  const updateAdminUser = async (userId: number, updates: Partial<AdminUser>) => { /* ... implementation unchanged ... */ };
  const deleteAdminUser = async (userId: number) => { /* ... implementation unchanged ... */ };

  return (
    <AdminAuthContext.Provider value={{ currentUser, loading, adminUsers, adminLogin, adminLogout, addAdminUser, updateAdminUser, deleteAdminUser }}>
      {children}
    </AdminAuthContext.Provider>
  );
};

export const useAdminAuth = () => {
  const context = useContext(AdminAuthContext);
  if (!context) {
    throw new Error('useAdminAuth must be used within an AdminAuthProvider');
  }
  return context;
};