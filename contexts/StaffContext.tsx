import React, { createContext, useContext, useState, useCallback, ReactNode } from 'react';
import { supabase } from '../lib/supabaseClient.ts';
import { BusinessStaff, StaffMemberRole } from '../types.ts';
import { snakeToCamel } from '../lib/utils.ts';

interface StaffContextType {
  staff: BusinessStaff[];
  loading: boolean;
  error: string | null;
  getStaffByBusinessId: (businessId: number) => Promise<BusinessStaff[]>;
  addStaff: (businessId: number, userId: string, role: StaffMemberRole, permissions: BusinessStaff['permissions']) => Promise<BusinessStaff>;
  updateStaff: (staffId: string, updates: Partial<BusinessStaff>) => Promise<void>;
  removeStaff: (staffId: string) => Promise<void>;
  isStaffMember: (userId: string, businessId: number) => Promise<boolean>;
  getStaffPermissions: (userId: string, businessId: number) => Promise<BusinessStaff['permissions'] | null>;
  refreshStaff: (businessId: number) => Promise<void>;
}

const StaffContext = createContext<StaffContextType | undefined>(undefined);

export const StaffProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [staff, setStaff] = useState<BusinessStaff[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const getStaffByBusinessId = useCallback(async (businessId: number): Promise<BusinessStaff[]> => {
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
        .eq('business_id', businessId)
        .order('created_at', { ascending: false });

      if (fetchError) throw fetchError;

      const staffList = (data || []).map((item: any) => {
        const staff = snakeToCamel(item) as any;
        // Add email from joined profile if available
        if (item.profiles) {
          staff.user_email = Array.isArray(item.profiles) ? item.profiles[0]?.email : item.profiles.email;
          staff.user_name = Array.isArray(item.profiles) ? item.profiles[0]?.full_name : item.profiles.full_name;
        }
        return staff;
      }) as BusinessStaff[];
      
      setStaff(prev => {
        const filtered = prev.filter(s => s.business_id !== businessId);
        return [...filtered, ...staffList];
      });
      return staffList;
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
    businessId: number,
    userId: string,
    role: StaffMemberRole,
    permissions: BusinessStaff['permissions']
  ): Promise<BusinessStaff> => {
    setLoading(true);
    setError(null);
    try {
      const { data, error: insertError } = await supabase
        .from('business_staff')
        .insert({
          business_id: businessId,
          user_id: userId,
          role,
          permissions,
        })
        .select()
        .single();

      if (insertError) throw insertError;

      const newStaff = snakeToCamel(data) as BusinessStaff;
      setStaff(prev => [...prev, newStaff]);
      return newStaff;
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

  const isStaffMember = useCallback(async (userId: string, businessId: number): Promise<boolean> => {
    try {
      const { data, error: fetchError } = await supabase
        .from('business_staff')
        .select('id')
        .eq('user_id', userId)
        .eq('business_id', businessId)
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

  const getStaffPermissions = useCallback(async (userId: string, businessId: number): Promise<BusinessStaff['permissions'] | null> => {
    try {
      const { data, error: fetchError } = await supabase
        .from('business_staff')
        .select('permissions')
        .eq('user_id', userId)
        .eq('business_id', businessId)
        .single();

      if (fetchError && fetchError.code !== 'PGRST116') {
        throw fetchError;
      }

      if (!data) return null;

      return (snakeToCamel(data) as BusinessStaff).permissions;
    } catch (err) {
      console.error('Error fetching staff permissions:', err);
      return null;
    }
  }, []);

  const refreshStaff = useCallback(async (businessId: number): Promise<void> => {
    await getStaffByBusinessId(businessId);
  }, [getStaffByBusinessId]);

  return (
    <StaffContext.Provider
      value={{
        staff,
        loading,
        error,
        getStaffByBusinessId,
        addStaff,
        updateStaff,
        removeStaff,
        isStaffMember,
        getStaffPermissions,
        refreshStaff,
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
