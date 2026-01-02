/**
 * utility functions for the application
 */

import { PostgrestResponse } from '@supabase/supabase-js';

/**
 * Recursively converts snake_case keys of an object to camelCase.
 */
export const snakeToCamel = (obj: any): any => {
    if (Array.isArray(obj)) {
        return obj.map(v => snakeToCamel(v));
    } else if (obj !== null && obj.constructor === Object) {
        return Object.keys(obj).reduce(
            (result, key) => {
                const camelKey = key.replace(/([-_][a-z])/ig, ($1) => {
                    return $1.toUpperCase()
                        .replace('-', '')
                        .replace('_', '');
                });
                result[camelKey] = snakeToCamel(obj[key]);
                return result;
            },
            {} as any
        );
    }
    return obj;
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
