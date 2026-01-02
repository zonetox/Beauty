/**
 * utility functions for the application
 */

import { PostgrestResponse } from '@supabase/supabase-js';

/**
 * Recursively converts snake_case keys of an object to camelCase.
 */
export const snakeToCamel = (obj: any): any => {
    if (obj === null || typeof obj !== 'object') {
        return obj;
    }

    if (Array.isArray(obj)) {
        return obj.map(v => snakeToCamel(v));
    }

    return Object.keys(obj).reduce((result, key) => {
        const camelKey = key.replace(/([-_][a-z])/ig, ($1) => {
            return $1.toUpperCase()
                .replace('-', '')
                .replace('_', '');
        });

        // Prevent prototype pollution or processing internal properties if any
        if (key === '__proto__' || key === 'constructor' || key === 'prototype') {
            return result;
        }

        result[camelKey] = snakeToCamel(obj[key]);
        return result;
    }, {} as any);
};

/**
 * Maps a Supabase PostgrestResponse by converting data keys to camelCase.
 */
export const mapPostgrestResponse = <T>(response: PostgrestResponse<any>): { data: T[] | null; error: any } => {
    return {
        data: response.data ? snakeToCamel(response.data) as T[] : null,
        error: response.error
    };
};

/**
 * Specialized mapper for a single object response
 */
export const mapSingleResponse = <T>(response: { data: any; error: any }): { data: T | null; error: any } => {
    return {
        data: response.data ? snakeToCamel(response.data) as T : null,
        error: response.error
    };
};
