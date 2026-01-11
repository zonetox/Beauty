// PHASE 2: Error Handling Standardization
// React hook for standardized error handling in frontend

import toast from 'react-hot-toast';
import { handleSupabaseError, getUserFriendlyMessage, StandardError } from './errorHandler';

/**
 * React hook for standardized error handling
 * Provides consistent error handling and toast notifications
 */
export function useErrorHandler() {
  /**
   * Handle and display an error
   * @param error - The error to handle (can be any error format)
   * @param context - Optional context for logging (e.g., function name)
   * @param showToast - Whether to show toast notification (default: true)
   * @returns Standardized error object
   */
  const handleError = (
    error: any,
    context?: string,
    showToast: boolean = true
  ): StandardError => {
    // Standardize the error
    const standardError = handleSupabaseError(error);
    
    // Log error for debugging
    if (context) {
      console.error(`Error in ${context}:`, standardError);
    } else {
      console.error('Error:', standardError);
    }
    
    // Show user-friendly toast notification
    if (showToast) {
      const userMessage = getUserFriendlyMessage(standardError);
      toast.error(userMessage);
    }
    
    return standardError;
  };

  /**
   * Handle Edge Function error response
   * Edge Functions return { error: string, code?: string, statusCode?: number }
   * @param errorResponse - The error response from Edge Function
   * @param context - Optional context for logging
   * @param showToast - Whether to show toast notification (default: true)
   */
  const handleEdgeFunctionError = (
    errorResponse: any,
    context?: string,
    showToast: boolean = true
  ): StandardError => {
    // Edge Functions return error in { error: string, code?: string } format
    const standardError: StandardError = {
      error: errorResponse?.error || errorResponse?.message || 'An error occurred',
      code: errorResponse?.code,
      statusCode: errorResponse?.statusCode || errorResponse?.status,
    };
    
    // Log error for debugging
    if (context) {
      console.error(`Edge Function error in ${context}:`, standardError);
    } else {
      console.error('Edge Function error:', standardError);
    }
    
    // Show user-friendly toast notification
    if (showToast) {
      const userMessage = getUserFriendlyMessage(standardError);
      toast.error(userMessage);
    }
    
    return standardError;
  };

  return {
    handleError,
    handleEdgeFunctionError,
  };
}
