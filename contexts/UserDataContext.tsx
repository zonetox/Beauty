

import React, { createContext, useState, useEffect, useContext, ReactNode } from 'react';
import { Profile } from '../types.ts';
import { useUserAuth } from './UserAuthContext.tsx';
import { supabase } from '../lib/supabaseClient.ts';

interface UserDataContextType {
  profile: Profile | null;
  loading: boolean;
  updateProfile: (updates: Partial<Profile>) => Promise<void>;
  isFavorite: (business_id: number) => boolean;
  toggleFavorite: (business_id: number) => Promise<void>;
}

const UserDataContext = createContext<UserDataContextType | undefined>(undefined);

export const UserDataProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const { currentUser: user } = useUserAuth();
  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchProfile = async () => {
      if (user) {
        setLoading(true);
        const { data, error } = await supabase
          .from('profiles')
          .select('*')
          .eq('id', user.id)
          .single();
        
        if (error && error.code === 'PGRST116') {
          // Profile doesn't exist, create it
          const { data: newProfile, error: insertError } = await supabase
            .from('profiles')
            .insert({ 
                id: user.id, 
                full_name: user.user_metadata.full_name,
                email: user.email,
            })
            .select()
            .single();

          if (insertError) {
            console.error('Error creating profile:', insertError);
          } else {
            setProfile(newProfile as Profile);
          }
        } else if (error) {
          console.error('Error fetching profile:', error);
        } else {
          setProfile(data as Profile);
        }
        setLoading(false);
      } else {
        // User is logged out
        setProfile(null);
        setLoading(false);
      }
    };

    fetchProfile();
  }, [user]);

  const updateProfile = async (updates: Partial<Profile>) => {
    if (!profile) return;
    
    setLoading(true);
    const { data, error } = await supabase
        .from('profiles')
        .update(updates)
        .eq('id', profile.id)
        .select()
        .single();
        
    if (error) {
        console.error("Error updating profile:", error);
    } else {
        setProfile(data as Profile);
    }
    setLoading(false);
  };
  
  const isFavorite = (business_id: number): boolean => {
    return profile?.favorites?.includes(business_id) ?? false;
  };

  const toggleFavorite = async (business_id: number) => {
    if (!profile) return;

    const currentFavorites = profile.favorites || [];
    const isCurrentlyFavorite = currentFavorites.includes(business_id);

    const newFavorites = isCurrentlyFavorite
      ? currentFavorites.filter(id => id !== business_id)
      : [...currentFavorites, business_id];
    
    await updateProfile({ favorites: newFavorites });
  };
  
  const value = { profile, loading, updateProfile, isFavorite, toggleFavorite };

  return (
    <UserDataContext.Provider value={value}>
      {children}
    </UserDataContext.Provider>
  );
};

export const useUserData = () => {
  const context = useContext(UserDataContext);
  if (!context) {
    throw new Error('useUserData must be used within a UserDataProvider');
  }
  return context;
};
