/**
 * utility functions for the application
 */

import { PostgrestResponse } from '@supabase/supabase-js';

/**
 * Recursively converts snake_case keys of an object to camelCase.
 * @template T - The type of the input object
 * @param obj - The object to convert
 * @returns The object with camelCase keys
 */
export function snakeToCamel(obj: unknown): any {
    if (obj === null || typeof obj !== 'object') {
        return obj;
    }

    if (Array.isArray(obj)) {
        return obj.map(v => snakeToCamel(v));
    }

    return Object.keys(obj as Record<string, unknown>).reduce((result, key) => {
        const camelKey = key.replace(/([-_][a-z])/ig, ($1) => {
            return $1.toUpperCase()
                .replace('-', '')
                .replace('_', '');
        });

        // Prevent prototype pollution or processing internal properties if any
        if (key === '__proto__' || key === 'constructor' || key === 'prototype') {
            return result;
        }

        const value = (obj as Record<string, unknown>)[key];
        (result as Record<string, unknown>)[camelKey] = snakeToCamel(value);
        return result;
    }, {} as any);
}

/**
 * Helper to convert and assert the result to a specific type.
 * Use this when you want a typed return from a PostgREST response.
 */
export function snakeToCamelAs<T>(obj: unknown): T {
    return (snakeToCamel(obj) as unknown) as T;
}

/**
 * Maps a Supabase PostgrestResponse by converting data keys to camelCase.
 * @template T - The type of the data array elements
 * @param response - The Supabase PostgrestResponse
 * @returns An object with camelCase data and error
 */
export function mapPostgrestResponse<T>(
    response: PostgrestResponse<unknown>
): { data: T[] | null; error: unknown } {
    return {
        data: response.data ? ((snakeToCamel(response.data) as unknown) as T[]) : null,
        error: response.error
    };
}

/**
 * Specialized mapper for a single object response
 * @template T - The type of the data object
 * @param response - The response object with data and error
 * @returns An object with camelCase data and error
 */
export function mapSingleResponse<T>(
    response: { data: unknown; error: unknown }
): { data: T | null; error: unknown } {
    return {
        data: response.data ? ((snakeToCamel(response.data) as unknown) as T) : null,
        error: response.error
    };
}

/**
 * Recursively converts camelCase keys of an object to snake_case.
 * @template T - The type of the input object
 * @param obj - The object to convert
 * @returns The object with snake_case keys
 */
export function toSnakeCase<T>(obj: T): T {
    if (obj === null || typeof obj !== 'object') {
        return obj;
    }

    if (obj instanceof Date) {
        return obj as unknown as T;
    }

    if (Array.isArray(obj)) {
        return obj.map(toSnakeCase) as unknown as T;
    }

    return Object.keys(obj as object).reduce((result, key) => {
        const snakeKey = key.replace(/[A-Z]/g, $1 => `_${$1.toLowerCase()}`);

        // Prevent prototype pollution
        if (key === '__proto__' || key === 'constructor' || key === 'prototype') {
            return result;
        }

        const value = (obj as Record<string, unknown>)[key];
        (result as Record<string, unknown>)[snakeKey] = toSnakeCase(value);
        return result;
    }, {} as any);
}
