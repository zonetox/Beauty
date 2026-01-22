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
export function snakeToCamel(obj: unknown): unknown {
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
    }, {} as Record<string, unknown>);
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
