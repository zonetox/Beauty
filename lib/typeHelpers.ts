/**
 * Type Safety Helper Functions
 * Used for safe null/undefined access and type assertions
 */

/**
 * Safely access nested object properties with default values
 * @example const value = safelyAccess(user, 'profile.name', 'Unknown')
 */
export const safelyAccess = <T,>(obj: Record<string, unknown> | null | undefined, key: string, defaultValue: T): T => {
  if (!obj) return defaultValue;
  const keys = key.split('.');
  let result: unknown = obj;
  
  for (const k of keys) {
    result = result && typeof result === 'object' ? (result as Record<string, unknown>)?.[k] : undefined;
    if (result === undefined) return defaultValue;
  }
  
  return (result ?? defaultValue) as T;
};

/**
 * Ensure array exists (returns empty array if undefined/null)
 * @example const items = ensureArray(data.items)
 */
export const ensureArray = <T,>(arr: T[] | undefined | null): T[] => {
  return arr ?? [];
};

/**
 * Ensure string exists (returns empty string or fallback if undefined/null)
 * @example const name = ensureString(user.name, 'Unknown')
 */
export const ensureString = (str: string | undefined | null, fallback = ''): string => {
  return (str ?? fallback).toString();
};

/**
 * Ensure number exists (returns 0 or fallback if undefined/null)
 * @example const count = ensureNumber(data.count, 0)
 */
export const ensureNumber = (num: number | undefined | null, fallback = 0): number => {
  return num ?? fallback;
};

/**
 * Ensure object exists (returns empty object if undefined/null)
 * @example const obj = ensureObject(data)
 */
export const ensureObject = <T extends Record<string, unknown>>(obj: T | undefined | null): T => {
  return obj ?? ({} as T);
};

/**
 * Safe index access for objects/records
 * @example const value = safeIndex(record, 'key', 'default')
 */
export const safeIndex = <T,>(
  obj: Record<string, T> | undefined,
  key: string,
  defaultValue: T
): T => {
  return obj?.[key] ?? defaultValue;
};

/**
 * Check if value exists and is valid
 */
export const isValid = <T,>(value: T | undefined | null): value is T => {
  return value !== undefined && value !== null;
};

/**
 * Type guard for object with specific property
 */
export const hasProperty = <T extends Record<string, unknown>, K extends string>(
  obj: T,
  key: K
): obj is T & Record<K, unknown> => {
  return key in obj && obj[key] !== undefined;
};

/**
 * Safely get array element or default
 */
export const getArrayElement = <T,>(arr: T[] | undefined, index: number, defaultValue?: T): T | undefined => {
  if (!arr || index < 0 || index >= arr.length) return defaultValue;
  return arr[index];
};

/**
 * Filter out undefined/null values from array
 */
export const filterValid = <T,>(arr: (T | undefined | null)[]): T[] => {
  return arr.filter((item): item is T => item !== undefined && item !== null);
};

/**
 * Map with fallback for undefined values
 */
export const mapWithFallback = <T, U>(
  arr: (T | undefined)[],
  mapper: (item: T) => U,
  fallback: U
): U[] => {
  return arr.map(item => item !== undefined ? mapper(item) : fallback);
};
