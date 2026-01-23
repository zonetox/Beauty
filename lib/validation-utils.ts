import { z } from 'zod';

/**
 * Validates data against a Zod schema at runtime.
 * Use this when fetching data from external sources (API, Database, etc.)
 * to ensure it matches the expected type structure.
 */
export function validateData<T>(
    schema: z.ZodSchema<T>,
    data: unknown,
    context: string = 'Unknown Context'
): T {
    try {
        return schema.parse(data);
    } catch (error) {
        if (error instanceof z.ZodError) {
            console.error(`❌ SCHEMA VALIDATION FAILED in [${context}]`);
            console.error('Expected Schema:', schema.description || 'Generic Schema');
            console.error('Received Data:', data);
            console.error('Validation Errors:', (error as any).errors);

            // In development, throw to alert the developer immediately
            if (import.meta.env?.MODE === 'development') {
                throw new Error(`Schema validation failed in ${context}: ${JSON.stringify((error as any).errors, null, 2)}`);
            }
        }
        // In production, we might want to log to Sentry but return the data (best effort)
        // or return a safe fallback depending on the strategy.
        // For now, rethrow to ensure data integrity.
        throw error;
    }
}

/**
 * Safe parser that returns null instead of throwing on failure.
 * Good for optional checks.
 */
export function safeValidateData<T>(
    schema: z.ZodSchema<T>,
    data: unknown,
    context: string = 'Unknown Context'
): T | null {
    const result = schema.safeParse(data);
    if (!result.success) {
        console.warn(`⚠️ Soft validation failure in [${context}]:`, (result.error as any).formErrors);
        return null;
    }
    return result.data;
}
