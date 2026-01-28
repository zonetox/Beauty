import React, { createContext, useContext, useState, useCallback, ReactNode } from 'react';
import { supabase } from '../lib/supabaseClient.ts';
import { BusinessStaff, StaffMemberRole } from '../types.ts';


interface StaffContextType {
  staff: BusinessStaff[];
  loading: boolean;
  error: string | null;
  get_staff_by_business_id: (business_id: number) => Promise<BusinessStaff[]>;
  addStaff: (business_id: number, user_id: string, role: StaffMemberRole, permissions: BusinessStaff['permissions']) => Promise<BusinessStaff>;
  updateStaff: (staffId: string, updates: Partial<BusinessStaff>) => Promise<void>;
  removeStaff: (staffId: string) => Promise<void>;
  is_staff_member: (user_id: string, business_id: number) => Promise<boolean>;
  getStaffPermissions: (user_id: string, business_id: number) => Promise<BusinessStaff['permissions'] | null>;
  refresh_staff: (business_id: number) => Promise<void>;
}

const StaffContext = createContext<StaffContextType | undefined>(undefined);

export const StaffProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [staff, setStaff] = useState<BusinessStaff[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const get_staff_by_business_id = useCallback(async (business_id: number): Promise<BusinessStaff[]> => {
    setLoading(true);
    setError(null);
    try {
      // Join with profiles to get user email
      const { data, error: fetchError } = await supabase
        .from('business_staff')
        .select(`
          *,
          profiles:user_id (
            email,
            full_name
          )
        `)
        .eq('business_id', business_id)
        .order('created_at', { ascending: false });

      if (fetchError) throw fetchError;

      const staff_list = (data || []).map((item: any) => {
        const staff: BusinessStaff = {
          id: item.id,
          business_id: item.business_id,
          user_id: item.user_id,
          role: item.role,
          permissions: item.permissions,
          created_at: item.created_at,
          updated_at: item.updated_at,
          user_email: item.profiles?.email,
          user_name: item.profiles?.full_name
        };
        return staff;
      });

      setStaff(prev => {
        const filtered = prev.filter(s => s.business_id !== business_id); // Keep staff from other businesses
        return [...filtered, ...staff_list]; // Add new staff for this business
      });
      return staff_list;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to fetch staff';
      setError(errorMessage);
      console.error('Error fetching staff:', err);
      return [];
    } finally {
      setLoading(false);
    }
  }, []);

  const addStaff = useCallback(async (
    business_id: number,
    user_id: string,
    role: StaffMemberRole,
    permissions: BusinessStaff['permissions']
  ): Promise<BusinessStaff> => {
    setLoading(true);
    setError(null);
    try {
      const { data, error: insertError } = await supabase
        .from('business_staff')
        .insert({
          business_id: business_id,
          user_id: user_id,
          role,
          permissions,
        })
        .select()
        .single();

      if (insertError) throw insertError;

      const new_staff = data as unknown as BusinessStaff;
      setStaff(prev => [...prev, new_staff]);
      return new_staff;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to add staff';
      setError(errorMessage);
      console.error('Error adding staff:', err);
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  const updateStaff = useCallback(async (staffId: string, updates: Partial<BusinessStaff>): Promise<void> => {
    setLoading(true);
    setError(null);
    try {
      const { error: updateError } = await supabase
        .from('business_staff')
        .update({
          role: updates.role,
          permissions: updates.permissions,
          updated_at: new Date().toISOString(),
        })
        .eq('id', staffId);

      if (updateError) throw updateError;

      setStaff(prev => prev.map(s => s.id === staffId ? { ...s, ...updates } : s));
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to update staff';
      setError(errorMessage);
      console.error('Error updating staff:', err);
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  const removeStaff = useCallback(async (staffId: string): Promise<void> => {
    setLoading(true);
    setError(null);
    try {
      const { error: deleteError } = await supabase
        .from('business_staff')
        .delete()
        .eq('id', staffId);

      if (deleteError) throw deleteError;

      setStaff(prev => prev.filter(s => s.id !== staffId));
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to remove staff';
      setError(errorMessage);
      console.error('Error removing staff:', err);
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  const is_staff_member = useCallback(async (user_id: string, business_id: number): Promise<boolean> => {
    try {
      const { data, error: fetchError } = await supabase
        .from('business_staff')
        .select('id')
        .eq('user_id', user_id)
        .eq('business_id', business_id)
        .single();

      if (fetchError && fetchError.code !== 'PGRST116') { // PGRST116 = no rows returned
        throw fetchError;
      }

      return !!data;
    } catch (err) {
      console.error('Error checking staff membership:', err);
      return false;
    }
  }, []);

  const getStaffPermissions = useCallback(async (user_id: string, business_id: number): Promise<BusinessStaff['permissions'] | null> => {
    try {
      const { data, error: fetchError } = await supabase
        .from('business_staff')
        .select('permissions')
        .eq('user_id', user_id)
        .eq('business_id', business_id)
        .single();

      if (fetchError && fetchError.code !== 'PGRST116') {
        throw fetchError;
      }

      if (!data) return null;
      return data.permissions;
    } catch (err) {
      console.error('Error fetching staff permissions:', err);
      return null;
    }
  }, []);

  const refresh_staff = useCallback(async (business_id: number): Promise<void> => {
    await get_staff_by_business_id(business_id);
  }, [get_staff_by_business_id]);

  return (
    <StaffContext.Provider
      value={{
        staff,
        loading,
        error,
        get_staff_by_business_id,
        addStaff,
        updateStaff,
        removeStaff,
        is_staff_member,
        getStaffPermissions,
        refresh_staff,
      }}
    >
      {children}
    </StaffContext.Provider>
  );
};

export const useStaff = () => {
  const context = useContext(StaffContext);
  if (!context) {
    throw new Error('useStaff must be used within a StaffProvider');
  }
  return context;
};
