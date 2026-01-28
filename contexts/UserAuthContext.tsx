import React, { createContext, useState, useEffect, useContext, ReactNode } from 'react';
import { supabase } from '../lib/supabaseClient.ts';
import { AuthChangeEvent, Session, User } from '@supabase/supabase-js';

interface UserAuthContextType {
  session: Session | null;
  currentUser: User | null;
  loading: boolean;
  login: (email: string, pass: string) => Promise<void>;
  logout: () => Promise<void>;
  requestPasswordReset: (email: string) => Promise<void>;
  resetPassword: (newPass: string) => Promise<void>;
}

const UserAuthContext = createContext<UserAuthContextType | undefined>(undefined);

export const UserAuthProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [session, setSession] = useState<Session | null>(null);
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const getInitialSession = async () => {
      const { data, error } = await supabase.auth.getSession();
      if (error) {
        console.error("Error getting session:", error);
        setLoading(false);
        return;
      }

      const currentSession = data.session;
      setSession(currentSession);
      setUser(currentSession?.user ?? null);
      setLoading(false);
    }

    getInitialSession();

    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (_event: AuthChangeEvent, session: Session | null) => {
        setSession(session);
        setUser(session?.user ?? null);

        // When user clicks the password recovery link, this event fires.
        // The user is now in a temporary session to update their password.
        // The routing from the email link (`/#/reset-password`) will direct them to the correct page.
        if (_event === 'PASSWORD_RECOVERY') {
          if (import.meta.env.MODE === 'development') {
            console.warn("User is in password recovery mode.");
          }
        }
      }
    );

    return () => {
      subscription?.unsubscribe();
    };
  }, []);

  const login = async (email: string, pass: string) => {
    const { error } = await supabase.auth.signInWithPassword({ email, password: pass });
    if (error) throw error;
  };

  const logout = async () => {
    const { error } = await supabase.auth.signOut();
    if (error) throw error;
  };

  const requestPasswordReset = async (email: string): Promise<void> => {
    // This now sends a real email via Supabase's configured email provider (e.g., Resend).
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      // The URL must point to the route in your app that handles password reset.
      // For HashRouter, it needs the '#' prefix.
      redirectTo: `${window.location.origin}/#/reset-password`,
    });

    if (error) {
      console.error("Supabase password reset request error:", error);
      // Do not throw an error to the UI to prevent email enumeration attacks.
      // The UI should show a generic success message regardless of whether the email exists.
    }
  };

  const resetPassword = async (newPass: string): Promise<void> => {
    // This function only works if the user is in a 'PASSWORD_RECOVERY' session,
    // which happens automatically when they click the link from the email.
    const { error } = await supabase.auth.updateUser({ password: newPass });

    if (error) {
      throw error;
    }

    // After a successful password update, it's good practice to sign the user out
    // of the recovery session to force a fresh login.
    await supabase.auth.signOut();
  };

  const value = {
    session,
    currentUser: user,
    loading,
    login,
    logout,
    requestPasswordReset,
    resetPassword,
  };

  return (
    <UserAuthContext.Provider value={value}>
      {!loading && children}
    </UserAuthContext.Provider>
  );
};

export const useUserAuth = () => {
  const context = useContext(UserAuthContext);
  if (context === undefined) {
    throw new Error('useUserAuth must be used within a UserAuthProvider');
  }
  return context;
};
