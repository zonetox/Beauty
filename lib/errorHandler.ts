// PHASE 2: Error Handling Standardization
// Standardized error handling utility for frontend and Edge Functions

/**
 * Standardized error response format
 */
export interface StandardError {
  error: string;
  code?: string;
  statusCode?: number;
  details?: any;
}

/**
 * Common error codes used across the application
 */
export enum ErrorCode {
  // Client errors (4xx)
  BAD_REQUEST = 'BAD_REQUEST',
  UNAUTHORIZED = 'UNAUTHORIZED',
  FORBIDDEN = 'FORBIDDEN',
  NOT_FOUND = 'NOT_FOUND',
  VALIDATION_ERROR = 'VALIDATION_ERROR',
  
  // Server errors (5xx)
  INTERNAL_ERROR = 'INTERNAL_ERROR',
  SERVICE_UNAVAILABLE = 'SERVICE_UNAVAILABLE',
}

/**
 * Standardized error handler for Supabase errors
 * Maps Supabase error codes to standardized error format
 */
export function handleSupabaseError(error: any): StandardError {
  // If error is already in StandardError format, return as-is
  if (error && typeof error === 'object' && 'error' in error && 'code' in error) {
    return error as StandardError;
  }

  // Extract error message
  const message = error?.message || error?.error || 'An error occurred';
  
  // Map Supabase error codes
  let code: string = ErrorCode.INTERNAL_ERROR;
  let statusCode: number = 500;
  
  if (error?.code) {
    switch (error.code) {
      case 'PGRST116':
        code = ErrorCode.NOT_FOUND;
        statusCode = 404;
        break;
      case 'PGRST301':
      case 'PGRST302':
        code = ErrorCode.BAD_REQUEST;
        statusCode = 400;
        break;
      case '42501':
        code = ErrorCode.FORBIDDEN;
        statusCode = 403;
        break;
      default:
        code = ErrorCode.INTERNAL_ERROR;
        statusCode = 500;
    }
  }
  
  // Check for HTTP status in error response
  if (error?.status) {
    statusCode = error.status;
  }
  
  // Map HTTP status codes to error codes
  if (statusCode >= 400 && statusCode < 500) {
    if (statusCode === 401) code = ErrorCode.UNAUTHORIZED;
    else if (statusCode === 403) code = ErrorCode.FORBIDDEN;
    else if (statusCode === 404) code = ErrorCode.NOT_FOUND;
    else if (statusCode === 400) code = ErrorCode.BAD_REQUEST;
  } else if (statusCode >= 500) {
    code = ErrorCode.INTERNAL_ERROR;
  }
  
  return {
    error: message,
    code,
    statusCode,
    details: error?.details || error?.hint || undefined,
  };
}

/**
 * Create a standardized error response for Edge Functions
 * Use this in Edge Functions to ensure consistent error format
 */
export function createErrorResponse(
  message: string,
  statusCode: number = 400,
  code?: string,
  details?: any
): Response {
  const errorResponse: StandardError = {
    error: message,
    statusCode,
    code: code || getErrorCodeFromStatusCode(statusCode),
    details,
  };
  
  return new Response(JSON.stringify(errorResponse), {
    status: statusCode,
    headers: {
      'Content-Type': 'application/json',
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
    },
  });
}

/**
 * Get error code from HTTP status code
 */
function getErrorCodeFromStatusCode(statusCode: number): string {
  if (statusCode === 400) return ErrorCode.BAD_REQUEST;
  if (statusCode === 401) return ErrorCode.UNAUTHORIZED;
  if (statusCode === 403) return ErrorCode.FORBIDDEN;
  if (statusCode === 404) return ErrorCode.NOT_FOUND;
  if (statusCode >= 500) return ErrorCode.INTERNAL_ERROR;
  return ErrorCode.INTERNAL_ERROR;
}

/**
 * User-friendly error messages
 * Maps error codes to user-friendly messages
 */
const USER_FRIENDLY_MESSAGES: Record<string, string> = {
  [ErrorCode.BAD_REQUEST]: 'Invalid request. Please check your input and try again.',
  [ErrorCode.UNAUTHORIZED]: 'You are not authorized to perform this action. Please log in.',
  [ErrorCode.FORBIDDEN]: 'You do not have permission to perform this action.',
  [ErrorCode.NOT_FOUND]: 'The requested resource was not found.',
  [ErrorCode.VALIDATION_ERROR]: 'Please check your input and try again.',
  [ErrorCode.INTERNAL_ERROR]: 'An unexpected error occurred. Please try again later.',
  [ErrorCode.SERVICE_UNAVAILABLE]: 'Service is temporarily unavailable. Please try again later.',
};

/**
 * Get user-friendly error message
 */
export function getUserFriendlyMessage(error: StandardError | any): string {
  const standardError = 'error' in error ? error : handleSupabaseError(error);
  
  // Prefer user-friendly message, fallback to original message
  if (standardError.code && USER_FRIENDLY_MESSAGES[standardError.code]) {
    return USER_FRIENDLY_MESSAGES[standardError.code];
  }
  
  return standardError.error || 'An error occurred';
}
