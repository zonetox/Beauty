// PHASE 2: Error Handling Standardization
// Standardized error handling utility for frontend and Edge Functions

/**
 * Standardized error response format
 */
export interface StandardError {
  error: string;
  code?: string;
  statusCode?: number;
  details?: unknown;
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
 * Type guard to check if error is in StandardError format
 */
function isStandardError(error: unknown): error is StandardError {
  return (
    typeof error === 'object' &&
    error !== null &&
    'error' in error &&
    'code' in error
  );
}

/**
 * Type guard to check if error has a message property
 */
function hasMessage(error: unknown): error is { message: string } {
  return (
    typeof error === 'object' &&
    error !== null &&
    'message' in error &&
    typeof (error as { message: unknown }).message === 'string'
  );
}

/**
 * Type guard to check if error has a code property
 */
function hasCode(error: unknown): error is { code: string } {
  return (
    typeof error === 'object' &&
    error !== null &&
    'code' in error &&
    typeof (error as { code: unknown }).code === 'string'
  );
}

/**
 * Type guard to check if error has a status property
 */
function hasStatus(error: unknown): error is { status: number } {
  return (
    typeof error === 'object' &&
    error !== null &&
    'status' in error &&
    typeof (error as { status: unknown }).status === 'number'
  );
}

/**
 * Standardized error handler for Supabase errors
 * Maps Supabase error codes to standardized error format
 */
export function handleSupabaseError(error: unknown): StandardError {
  // If error is already in StandardError format, return as-is
  if (isStandardError(error)) {
    return error;
  }

  // Extract error message
  const message = hasMessage(error) 
    ? error.message 
    : (typeof error === 'string' ? error : 'An error occurred');
  
  // Map Supabase error codes
  let code: string = ErrorCode.INTERNAL_ERROR;
  let statusCode: number = 500;
  
  if (hasCode(error)) {
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
  if (hasStatus(error)) {
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
  
  // Extract details if available
  const details = 
    typeof error === 'object' && 
    error !== null && 
    'details' in error 
      ? (error as { details: unknown }).details
      : (typeof error === 'object' && 
         error !== null && 
         'hint' in error 
           ? (error as { hint: unknown }).hint
           : undefined);

  return {
    error: message,
    code,
    statusCode,
    details,
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
  details?: unknown
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
export function getUserFriendlyMessage(error: StandardError | unknown): string {
  const standardError = isStandardError(error) ? error : handleSupabaseError(error);
  
  // Prefer user-friendly message, fallback to original message
  if (standardError.code && USER_FRIENDLY_MESSAGES[standardError.code]) {
    return USER_FRIENDLY_MESSAGES[standardError.code];
  }
  
  return standardError.error || 'An error occurred';
}

/**
 * Async operation wrapper with error handling and retry logic
 */
export async function withErrorHandling<T>(
  operation: () => Promise<T>,
  options?: {
    retries?: number;
    retryDelay?: number;
    onError?: (error: Error) => void;
  }
): Promise<T | null> {
  const { retries = 0, retryDelay = 1000, onError } = options || {};
  let lastError: Error | null = null;

  for (let attempt = 0; attempt <= retries; attempt++) {
    try {
      return await operation();
    } catch (error) {
      lastError = error instanceof Error ? error : new Error(String(error));
      
      if (attempt < retries) {
        // Wait before retrying
        await new Promise(resolve => setTimeout(resolve, retryDelay * (attempt + 1)));
        continue;
      }
      
      // All retries exhausted
      onError?.(lastError);
      return null;
    }
  }

  return null;
}
