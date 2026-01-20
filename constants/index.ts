/**
 * Application-wide constants
 * Centralized location for all magic strings, numbers, and configuration values
 */

// ============================================
// API & Service Constants
// ============================================

export const API_TIMEOUTS = {
  BUSINESSES: 10000,  // 10 seconds
  BLOG: 10000,        // 10 seconds
  MARKERS: 12000,     // 12 seconds
  PACKAGES: 8000,     // 8 seconds
  HOMEPAGE: 8000,     // 8 seconds
} as const;

// ============================================
// Cache Keys
// ============================================

export const CACHE_KEYS = {
  BLOG_POSTS: 'blog_posts',
  BLOG_CATEGORIES: 'blog_categories',
  MARKERS: 'business_markers',
  PACKAGES: 'membership_packages',
  HOMEPAGE_CONTENT: 'homepage_content',
} as const;

// ============================================
// Cache TTL (Time To Live) in milliseconds
// ============================================

export const CACHE_TTL = {
  BLOG_POSTS: 10 * 60 * 1000,      // 10 minutes
  BLOG_CATEGORIES: 30 * 60 * 1000, // 30 minutes
  MARKERS: 60 * 60 * 1000,         // 1 hour
  PACKAGES: 30 * 60 * 1000,        // 30 minutes
  HOMEPAGE_CONTENT: 5 * 60 * 1000, // 5 minutes
} as const;

// ============================================
// Pagination Constants
// ============================================

export const PAGINATION = {
  DEFAULT_PAGE_SIZE: 20,
  MAX_PAGE_SIZE: 100,
} as const;

// ============================================
// Toast Messages
// ============================================

export const TOAST_MESSAGES = {
  SUCCESS: {
    SAVED: 'Saved successfully',
    DELETED: 'Deleted successfully',
    UPDATED: 'Updated successfully',
    CREATED: 'Created successfully',
    UPLOADED: 'Uploaded successfully',
  },
  ERROR: {
    GENERIC: 'An error occurred. Please try again.',
    NETWORK: 'Network error. Please check your connection.',
    VALIDATION: 'Please fix the errors in the form',
    UNAUTHORIZED: 'You are not authorized to perform this action',
    NOT_FOUND: 'Resource not found',
  },
} as const;

// ============================================
// Form Validation
// ============================================

export const VALIDATION = {
  MIN_PASSWORD_LENGTH: 8,
  MAX_TITLE_LENGTH: 200,
  MAX_DESCRIPTION_LENGTH: 5000,
  MAX_EXCERPT_LENGTH: 500,
} as const;

// ============================================
// Status Values
// ============================================

export const STATUS = {
  PUBLISHED: 'Published',
  DRAFT: 'Draft',
  VISIBLE: 'Visible',
  HIDDEN: 'Hidden',
  ACTIVE: 'Active',
  INACTIVE: 'Inactive',
} as const;

// ============================================
// Error Messages
// ============================================

export const ERROR_MESSAGES = {
  PREVIEW_MODE: 'Preview Mode: This action is not available.',
  SUPABASE_NOT_CONFIGURED: 'Supabase is not configured',
  REQUIRED_FIELD: 'This field is required',
  INVALID_EMAIL: 'Please enter a valid email address',
  INVALID_URL: 'Please enter a valid URL',
} as const;
