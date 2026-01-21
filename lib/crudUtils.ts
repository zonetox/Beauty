/**
 * Shared CRUD utilities
 * Common patterns for Create, Read, Update, Delete operations
 */

import { SupabaseClient } from '@supabase/supabase-js';
import toast from 'react-hot-toast';
import { handleSupabaseError, getUserFriendlyMessage } from './errorHandler';
import { TOAST_MESSAGES } from '../constants';

// ============================================
// Types
// ============================================

export interface CrudOptions<T> {
  tableName: string;
  supabase: SupabaseClient;
  onSuccess?: (data: T) => void;
  onError?: (error: Error) => void;
  successMessage?: string;
  errorMessage?: string;
}

export interface CreateOptions<T> extends CrudOptions<T> {
  data: Omit<T, 'id'>;
}

export interface UpdateOptions<T> extends CrudOptions<T> {
  id: string | number;
  data: Partial<T>;
}

export interface DeleteOptions extends Omit<CrudOptions<unknown>, 'onSuccess'> {
  id: string | number;
  onSuccess?: () => void;
}

// ============================================
// Generic CRUD Functions
// ============================================

/**
 * Create a new record in the database
 * @template T - The type of the record
 */
export async function createRecord<T extends { id: string | number }>(
  options: CreateOptions<T>
): Promise<T | null> {
  const {
    tableName,
    supabase,
    data,
    onSuccess,
    onError,
    successMessage = TOAST_MESSAGES.SUCCESS.CREATED,
    errorMessage,
  } = options;

  try {
    const { data: result, error } = await supabase
      .from(tableName)
      .insert(data)
      .select()
      .single();

    if (error) {
      throw handleSupabaseError(error);
    }

    if (result) {
      toast.success(successMessage);
      onSuccess?.(result as T);
      return result as T;
    }

    return null;
  } catch (error) {
    const standardError = error instanceof Error
      ? handleSupabaseError(error)
      : handleSupabaseError(new Error(String(error)));

    const message = errorMessage || getUserFriendlyMessage(standardError);
    toast.error(message);
    onError?.(error instanceof Error ? error : new Error(String(error)));
    return null;
  }
}

/**
 * Update an existing record in the database
 * @template T - The type of the record
 */
export async function updateRecord<T extends { id: string | number }>(
  options: UpdateOptions<T>
): Promise<T | null> {
  const {
    tableName,
    supabase,
    id,
    data,
    onSuccess,
    onError,
    successMessage = TOAST_MESSAGES.SUCCESS.UPDATED,
    errorMessage,
  } = options;

  try {
    const { data: result, error } = await supabase
      .from(tableName)
      .update(data)
      .eq('id', id)
      .select()
      .single();

    if (error) {
      throw handleSupabaseError(error);
    }

    if (result) {
      toast.success(successMessage);
      onSuccess?.(result as T);
      return result as T;
    }

    return null;
  } catch (error) {
    const standardError = error instanceof Error
      ? handleSupabaseError(error)
      : handleSupabaseError(new Error(String(error)));

    const message = errorMessage || getUserFriendlyMessage(standardError);
    toast.error(message);
    onError?.(error instanceof Error ? error : new Error(String(error)));
    return null;
  }
}

/**
 * Delete a record from the database
 */
export async function deleteRecord(
  options: DeleteOptions
): Promise<boolean> {
  const {
    tableName,
    supabase,
    id,
    onSuccess,
    onError,
    successMessage = TOAST_MESSAGES.SUCCESS.DELETED,
    errorMessage,
  } = options;

  try {
    const { error } = await supabase
      .from(tableName)
      .delete()
      .eq('id', id);

    if (error) {
      throw handleSupabaseError(error);
    }

    toast.success(successMessage);
    onSuccess?.();
    return true;
  } catch (error) {
    const standardError = error instanceof Error
      ? handleSupabaseError(error)
      : handleSupabaseError(new Error(String(error)));

    const message = errorMessage || getUserFriendlyMessage(standardError);
    toast.error(message);
    onError?.(error instanceof Error ? error : new Error(String(error)));
    return false;
  }
}

/**
 * Fetch a single record by ID
 * @template T - The type of the record
 */
export async function fetchRecordById<T>(
  tableName: string,
  id: string | number,
  supabase: SupabaseClient
): Promise<T | null> {
  try {
    const { data, error } = await supabase
      .from(tableName)
      .select('*')
      .eq('id', id)
      .single();

    if (error) {
      throw handleSupabaseError(error);
    }

    return data as T | null;
  } catch (error) {
    console.error(`Error fetching ${tableName} by id:`, error);
    return null;
  }
}

/**
 * Fetch multiple records with optional filters
 * @template T - The type of the records
 */
export async function fetchRecords<T>(
  tableName: string,
  supabase: SupabaseClient,
  filters?: Record<string, unknown>,
  orderBy?: { column: string; ascending?: boolean },
  limit?: number
): Promise<T[]> {
  try {
    let query = supabase.from(tableName).select('*');

    // Apply filters
    if (filters) {
      Object.entries(filters).forEach(([key, value]) => {
        if (value !== undefined && value !== null) {
          query = query.eq(key, value);
        }
      });
    }

    // Apply ordering
    if (orderBy) {
      query = query.order(orderBy.column, { ascending: orderBy.ascending ?? true });
    }

    // Apply limit
    if (limit) {
      query = query.limit(limit);
    }

    const { data, error } = await query;

    if (error) {
      throw handleSupabaseError(error);
    }

    return (data || []) as T[];
  } catch (error) {
    console.error(`Error fetching ${tableName}:`, error);
    return [];
  }
}
