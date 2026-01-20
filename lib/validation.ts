/**
 * Shared validation utilities
 * Common validation functions for forms and data
 */

import { VALIDATION } from '../constants';

// ============================================
// Types
// ============================================

export interface ValidationResult {
  isValid: boolean;
  errors: Record<string, string>;
}

export type Validator<T> = (value: T) => string | null;

// ============================================
// Common Validators
// ============================================

/**
 * Validates that a value is not empty
 */
export function required(value: string | null | undefined): string | null {
  if (!value || value.trim().length === 0) {
    return 'This field is required';
  }
  return null;
}

/**
 * Validates email format
 */
export function email(value: string | null | undefined): string | null {
  if (!value) return null; // Allow empty if not required
  
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(value)) {
    return 'Please enter a valid email address';
  }
  return null;
}

/**
 * Validates URL format
 */
export function url(value: string | null | undefined): string | null {
  if (!value) return null; // Allow empty if not required
  
  try {
    new URL(value);
    return null;
  } catch {
    return 'Please enter a valid URL';
  }
}

/**
 * Validates minimum length
 */
export function minLength(min: number): Validator<string> {
  return (value: string | null | undefined): string | null => {
    if (!value) return null; // Allow empty if not required
    
    if (value.length < min) {
      return `Must be at least ${min} characters`;
    }
    return null;
  };
}

/**
 * Validates maximum length
 */
export function maxLength(max: number): Validator<string> {
  return (value: string | null | undefined): string | null => {
    if (!value) return null; // Allow empty if not required
    
    if (value.length > max) {
      return `Must be no more than ${max} characters`;
    }
    return null;
  };
}

/**
 * Validates that a number is within a range
 */
export function numberRange(min: number, max: number): Validator<number> {
  return (value: number | null | undefined): string | null => {
    if (value === null || value === undefined) return null;
    
    if (value < min || value > max) {
      return `Must be between ${min} and ${max}`;
    }
    return null;
  };
}

/**
 * Validates that a value matches a pattern
 */
export function pattern(regex: RegExp, message: string): Validator<string> {
  return (value: string | null | undefined): string | null => {
    if (!value) return null; // Allow empty if not required
    
    if (!regex.test(value)) {
      return message;
    }
    return null;
  };
}

// ============================================
// Validation Helpers
// ============================================

/**
 * Combines multiple validators
 */
export function combineValidators<T>(
  ...validators: Array<Validator<T>>
): Validator<T> {
  return (value: T): string | null => {
    for (const validator of validators) {
      const error = validator(value);
      if (error) {
        return error;
      }
    }
    return null;
  };
}

/**
 * Validates an object with a schema
 */
export function validateObject<T extends Record<string, unknown>>(
  data: T,
  schema: Record<keyof T, Array<Validator<unknown>>>
): ValidationResult {
  const errors: Record<string, string> = {};

  for (const [key, validators] of Object.entries(schema)) {
    const value = data[key];
    
    for (const validator of validators) {
      const error = validator(value);
      if (error) {
        errors[key] = error;
        break; // Stop at first error for this field
      }
    }
  }

  return {
    isValid: Object.keys(errors).length === 0,
    errors,
  };
}

/**
 * Validates a form field with multiple validators
 */
export function validateField<T>(
  value: T,
  validators: Array<Validator<T>>
): string | null {
  for (const validator of validators) {
    const error = validator(value);
    if (error) {
      return error;
    }
  }
  return null;
}

// ============================================
// Pre-configured Validators
// ============================================

export const validators = {
  required,
  email: combineValidators(required, email),
  url: combineValidators(required, url),
  password: combineValidators(
    required,
    minLength(VALIDATION.MIN_PASSWORD_LENGTH)
  ),
  title: combineValidators(
    required,
    maxLength(VALIDATION.MAX_TITLE_LENGTH)
  ),
  description: combineValidators(
    required,
    maxLength(VALIDATION.MAX_DESCRIPTION_LENGTH)
  ),
  excerpt: combineValidators(
    required,
    maxLength(VALIDATION.MAX_EXCERPT_LENGTH)
  ),
};
